#!/usr/bin/env bash
# Общие функции для backup/restore. Подключается из infra/*.sh

compose_project_name() {
  if [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
    echo "$COMPOSE_PROJECT_NAME"
    return
  fi

  local cid project svc
  for svc in portfolio-service postgres web admin gateway; do
    cid="$(compose ps -q "$svc" 2>/dev/null | head -1 || true)"
    if [[ -n "$cid" ]]; then
      project="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$cid" 2>/dev/null || true)"
      if [[ -n "$project" && "$project" != "<no value>" ]]; then
        echo "$project"
        return
      fi
    fi
  done

  basename "$ROOT_DIR"
}

resolve_compose_volume() {
  local key="$1"

  if [[ "$key" == "uploads_data" && -n "${UPLOADS_VOLUME:-}" ]]; then
    if docker volume inspect "$UPLOADS_VOLUME" >/dev/null 2>&1; then
      echo "$UPLOADS_VOLUME"
      return
    fi
    echo "Ошибка: UPLOADS_VOLUME=${UPLOADS_VOLUME} не существует." >&2
    exit 1
  fi

  local project volume
  project="$(compose_project_name)"

  volume="$(docker volume ls --format '{{.Name}}' | grep -E "^${project}_${key}$" | head -1 || true)"
  if [[ -z "$volume" ]]; then
    volume="$(docker volume ls --format '{{.Name}}' | grep "_${key}$" | head -1 || true)"
  fi
  if [[ -z "$volume" ]]; then
    volume="${project}_${key}"
  fi

  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Ошибка: volume ${key} не найден (${volume})." >&2
    echo "Проверьте: docker volume ls | grep ${key}" >&2
    echo "Или задайте вручную: UPLOADS_VOLUME=3d_artist_landing_resume_uploads_data" >&2
    exit 1
  fi

  echo "$volume"
}
