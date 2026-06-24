#!/usr/bin/env bash
# Определяет, какие docker compose сервисы нужно пересобрать по изменённым файлам.
# Вывод (GitHub Actions): services=<json-array>  has_changes=true|false

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAP_FILE="${MAP_FILE:-$ROOT_DIR/infra/deploy-services.map}"

declare -A SERVICE_PATHS=()
COMPOSE_PATHS=()
SHARED_PATH=""
SHARED_TARGETS=()
ALL_SERVICES=()

parse_map() {
  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" ]] && continue

    key="${line%%:*}"
    value="${line#*:}"

    case "$key" in
      @compose)
        IFS=',' read -ra COMPOSE_PATHS <<<"$value"
        ;;
      @shared)
        SHARED_PATH="$value"
        ;;
      @shared-targets)
        IFS=',' read -ra SHARED_TARGETS <<<"$value"
        ;;
      @*)
        echo "Неизвестное правило в ${MAP_FILE}: ${key}" >&2
        exit 1
        ;;
      *)
        SERVICE_PATHS["$key"]="$value"
        ALL_SERVICES+=("$key")
        ;;
    esac
  done <"$MAP_FILE"
}

collect_changed_files() {
  if [[ "${DEPLOY_ALL:-0}" == "1" ]]; then
    echo "__deploy_all__"
    return
  fi

  local before="${GITHUB_EVENT_BEFORE:-}"
  local sha="${GITHUB_SHA:-HEAD}"

  if [[ -n "$before" && "$before" != "0000000000000000000000000000000000000000" ]]; then
    git -C "$ROOT_DIR" diff --name-only "$before" "$sha"
  elif git -C "$ROOT_DIR" rev-parse HEAD~1 >/dev/null 2>&1; then
    git -C "$ROOT_DIR" diff --name-only HEAD~1 HEAD
  else
    git -C "$ROOT_DIR" show --pretty="" --name-only HEAD
  fi
}

path_matches() {
  local file="$1"
  local prefix="$2"
  [[ "$file" == "$prefix" || "$file" == "$prefix"* ]]
}

main() {
  parse_map

  declare -A TO_DEPLOY=()
  local file prefix service paths

  add_service() {
    TO_DEPLOY["$1"]=1
  }

  if [[ "${DEPLOY_ALL:-0}" == "1" ]]; then
    for service in "${ALL_SERVICES[@]}"; do
      add_service "$service"
    done
    add_service certbot
  else
    while IFS= read -r file; do
      [[ -z "$file" ]] && continue

      for prefix in "${COMPOSE_PATHS[@]}"; do
        if path_matches "$file" "$prefix"; then
          for service in "${ALL_SERVICES[@]}"; do
            add_service "$service"
          done
          add_service certbot
        fi
      done

      if [[ -n "$SHARED_PATH" ]] && path_matches "$file" "$SHARED_PATH"; then
        for service in "${SHARED_TARGETS[@]}"; do
          add_service "$service"
        done
      fi

      for service in "${!SERVICE_PATHS[@]}"; do
        paths="${SERVICE_PATHS[$service]}"
        IFS=',' read -ra prefixes <<<"$paths"
        for prefix in "${prefixes[@]}"; do
          if path_matches "$file" "$prefix"; then
            add_service "$service"
          fi
        done
      done
    done < <(collect_changed_files)
  fi

  local json="["
  local first=1
  for service in "${!TO_DEPLOY[@]}"; do
    [[ $first -eq 1 ]] || json+=","
    json+="\"${service}\""
    first=0
  done
  json+="]"

  if [[ "$json" == "[]" ]]; then
    echo "has_changes=false"
    echo "services=[]"
  else
    echo "has_changes=true"
    echo "services=${json}"
  fi
}

main
