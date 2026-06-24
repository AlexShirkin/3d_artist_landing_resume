#!/usr/bin/env bash
# Общие функции для backup/restore. Подключается из infra/*.sh

compose_project_name() {
  if [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
    echo "$COMPOSE_PROJECT_NAME"
    return
  fi

  local cid project svc
  for svc in portfolio-service postgres web admin gateway nginx; do
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

find_compose_volume_name() {
  local key="$1"

  if [[ "$key" == "uploads_data" && -n "${UPLOADS_VOLUME:-}" ]]; then
    echo "$UPLOADS_VOLUME"
    return
  fi

  if [[ "$key" == "certbot_certs" && -n "${CERTBOT_CERTS_VOLUME:-}" ]]; then
    echo "$CERTBOT_CERTS_VOLUME"
    return
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

  echo "$volume"
}

resolve_compose_volume() {
  local key="$1"
  local volume
  volume="$(find_compose_volume_name "$key")"

  if [[ "$key" == "uploads_data" && -n "${UPLOADS_VOLUME:-}" ]] && ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Ошибка: UPLOADS_VOLUME=${UPLOADS_VOLUME} не существует." >&2
    exit 1
  fi

  if [[ "$key" == "certbot_certs" && -n "${CERTBOT_CERTS_VOLUME:-}" ]] && ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Ошибка: CERTBOT_CERTS_VOLUME=${CERTBOT_CERTS_VOLUME} не существует." >&2
    exit 1
  fi

  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Ошибка: volume ${key} не найден (${volume})." >&2
    echo "Проверьте: docker volume ls | grep ${key}" >&2
    if [[ "$key" == "uploads_data" ]]; then
      echo "Или задайте вручную: UPLOADS_VOLUME=3d_artist_landing_resume_uploads_data" >&2
    elif [[ "$key" == "certbot_certs" ]]; then
      echo "Или задайте вручную: CERTBOT_CERTS_VOLUME=3d_artist_landing_resume_certbot_certs" >&2
    fi
    exit 1
  fi

  echo "$volume"
}

resolve_compose_volume_optional() {
  local key="$1"
  local volume
  volume="$(find_compose_volume_name "$key")"

  if docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "$volume"
    return 0
  fi

  return 1
}

archive_volume() {
  local volume="$1"
  local outfile="$2"

  docker run --rm \
    -v "${volume}:/data:ro" \
    alpine:3.20 \
    tar czf - -C /data . >"$outfile"
}

restore_volume() {
  local volume="$1"
  local file="$2"
  local abs_dir abs_file

  abs_dir="$(cd "$(dirname "$file")" && pwd)"
  abs_file="$(basename "$file")"

  docker run --rm \
    -v "${volume}:/data" \
    -v "${abs_dir}/${abs_file}:/backup/archive.tar.gz:ro" \
    alpine:3.20 \
    sh -c 'find /data -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar xzf /backup/archive.tar.gz -C /data'
}
