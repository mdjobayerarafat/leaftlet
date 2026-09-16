# Production deployment — Azure VM + Docker + nginx

Target VM: `20.196.137.40` (Appwrite already runs there at `http://40.82.129.6/v1`).

## What's in this repo

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build → small standalone image, runs as non-root |
| `.dockerignore` | Keeps secrets (`/.env.local`) and junk out of the image |
| `deploy.sh` | One command: build → ship over SSH → run container (+ `--nginx` to install the proxy config) |
| `nginx/leaflet.conf` | nginx reverse proxy: port 80 → container :3000, 320MB uploads, caching |

## 1. One-time VM preparation

SSH into the VM once (`ssh azureuser@20.196.137.40`) and install Docker + nginx if missing:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # re-login after this
sudo apt update && sudo apt install -y nginx
```

## 2. Deploy

From the project root on your machine:

```bash
./deploy.sh            # build + ship + run
./deploy.sh --nginx    # first time: also install the nginx site config
```

The script reads `.env.local` automatically. It:

1. Bakes `NEXT_PUBLIC_*` vars into the build (they are public by design)
2. Saves the image to a gzip tarball and `scp`s it to the VM
3. Copies `.env.local` to `/opt/leaflet/.env` on the VM (secrets stay server-side)
4. Restarts a container named `leaflet`, bound to `127.0.0.1:3000` (nginx fronts it)

Options: `--no-build` (reuse last image), `AZURE_USER=... SSH_KEY=... ./deploy.sh` to override SSH settings.

## 3. Environment variables

**Baked at build time** (safe to be public):
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`

**Runtime only** (in `/opt/leaflet/.env` on the VM — never in the image):
- `APPWRITE_API_KEY`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

## 4. Verify

```bash
curl -I http://20.196.137.40/                 # nginx → app
curl -s http://20.196.137.40/books -o /dev/null -w "%{http_code}\n"
ssh azureuser@20.196.137.40 'sudo docker logs -f leaflet'
```

## 5. Common issues

| Symptom | Fix |
| --- | --- |
| 502 from nginx | Container not running: `sudo docker ps`, check `sudo docker logs leaflet` |
| Uploads >100MB fail | `client_max_body_size` is already 320M in `nginx/leaflet.conf`; if you use Azure NSG rules, allow port 80 |
| Covers 404 after deploy | Old records with URL-shaped file ids are handled by `fileIdOf()`; re-save the book in admin if one was created before that fix |
| AI features error 503 | `OPENROUTER_API_KEY` missing in `/opt/leaflet/.env` — add it and `sudo docker restart leaflet` |
| Appwrite unreachable from container | Appwrite and the app are on different VMs; ensure the Appwrite endpoint (`40.82.129.6`) allows inbound port 80 from the app VM |

## 6. Updates

Push new code → run `./deploy.sh` again. The image is rebuilt, shipped, and the container is replaced with `--restart unless-stopped`, so reboots keep the app up.

## 7. HTTPS (recommended next step)

Point a domain at `20.196.137.40`, then on the VM:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot rewrites `nginx/leaflet.conf` to serve TLS and auto-renews.
