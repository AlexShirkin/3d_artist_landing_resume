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

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "=== Generating Dozzle users.yml for user: ${LOGS_USER} ==="

$COMPOSE up -d dozzle
sleep 2

CID=$($COMPOSE ps -q dozzle)
if [ -z "$CID" ]; then
  echo "Dozzle container is not running" >&2
  exit 1
fi

docker exec "$CID" /dozzle generate "$LOGS_USER" \
  --password "$LOGS_PASSWORD" \
  --name "Developer" \
  > /tmp/dozzle-users.yml

docker cp /tmp/dozzle-users.yml "$CID":/data/users.yml
rm -f /tmp/dozzle-users.yml

$COMPOSE restart dozzle

echo ""
echo "Done. Open https://${LOGS_DOMAIN:-logs.your-domain}"
echo "Login: ${LOGS_USER}"
