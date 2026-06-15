#!/bin/sh
set -e

: "${DOMAIN:?DOMAIN is required}"
: "${ADMIN_DOMAIN:?ADMIN_DOMAIN is required}"

mkdir -p /etc/nginx/conf.d

export DOMAIN ADMIN_DOMAIN

if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "SSL certificate found — enabling HTTPS"
  envsubst '${DOMAIN} ${ADMIN_DOMAIN}' < /etc/nginx/templates/app-http-redirect.conf > /etc/nginx/conf.d/00-http.conf
  envsubst '${DOMAIN} ${ADMIN_DOMAIN}' < /etc/nginx/templates/app-ssl.conf > /etc/nginx/conf.d/10-ssl.conf
else
  echo "No SSL certificate yet — HTTP bootstrap mode (ACME challenge only)"
  envsubst '${DOMAIN} ${ADMIN_DOMAIN}' < /etc/nginx/templates/app-http-bootstrap.conf > /etc/nginx/conf.d/00-http.conf
fi

exec nginx -g 'daemon off;'
