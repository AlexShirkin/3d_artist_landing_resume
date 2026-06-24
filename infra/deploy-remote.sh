#!/usr/bin/env bash
# Выполняется на сервере: git pull + пересборка одного или нескольких compose-сервисов.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Использование: deploy-remote.sh <service> [service...]" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.yml)
if [[ -f docker-compose.prod.yml ]] && [[ "${USE_PROD_COMPOSE:-1}" == "1" ]]; then
  COMPOSE+=(-f docker-compose.prod.yml)
fi

echo "=== Git sync ==="
git fetch origin main
git reset --hard origin/main

for SERVICE in "$@"; do
  echo "=== Deploy: ${SERVICE} ==="
  "${COMPOSE[@]}" up -d --build "$SERVICE"
done

if [[ "${PRUNE_IMAGES:-1}" == "1" ]]; then
  docker image prune -f
fi

echo "=== Done: $* ==="
