#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/fyp-portal}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
SKIP_DB_RESTART="${SKIP_DB_RESTART:-true}"
HEALTHCHECK_RETRIES="${HEALTHCHECK_RETRIES:-24}"
HEALTHCHECK_DELAY="${HEALTHCHECK_DELAY:-5}"
PROJECT_SLUG="$(basename "${PROJECT_DIR}" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')"
CURRENT_COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-${PROJECT_SLUG}}"

service_container_name() {
  local service_name="$1"
  case "${service_name}" in
    db) echo "fyp-mysql" ;;
    backend) echo "fyp-backend" ;;
    frontend) echo "fyp-frontend" ;;
    caddy) echo "fyp-caddy" ;;
    *) echo "" ;;
  esac
}

ensure_service_container_name_available() {
  local service_name="$1"
  local container_name
  container_name="$(service_container_name "${service_name}")"

  if [[ -z "${container_name}" ]]; then
    return
  fi

  if ! docker ps -a --format '{{.Names}}' | grep -qx "${container_name}"; then
    return
  fi

  local project_label
  local service_label
  project_label="$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "${container_name}" 2>/dev/null || true)"
  service_label="$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.service" }}' "${container_name}" 2>/dev/null || true)"

  if [[ "${project_label}" == "${CURRENT_COMPOSE_PROJECT}" && "${service_label}" == "${service_name}" ]]; then
    return
  fi

  echo "[deploy] Removing conflicting container ${container_name} (labels: project='${project_label:-none}', service='${service_label:-none}')"
  docker rm -f "${container_name}" >/dev/null || true
}

compose_has_service() {
  local service_name="$1"
  docker compose -f "${COMPOSE_FILE}" config --services | grep -qx "${service_name}"
}

build_services() {
  local services=()

  if compose_has_service backend; then
    services+=(backend)
  fi
  if compose_has_service frontend; then
    services+=(frontend)
  fi

  if [[ "${#services[@]}" -eq 0 ]]; then
    echo "[deploy] No buildable services found (expected backend and/or frontend)"
    exit 1
  fi

  docker compose -f "${COMPOSE_FILE}" build "${services[@]}"
}

start_services() {
  local services=()

  if [[ "${SKIP_DB_RESTART}" != "true" ]] && compose_has_service db; then
    services+=(db)
  fi
  if compose_has_service backend; then
    services+=(backend)
  fi
  if compose_has_service frontend; then
    services+=(frontend)
  fi
  if compose_has_service caddy; then
    services+=(caddy)
  fi

  if [[ "${#services[@]}" -eq 0 ]]; then
    echo "[deploy] No runnable services found"
    exit 1
  fi

  local service
  for service in "${services[@]}"; do
    ensure_service_container_name_available "${service}"
  done

  docker compose -f "${COMPOSE_FILE}" up -d "${services[@]}"
}

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "[deploy] Project directory not found: ${PROJECT_DIR}"
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ ! -d .git ]]; then
  echo "[deploy] ${PROJECT_DIR} is not a git repository"
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "[deploy] Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

PREVIOUS_COMMIT="$(git rev-parse HEAD)"
ROLLED_BACK="false"

rollback() {
  trap - ERR

  if [[ "${ROLLED_BACK}" == "true" ]]; then
    return
  fi
  ROLLED_BACK="true"

  echo "[rollback] Deploy failed, rolling back to ${PREVIOUS_COMMIT}"
  git reset --hard "${PREVIOUS_COMMIT}"

  build_services || true
  start_services || true

  echo "[rollback] Rollback completed (best effort)."
}

trap rollback ERR

echo "[deploy] Fetching origin/${BRANCH}"
git fetch --prune origin
TARGET_COMMIT="$(git rev-parse "origin/${BRANCH}")"

if [[ "${TARGET_COMMIT}" == "${PREVIOUS_COMMIT}" ]]; then
  echo "[deploy] No new commit to deploy"
  trap - ERR
  exit 0
fi

echo "[deploy] Deploying commit ${TARGET_COMMIT}"
git reset --hard "${TARGET_COMMIT}"

echo "[deploy] Validating compose file"
docker compose -f "${COMPOSE_FILE}" config -q

echo "[deploy] Building backend and frontend images"
build_services

echo "[deploy] Starting updated services"
start_services

echo "[deploy] Running backend health check"
for ((i = 1; i <= HEALTHCHECK_RETRIES; i++)); do
  if docker compose -f "${COMPOSE_FILE}" exec -T backend python - <<'PY'
import sys
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:5000/health", timeout=5) as response:
        body = response.read().decode("utf-8", "ignore").lower()
        if response.status == 200 and "healthy" in body:
            sys.exit(0)
except Exception:
    pass

sys.exit(1)
PY
  then
    echo "[deploy] Health check passed"
    trap - ERR
    echo "[deploy] Successfully deployed ${TARGET_COMMIT}"
    exit 0
  fi

  echo "[deploy] Health check attempt ${i}/${HEALTHCHECK_RETRIES} failed, retrying in ${HEALTHCHECK_DELAY}s"
  sleep "${HEALTHCHECK_DELAY}"
done

echo "[deploy] Health check failed after ${HEALTHCHECK_RETRIES} attempts"
exit 1
