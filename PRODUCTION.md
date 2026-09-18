# Production deployment — Coolify on 40.82.129.6, port 3001

Target VM: `40.82.129.6`. **Port 3000 is already used by another site on that
VM**, so Leaflet runs on **port 3001**. Appwrite also runs on this same VM at
`http://40.82.129.6/v1`.

## What's in this repo

| File | Purpose |
| --- | --- |
| `compose.yaml` | Coolify-ready compose: host **3001 → container 3000**, build args, healthcheck |
| `nixpacks.toml` | Makes Coolify's **Nixpacks** build pack work: pins Node 22, assembles the standalone server, starts `server.js` |
| `Dockerfile` | Multi-stage build → small standalone image, runs as non-root |
| `src/app/api/health/route.ts` | `GET /api/health` liveness endpoint for Coolify health checks |
| `deploy.sh` | Alternative: SSH-based deploy (build locally, ship to the VM) |
| `nginx/leaflet.conf` | Optional nginx reverse proxy (not needed with Coolify) |

## Coolify build pack: Dockerfile or Nixpacks?

- **Dockerfile** (preferred): set Build Pack to "Dockerfile" — the repo's
  `Dockerfile` handles everything (Node 22, standalone output, non-root).
- **Nixpacks** (Coolify's default): also works out of the box thanks to
  `nixpacks.toml`. Without it, Nixpacks builds with Node 18 (EOL) and fails —
  Next.js 16 requires ≥ 20.9, and `next start` can't serve standalone output.

Either way, mark the `NEXT_PUBLIC_*` variables as **build-time variables** in
Coolify so they get baked into the client bundle.

## Deploying with Coolify (recommended)

**1. Push this repo to a git remote** (GitHub/GitLab) — Coolify builds from
source. Make sure `compose.yaml` is committed.

**2. In Coolify (at `http://40.82.129.6:8000` or wherever it's installed):**

- **New Resource → Docker Compose** (or "Dockerfile Empty" with
  `Dockerfile` if you prefer a single-container resource)
- Point it at this repo + branch, and select **`compose.yaml`** as the compose
  file
- **Domain:** enter `http://40.82.129.6:3001` — this matters! Coolify routes
  domains through its internal proxy; if you don't set a domain, the app is
  only reachable on the published compose port. Alternatively leave the domain
  empty and access it via the raw published port.
- **Port:** the container listens on **3000** (already correct in
  `compose.yaml`); the host side is fixed at **3001** so it never collides
  with the other site on 3000.

**3. Environment Variables** (Coolify → your app → Environment Variables):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | `http://40.82.129.6/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | your Appwrite project id |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | `main` (or yours) |
| `APPWRITE_API_KEY` | server-only secret |
| `OPENROUTER_API_KEY` | optional, for AI features |

`NEXT_PUBLIC_*` values are **baked at build time** — after changing any of
them, hit **Redeploy** so the build picks them up. Server-only secrets
(`APPWRITE_API_KEY`, `OPENROUTER_API_KEY`) are read at runtime.

**4. Health check:** Coolify can use `GET /api/health` (already wired as the
compose `healthcheck`; set it in Coolify's health-check dialog too). The
container returns `{"status":"ok"}` when live.

**5. Deploy.** Coolify builds the image on the VM and starts the container.
Re-deploys are just **Redeploy** after a new push.

### If you use Coolify's proxy

Coolify (Traefik) routes by domain. For plain-IP hosting it's simplest to rely
on the published compose port (`3001`) rather than the proxy: leave the
domain empty, or set it to `http://40.82.129.6:3001` as noted above. If you
later add a real domain, set the domain in Coolify and Coolify terminates
HTTP(S) for you — no nginx needed, and the site on port 3000 stays untouched.

### Firewall

Open inbound **TCP 3001** in the Azure NSG (and any host firewall). Leave
port 3000 alone — that's the other site's.

## Alternative: script deploys (no Coolify)

Two legacy paths are kept in the repo:

- `vps-deploy.sh` (run ON the VM): Docker if present, else bare Node + systemd.
  If you removed it, the equivalent is: upload the project incl. `.env.local`,
  then `docker compose up -d --build` from this folder — the compose file does
  the same thing.
- `deploy.sh` (SSH from your machine): builds locally, ships the image over
  SSH, runs the container on `0.0.0.0:3001`.

## Verify

```bash
curl -I http://40.82.129.6:3001/                 # app
curl -s http://40.82.129.6:3001/api/health       # {"status":"ok",...}
curl -I http://40.82.129.6:3000/                 # confirm the other site still works
```

## Common issues

| Symptom | Fix |
| --- | --- |
| Connection times out on 3001 | NSG not open: add an inbound allow rule for TCP 3001 |
| Coolify shows "healthy" but the page won't load from outside | The proxy/domain isn't set — use the published port `3001`, or set the domain in Coolify |
| Build fails with missing NEXT_PUBLIC_* | The env vars aren't set in Coolify — add them, then Redeploy |
| Covers/preview 404 after deploy | Old records with URL-shaped file ids are handled by `fileIdOf()`; re-save the book in admin |
| AI features error 503 | `OPENROUTER_API_KEY` missing — add it in Coolify env and Redeploy |
| CORS errors in the browser | Add `http://40.82.129.6:3001` as a Web platform in the Appwrite console |

## HTTPS (recommended next step)

TLS requires a domain — plain IPs can't get certificates. Point a domain at
`40.82.129.6`, set it as the app's domain in Coolify, and Coolify obtains and
renews certificates automatically (Let's Encrypt) through its proxy. The
existing site on port 3000 is unaffected.
