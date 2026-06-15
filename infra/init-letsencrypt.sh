#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Create .env from .env.example first: cp .env.example .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DOMAIN:?Set DOMAIN in .env (e.g. portfolio.example.com)}"
: "${ADMIN_DOMAIN:?Set ADMIN_DOMAIN in .env (e.g. admin.portfolio.example.com)}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
STAGING_ARG=""
if [ "${CERTBOT_STAGING:-0}" = "1" ]; then
  STAGING_ARG="--staging"
  echo "Using Let's Encrypt STAGING (test certificates)"
fi

echo "=== 1/4 Starting services (nginx in bootstrap mode) ==="
$COMPOSE up -d --build

echo "=== 2/4 Requesting SSL certificate ==="
$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  $STAGING_ARG \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "$ADMIN_DOMAIN"

echo "=== 3/4 Enabling HTTPS in nginx ==="
$COMPOSE up -d --force-recreate nginx

echo "=== 4/4 Starting certbot auto-renewal ==="
$COMPOSE up -d certbot

echo ""
echo "Done!"
echo "  Landing: https://${DOMAIN}"
echo "  Admin:   https://${ADMIN_DOMAIN}"
echo ""
echo "Add to crontab for certificate renewal (optional but recommended):"
echo "  0 3 * * * $(pwd)/infra/renew-certs.sh >> /var/log/cloth-cert-renew.log 2>&1"
