# Production deployment — Azure VM (40.82.129.6) + Docker

Target VM: `40.82.129.6`. **Port 3000 is already used by another site on that
VM**, so Leaflet runs on **port 3001**. Appwrite also runs on this same VM at
`http://40.82.129.6/v1`.

## What's in this repo

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build → small standalone image, runs as non-root |
| `.dockerignore` | Keeps secrets (`/.env.local`) and junk out of the image |
| `deploy.sh` | One command: build → ship over SSH → run container on host port 3001 |
| `nginx/leaflet.conf` | OPTIONAL nginx reverse proxy on port 3001 (does not touch port 80) |

## 1. One-time VM preparation

SSH into the VM once (`ssh azureuser@40.82.129.6`) and install Docker if missing:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # re-login after this
```

Also make sure the Azure NSG / firewall allows inbound **TCP 3001** (port 80
belongs to the other site — leave it alone).

## 2. Deploy

From the project root on your machine:

```bash
./deploy.sh            # build + ship + run on http://40.82.129.6:3001
```

The script reads `.env.local` automatically. It:

1. Bakes `NEXT_PUBLIC_*` vars into the build (they are public by design)
2. Saves the image to a gzip tarball and `scp`s it to the VM
3. Copies `.env.local` to `/opt/leaflet/.env` on the VM (secrets stay server-side)
4. Restarts a container named `leaflet`, publishing the container's :3000 on
   the host's **0.0.0.0:3001** — direct Docker, no nginx in the path, so the
   existing site on port 3000 is untouched

Options: `--no-build` (reuse last image), `APP_PORT=... ./deploy.sh` to change
the host port, `AZURE_USER=... SSH_KEY=... ./deploy.sh` to override SSH settings.

### Optional: nginx in front (instead of direct Docker)

If you'd rather have nginx serve port 3001 (gzip, 320MB upload limit, caching),
use `deploy.sh --nginx` **with a private container bind** — nginx and Docker
cannot both bind 3001:

```bash
APP_PORT=127.0.0.1:3001 ./deploy.sh --nginx
```

The bundled `nginx/leaflet.conf` listens on **3001 only** and never touches
port 80 or 3000, so installing it cannot disrupt the other site.

## 3. Environment variables

**Baked at build time** (safe to be public):
- `NEXT_PUBLIC_APPWRITE_ENDPOINT` (e.g. `http://40.82.129.6/v1`)
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`

**Runtime only** (in `/opt/leaflet/.env` on the VM — never in the image):
- `APPWRITE_API_KEY`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

## 4. Verify

```bash
curl -I http://40.82.129.6:3001/                 # Docker → app
curl -s http://40.82.129.6:3001/books -o /dev/null -w "%{http_code}\n"
ssh azureuser@40.82.129.6 'sudo docker logs -f leaflet'
```

Also confirm the other site still works: `curl -I http://40.82.129.6:3000/`.

## 5. Common issues

| Symptom | Fix |
| --- | --- |
| Connection times out on 3001 | NSG not open: add an inbound allow rule for TCP 3001 |
| `port is already allocated` on deploy | Something else took 3001 — check `sudo ss -tlnp \| grep 3001`, or deploy with `APP_PORT=3002` |
| Container running but page won't load | `sudo docker ps`, then `sudo docker logs leaflet` |
| Uploads >100MB fail | Direct Docker has no body-size limit; if you use the optional nginx path, `client_max_body_size` is already 320M |
| Covers 404 after deploy | Old records with URL-shaped file ids are handled by `fileIdOf()`; re-save the book in admin if one was created before that fix |
| AI features error 503 | `OPENROUTER_API_KEY` missing in `/opt/leaflet/.env` — add it and `sudo docker restart leaflet` |
| Appwrite unreachable from container | Appwrite runs on the same VM — the app should reach it via `http://40.82.129.6/v1`; check the VM's local firewall (ufw/iptables) if it fails |

## 6. Updates

Push new code → run `./deploy.sh` again. The image is rebuilt, shipped, and the container is replaced with `--restart unless-stopped`, so reboots keep the app up.

## 7. HTTPS (recommended next step)

TLS requires a domain — plain IPs can't get certificates. Point a domain at
`40.82.129.6`, then on the VM:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

- **Optional nginx setup:** add `server_name yourdomain.com;` to
  `/etc/nginx/sites-available/leaflet.conf`, then run
  `sudo certbot --nginx -d yourdomain.com`. Certbot adds a 443 server block
  that proxies to the app and auto-renews. It only touches server blocks
  matching your domain, so the site on port 3000 is unaffected.
- **Direct Docker setup:** create a small nginx server block on 443 that
  proxies to `127.0.0.1:3001` (rebind the container privately as shown in
  section 2), and obtain the certificate with
  `sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com` after
  adding a temporary port-80 challenge block with your domain's server_name
  (distinct `server_name` values coexist safely on port 80).
