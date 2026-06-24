#!/usr/bin/env bash
# Создаёт /data/users.yml для Dozzle (логин из LOGS_USER / LOGS_PASSWORD в .env).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Create .env first"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${LOGS_USER:?Set LOGS_USER in .env}"
: "${LOGS_PASSWORD:?Set LOGS_PASSWORD in .env}"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

resolve_dozzle_volume() {
  local project volume
  project="$("${COMPOSE[@]}" config --format '{{.Name}}' 2>/dev/null || basename "$(pwd)")"
  volume="$("${COMPOSE[@]}" volume ls -q 2>/dev/null | grep dozzle_data | head -1 || true)"
  if [ -z "$volume" ]; then
    volume="${project}_dozzle_data"
    docker volume inspect "$volume" >/dev/null 2>&1 || docker volume create "$volume" >/dev/null
  fi
  echo "$volume"
}

echo "=== Generating Dozzle users.yml for user: ${LOGS_USER} ==="

# Dozzle с DOZZLE_AUTH_PROVIDER=simple не стартует без users.yml — пишем файл до запуска.
"${COMPOSE[@]}" stop dozzle 2>/dev/null || true

docker run --rm --entrypoint /dozzle amir20/dozzle:latest \
  generate "$LOGS_USER" \
  --password "$LOGS_PASSWORD" \
  --name "Developer" \
  > /tmp/dozzle-users.yml

VOLUME="$(resolve_dozzle_volume)"

docker run --rm \
  -v "${VOLUME}:/data" \
  -v /tmp/dozzle-users.yml:/users.yml:ro \
  alpine:3.20 \
  cp /users.yml /data/users.yml

rm -f /tmp/dozzle-users.yml

echo "=== Starting Dozzle (volume: ${VOLUME}) ==="
"${COMPOSE[@]}" up -d dozzle

sleep 3
if ! "${COMPOSE[@]}" ps dozzle 2>/dev/null | grep -q "Up"; then
  echo "Dozzle failed to start. Logs:" >&2
  "${COMPOSE[@]}" logs --tail=30 dozzle >&2 || true
  exit 1
fi

echo ""
echo "Done. Open https://${LOGS_DOMAIN:-logs.your-domain}"
echo "Login: ${LOGS_USER}"
