#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

$COMPOSE run --rm -T --entrypoint certbot certbot renew --webroot -w /var/www/certbot
$COMPOSE exec nginx nginx -s reload

echo "Certificate renewal check complete."
