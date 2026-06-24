#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILES=(-f docker-compose.yml)
if [[ -f docker-compose.prod.yml ]] && [[ "${USE_PROD_COMPOSE:-1}" == "1" ]]; then
  COMPOSE_FILES+=(-f docker-compose.prod.yml)
fi

compose() {
  docker compose "${COMPOSE_FILES[@]}" "$@"
}

# shellcheck source=compose-env.sh
source "$(dirname "$0")/compose-env.sh"

DB_USER="${POSTGRES_USER:-cloth}"
DB_NAME="${POSTGRES_DB:-cloth_portfolio}"
FORCE="${FORCE:-0}"

usage() {
  cat <<'EOF'
Восстанавливает данные из резервной копии в Docker volumes.

Использование:
  ./infra/restore.sh db <файл.sql.gz>
  ./infra/restore.sh uploads <файл.tar.gz>
  ./infra/restore.sh certs <файл.tar.gz>
  ./infra/restore.sh all <файл.sql.gz> [файл.tar.gz] [файл-certs.tar.gz]

Примеры:
  ./infra/restore.sh db backups/db-latest.sql.gz
  ./infra/restore.sh uploads backups/uploads-latest.tar.gz
  ./infra/restore.sh certs backups/certs-latest.tar.gz
  ./infra/restore.sh all backups/db-latest.sql.gz backups/uploads-latest.tar.gz backups/certs-latest.tar.gz

Перед восстановлением БД поднимите postgres:
  docker compose up -d postgres

Для uploads и certs контейнеры могут быть остановлены — volume монтируется напрямую.
После восстановления certs nginx перезапускается автоматически (если запущен).

Переменные:
  FORCE=1  — без подтверждения (для скриптов/cron)

Внимание: восстановление перезаписывает текущие данные.
После certs init-letsencrypt.sh запускать не нужно — сертификат уже на месте.
EOF
}

confirm() {
  if [[ "$FORCE" == "1" ]]; then
    return
  fi

  echo "Будут перезаписаны текущие данные."
  read -r -p "Продолжить? [y/N] " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 0
  fi
}

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "Ошибка: файл не найден: ${file}" >&2
    exit 1
  fi
}

require_postgres() {
  if ! compose ps --status running --services 2>/dev/null | grep -qx postgres; then
    echo "Ошибка: контейнер postgres не запущен." >&2
    echo "Запустите: docker compose up -d postgres" >&2
    exit 1
  fi
}

resolve_uploads_volume() {
  resolve_compose_volume uploads_data
}

resolve_certbot_certs_volume() {
  resolve_compose_volume certbot_certs
}

reload_nginx_if_running() {
  if compose ps --status running --services 2>/dev/null | grep -qx nginx; then
    echo "→ Перезапуск nginx для подхвата сертификата"
    compose up -d --force-recreate nginx
    compose up -d certbot 2>/dev/null || true
  else
    echo "→ nginx не запущен — после up -d сертификат подхватится автоматически"
  fi
}

restore_db() {
  local file="$1"
  local skip_confirm="${2:-0}"
  require_file "$file"
  require_postgres
  [[ "$skip_confirm" == "0" ]] && confirm

  echo "→ Восстановление БД из ${file}"

  gunzip -c "$file" | compose exec -T postgres psql \
    -v ON_ERROR_STOP=1 \
    -U "$DB_USER" \
    -d "$DB_NAME"

  echo "✓ База восстановлена"
}

restore_uploads() {
  local file="$1"
  local skip_confirm="${2:-0}"
  local volume
  require_file "$file"
  volume="$(resolve_uploads_volume)"
  [[ "$skip_confirm" == "0" ]] && confirm

  echo "→ Восстановление медиа в volume ${volume} из ${file}"

  restore_volume "$volume" "$file"

  echo "✓ Медиа восстановлены"
}

restore_certs() {
  local file="$1"
  local skip_confirm="${2:-0}"
  local volume
  require_file "$file"
  volume="$(resolve_certbot_certs_volume)"
  [[ "$skip_confirm" == "0" ]] && confirm

  echo "→ Восстановление SSL в volume ${volume} из ${file}"

  restore_volume "$volume" "$file"

  reload_nginx_if_running
  echo "✓ Сертификаты восстановлены"
}

MODE="${1:-}"
shift || true

case "$MODE" in
  db)
    [[ $# -ge 1 ]] || { echo "Укажите файл дампа." >&2; usage >&2; exit 1; }
    restore_db "$1"
    ;;
  uploads)
    [[ $# -ge 1 ]] || { echo "Укажите файл архива." >&2; usage >&2; exit 1; }
    restore_uploads "$1"
    ;;
  certs)
    [[ $# -ge 1 ]] || { echo "Укажите файл архива сертификатов." >&2; usage >&2; exit 1; }
    restore_certs "$1"
    ;;
  all)
    [[ $# -ge 1 ]] || { echo "Укажите файл дампа БД." >&2; usage >&2; exit 1; }
    confirm
    restore_db "$1" 1
    if [[ $# -ge 2 ]]; then
      restore_uploads "$2" 1
    else
      echo "→ Архив медиа не указан, пропуск uploads"
    fi
    if [[ $# -ge 3 ]]; then
      restore_certs "$3" 1
    else
      echo "→ Архив сертификатов не указан, пропуск certs"
    fi
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    echo "Укажите режим: db | uploads | certs | all" >&2
    usage >&2
    exit 1
    ;;
esac
