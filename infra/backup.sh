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
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
MODE="${1:-all}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

usage() {
  cat <<'EOF'
Создаёт резервную копию данных из Docker volumes.

Использование:
  ./infra/backup.sh [all|db|uploads]

  all      — дамп БД + архив медиа (по умолчанию)
  db       — только PostgreSQL
  uploads  — только volume uploads_data (видео, фото, превью)

Переменные окружения:
  BACKUP_DIR             — каталог для архивов (по умолчанию ./backups)
  BACKUP_RETENTION_DAYS  — удалять архивы старше N дней (0 = не удалять)
  USE_PROD_COMPOSE=0     — не подключать docker-compose.prod.yml

Перед запуском поднимите стек:
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
EOF
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

backup_db() {
  require_postgres
  mkdir -p "$BACKUP_DIR"

  local outfile="$BACKUP_DIR/db-${STAMP}.sql.gz"
  echo "→ Дамп PostgreSQL → ${outfile}"

  compose exec -T postgres pg_dump \
    -U "$DB_USER" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$DB_NAME" | gzip >"$outfile"

  ln -sfn "$(basename "$outfile")" "$BACKUP_DIR/db-latest.sql.gz"
  echo "✓ БД сохранена ($(du -h "$outfile" | awk '{print $1}'))"
}

backup_uploads() {
  mkdir -p "$BACKUP_DIR"

  local volume outfile
  volume="$(resolve_uploads_volume)"
  outfile="$BACKUP_DIR/uploads-${STAMP}.tar.gz"

  echo "→ Архив медиа (${volume}) → ${outfile}"

  docker run --rm \
    -v "${volume}:/data:ro" \
    alpine:3.20 \
    tar czf - -C /data . >"$outfile"

  ln -sfn "$(basename "$outfile")" "$BACKUP_DIR/uploads-latest.tar.gz"
  echo "✓ Медиа сохранены ($(du -h "$outfile" | awk '{print $1}'))"
}

prune_old_backups() {
  if [[ "$RETENTION_DAYS" -le 0 ]]; then
    return
  fi

  echo "→ Удаление архивов старше ${RETENTION_DAYS} дн."
  find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' \) \
    -mtime "+${RETENTION_DAYS}" -delete
}

case "$MODE" in
  all)
    backup_db
    backup_uploads
    prune_old_backups
    echo ""
    echo "Готово. Файлы в ${BACKUP_DIR}/"
    echo "  db-latest.sql.gz"
    echo "  uploads-latest.tar.gz"
    ;;
  db)
    backup_db
    prune_old_backups
    ;;
  uploads)
    backup_uploads
    prune_old_backups
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    echo "Неизвестный режим: ${MODE}" >&2
    usage >&2
    exit 1
    ;;
esac
