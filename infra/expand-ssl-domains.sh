#!/usr/bin/env bash
# Добавить LOGS_DOMAIN (и другие поддомены) в существующий сертификат Let's Encrypt.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Create .env from .env.example first"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DOMAIN:?}"
: "${ADMIN_DOMAIN:?}"
: "${CERTBOT_EMAIL:?}"
: "${LOGS_DOMAIN:?Set LOGS_DOMAIN in .env}"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

DOMAINS=(-d "$DOMAIN" -d "$ADMIN_DOMAIN" -d "$LOGS_DOMAIN")

echo "=== Expanding SSL certificate for: ${DOMAIN}, ${ADMIN_DOMAIN}, ${LOGS_DOMAIN} ==="

$COMPOSE run --rm -T --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  --expand \
  --non-interactive \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  "${DOMAINS[@]}"

$COMPOSE up -d --force-recreate nginx

echo ""
echo "Done! Check: https://${LOGS_DOMAIN}"
