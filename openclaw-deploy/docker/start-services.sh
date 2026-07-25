#!/usr/bin/env bash
set -euo pipefail

# Load env values from a mounted secret file when present.
# Render secret files are typically mounted under /etc/secrets/.
ENV_FILE_PATH="${ENV_FILE_PATH:-}"
if [[ -z "${ENV_FILE_PATH}" && -f "/etc/secrets/.env-prod" ]]; then
  ENV_FILE_PATH="/etc/secrets/.env-prod"
fi

if [[ -n "${ENV_FILE_PATH}" ]]; then
  if [[ ! -f "${ENV_FILE_PATH}" ]]; then
    echo "Configured ENV_FILE_PATH does not exist: ${ENV_FILE_PATH}" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE_PATH}"
  set +a
  echo "Loaded environment from ${ENV_FILE_PATH}"
fi

PUBLIC_PORT="${PORT:-8080}"
OPENCLAW_INTERNAL_PORT="${OPENCLAW_INTERNAL_PORT:-18080}"
export LINKEDIN_WORKER_HOST="${LINKEDIN_WORKER_HOST:-0.0.0.0}"
export LINKEDIN_WORKER_PORT="${LINKEDIN_WORKER_PORT:-$PUBLIC_PORT}"
export OPENCLAW_UPSTREAM_URL="${OPENCLAW_UPSTREAM_URL:-http://127.0.0.1:${OPENCLAW_INTERNAL_PORT}}"

echo "Worker public bind: ${LINKEDIN_WORKER_HOST}:${LINKEDIN_WORKER_PORT}"
echo "OpenClaw internal bind: 127.0.0.1:${OPENCLAW_INTERNAL_PORT}"

PORT="${OPENCLAW_INTERNAL_PORT}" java -jar /app/openclaw-launcher.jar &
GATEWAY_PID=$!

echo "Started OpenClaw launcher (pid=${GATEWAY_PID})"

node /app/linkedin-worker/src/server.js &
WORKER_PID=$!

echo "Started LinkedIn worker (pid=${WORKER_PID})"

cleanup() {
  kill "${WORKER_PID}" "${GATEWAY_PID}" 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM EXIT

wait -n "${WORKER_PID}" "${GATEWAY_PID}"
EXIT_CODE=$?

cleanup
wait || true

exit "${EXIT_CODE}"
