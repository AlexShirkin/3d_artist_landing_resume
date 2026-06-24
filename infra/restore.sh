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

DB_USER="${POSTGRES_USER:-cloth}"
DB_NAME="${POSTGRES_DB:-cloth_portfolio}"
FORCE="${FORCE:-0}"

usage() {
  cat <<'EOF'
Восстанавливает данные из резервной копии в Docker volumes.

Использование:
  ./infra/restore.sh db <файл.sql.gz>
  ./infra/restore.sh uploads <файл.tar.gz>
  ./infra/restore.sh all <файл.sql.gz> [файл.tar.gz]

Примеры:
  ./infra/restore.sh db backups/db-latest.sql.gz
  ./infra/restore.sh uploads backups/uploads-latest.tar.gz
  ./infra/restore.sh all backups/db-latest.sql.gz backups/uploads-latest.tar.gz

Перед восстановлением БД поднимите postgres:
  docker compose up -d postgres

Для uploads контейнер portfolio-service может быть остановлен — volume монтируется напрямую.

Переменные:
  FORCE=1  — без подтверждения (для скриптов/cron)

Внимание: восстановление перезаписывает текущие данные.
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
  local project volume
  project="$(compose config --format '{{.Name}}')"
  volume="$(docker volume ls \
    --filter "label=com.docker.compose.project=${project}" \
    --filter "label=com.docker.compose.volume=uploads_data" \
    --format '{{.Name}}' | head -1)"

  if [[ -z "$volume" ]]; then
    volume="${UPLOADS_VOLUME:-${project}_uploads_data}"
  fi

  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Ошибка: volume uploads_data не найден (${volume})." >&2
    echo "Сначала поднимите стек: docker compose up -d" >&2
    exit 1
  fi

  echo "$volume"
}

restore_db() {
  local file="$1"
  require_file "$file"
  require_postgres
  confirm

  echo "→ Восстановление БД из ${file}"

  gunzip -c "$file" | compose exec -T postgres psql \
    -v ON_ERROR_STOP=1 \
    -U "$DB_USER" \
    -d "$DB_NAME"

  echo "✓ База восстановлена"
}

restore_uploads() {
  local file volume
  file="$1"
  require_file "$file"
  volume="$(resolve_uploads_volume)"
  confirm

  echo "→ Восстановление медиа в volume ${volume} из ${file}"

  docker run --rm \
    -v "${volume}:/data" \
    -v "$(cd "$(dirname "$file")" && pwd)/$(basename "$file"):/backup/archive.tar.gz:ro" \
    alpine:3.20 \
    sh -c 'find /data -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar xzf /backup/archive.tar.gz -C /data'

  echo "✓ Медиа восстановлены"
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
  all)
    [[ $# -ge 1 ]] || { echo "Укажите файл дампа БД." >&2; usage >&2; exit 1; }
    restore_db "$1"
    if [[ $# -ge 2 ]]; then
      restore_uploads "$2"
    else
      echo "→ Архив медиа не указан, пропуск uploads"
    fi
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    echo "Укажите режим: db | uploads | all" >&2
    usage >&2
    exit 1
    ;;
esac
