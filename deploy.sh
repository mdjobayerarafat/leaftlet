#!/usr/bin/env bash
#
# Leaflet production deploy — builds the Docker image locally, ships it to the
# Azure VM over SSH, and (re)starts the container on host port 3001.
#
# Usage:
#   ./deploy.sh              # build + ship + run
#   ./deploy.sh --nginx      # also (re)install the nginx site config on the VM
#   ./deploy.sh --no-build   # reuse the previously built image tarball
#
# Required env (reads .env.local automatically, or export them first):
#   AZURE_HOST   — VM address (default 40.82.129.6; port 3000 is already in
#                  use there by another site, so Leaflet runs on 3001)
#   AZURE_USER   — SSH user (default azureuser)
#   SSH_KEY      — path to the private key (default ~/.ssh/id_rsa)
#   APP_PORT     — host port for the Leaflet container (default 3001)
set -euo pipefail

cd "$(dirname "$0")"

# ---- configuration ----------------------------------------------------------
AZURE_HOST="${AZURE_HOST:-40.82.129.6}"
AZURE_USER="${AZURE_USER:-azureuser}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
APP_PORT="${APP_PORT:-3001}"
APP_DIR="/opt/leaflet"
IMAGE_NAME="leaflet"
IMAGE_TAG="${IMAGE_TAG:-latest}"
TARBALL="leaflet-image.tar.gz"

INSTALL_NGINX=false
NO_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --nginx) INSTALL_NGINX=true ;;
    --no-build) NO_BUILD=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

log() { printf "\033[1;33m==>\033[0m %s\n" "$*"; }

# ---- load env ---------------------------------------------------------------
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

: "${NEXT_PUBLIC_APPWRITE_ENDPOINT:?Set NEXT_PUBLIC_APPWRITE_ENDPOINT in .env.local}"
: "${NEXT_PUBLIC_APPWRITE_PROJECT_ID:?Set NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local}"
: "${NEXT_PUBLIC_APPWRITE_DATABASE_ID:?Set NEXT_PUBLIC_APPWRITE_DATABASE_ID in .env.local}"
: "${APPWRITE_API_KEY:?Set APPWRITE_API_KEY in .env.local}"
SSH_TARGET="${AZURE_USER}@${AZURE_HOST}"

# ---- 1. build ---------------------------------------------------------------
if [ "$NO_BUILD" = false ]; then
  log "Building ${IMAGE_NAME}:${IMAGE_TAG} (NEXT_PUBLIC_* baked in at build time)"
  docker build \
    --build-arg NEXT_PUBLIC_APPWRITE_ENDPOINT="$NEXT_PUBLIC_APPWRITE_ENDPOINT" \
    --build-arg NEXT_PUBLIC_APPWRITE_PROJECT_ID="$NEXT_PUBLIC_APPWRITE_PROJECT_ID" \
    --build-arg NEXT_PUBLIC_APPWRITE_DATABASE_ID="$NEXT_PUBLIC_APPWRITE_DATABASE_ID" \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" .
else
  log "Skipping build (--no-build)"
fi

# ---- 2. pack ----------------------------------------------------------------
log "Packing image → ${TARBALL}"
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "$TARBALL"

# ---- 3. ship ----------------------------------------------------------------
log "Uploading to ${SSH_TARGET} (${APP_DIR})"
ssh -i "$SSH_KEY" "$SSH_TARGET" "sudo mkdir -p ${APP_DIR}"
scp -i "$SSH_KEY" "$TARBALL" "$SSH_TARGET:/tmp/${TARBALL}"
scp -i "$SSH_KEY" .env.local "$SSH_TARGET:/tmp/leaflet.env"

# ---- 4. run -----------------------------------------------------------------
log "Loading image and restarting container on the VM"
ssh -i "$SSH_KEY" "$SSH_TARGET" bash -s <<REMOTE
set -euo pipefail
sudo docker load -i /tmp/${TARBALL}
sudo mkdir -p ${APP_DIR}
sudo mv /tmp/leaflet.env ${APP_DIR}/.env
sudo chmod 600 ${APP_DIR}/.env
sudo docker stop leaflet >/dev/null 2>&1 || true
sudo docker rm leaflet >/dev/null 2>&1 || true
sudo docker run -d \
  --name leaflet \
  --restart unless-stopped \
  -p ${APP_PORT}:3000 \
  --env-file ${APP_DIR}/.env \
  ${IMAGE_NAME}:${IMAGE_TAG}
sudo docker image prune -f >/dev/null
rm /tmp/${TARBALL}
sudo docker ps --filter name=leaflet --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
REMOTE

# ---- 5. nginx (optional) ----------------------------------------------------
if [ "$INSTALL_NGINX" = true ]; then
  log "Installing nginx site config"
  scp -i "$SSH_KEY" nginx/leaflet.conf "$SSH_TARGET:/tmp/leaflet.conf"
  ssh -i "$SSH_KEY" "$SSH_TARGET" bash -s <<'REMOTE'
set -euo pipefail
if [ -d /etc/nginx/sites-enabled ]; then
  sudo mv /tmp/leaflet.conf /etc/nginx/sites-available/leaflet.conf
  sudo ln -sf /etc/nginx/sites-available/leaflet.conf /etc/nginx/sites-enabled/leaflet.conf
  # NOTE: do NOT remove /etc/nginx/sites-enabled/default here — this VM
  # already hosts another site and our config only listens on 3001.
else
  sudo mv /tmp/leaflet.conf /etc/nginx/conf.d/leaflet.conf
fi
sudo nginx -t
sudo systemctl reload nginx
REMOTE
fi

log "Deployed. App: http://${AZURE_HOST}:${APP_PORT} — container's :3000 is published on host port ${APP_PORT}"
log "Sanity check: curl -s -o /dev/null -w '%{http_code}' http://${AZURE_HOST}:${APP_PORT}/"
