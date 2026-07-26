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

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blank lines.
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue

    # Support optional "export KEY=value".
    if [[ "$line" =~ ^[[:space:]]*export[[:space:]]+ ]]; then
      line="${line#export }"
    fi

    # Parse KEY=value without evaluating shell content.
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"

      # Trim leading/trailing whitespace around value.
      value="${value#${value%%[![:space:]]*}}"
      value="${value%${value##*[![:space:]]}}"

      # Remove matching single/double quotes around full value.
      if [[ "$value" =~ ^\".*\"$ ]]; then
        value="${value:1:-1}"
      elif [[ "$value" =~ ^\'.*\'$ ]]; then
        value="${value:1:-1}"
      fi

      # Preserve existing environment values (for example, Render dashboard vars)
      # and only backfill from secret file when missing.
      if [[ -z "${!key+x}" || -z "${!key}" ]]; then
        printf -v "$key" '%s' "$value"
        export "$key"
      fi
    fi
  done <"${ENV_FILE_PATH}"

  echo "Loaded environment from ${ENV_FILE_PATH}"
fi

PUBLIC_PORT="${PORT:-8080}"
OPENCLAW_INTERNAL_PORT="${OPENCLAW_INTERNAL_PORT:-18080}"
OPENCLAW_STARTUP_TIMEOUT_SEC="${OPENCLAW_STARTUP_TIMEOUT_SEC:-180}"
OPENCLAW_TMP_CONFIG_PATH="/tmp/openclaw.runtime.json"

mkdir -p /tmp/.openclaw/.openclaw/workspace >/dev/null 2>&1 || true

# On free-tier platforms without writable /data, fallback workspace to /tmp.
if [[ ! -w /data ]]; then
  if [[ -f /app/config/openclaw.json ]]; then
    sed 's|/data/.openclaw/.openclaw/workspace|/tmp/.openclaw/.openclaw/workspace|g' \
      /app/config/openclaw.json >"${OPENCLAW_TMP_CONFIG_PATH}"
    export OPENCLAW_CONFIG_PATH="${OPENCLAW_TMP_CONFIG_PATH}"
    echo "Detected non-writable /data; using runtime config at ${OPENCLAW_TMP_CONFIG_PATH}"
  fi
fi

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

wait_for_openclaw() {
  local waited=0
  while (( waited < OPENCLAW_STARTUP_TIMEOUT_SEC )); do
    if ! kill -0 "${GATEWAY_PID}" 2>/dev/null; then
      echo "OpenClaw launcher exited before startup completed" >&2
      return 1
    fi

    if { exec 3<>"/dev/tcp/127.0.0.1/${OPENCLAW_INTERNAL_PORT}"; } 2>/dev/null; then
      exec 3>&-
      echo "OpenClaw internal port is ready after ${waited}s"
      return 0
    fi

    if (( waited > 0 && waited % 10 == 0 )); then
      echo "Waiting for OpenClaw internal port 127.0.0.1:${OPENCLAW_INTERNAL_PORT} (${waited}s elapsed)"
    fi

    sleep 1
    waited=$((waited + 1))
  done

  echo "Timed out waiting for OpenClaw internal port 127.0.0.1:${OPENCLAW_INTERNAL_PORT}" >&2
  return 1
}

if ! wait_for_openclaw; then
  kill "${WORKER_PID}" 2>/dev/null || true
  kill "${GATEWAY_PID}" 2>/dev/null || true
  wait "${GATEWAY_PID}" 2>/dev/null || true
  wait "${WORKER_PID}" 2>/dev/null || true
  exit 1
fi

cleanup() {
  kill "${WORKER_PID}" "${GATEWAY_PID}" 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM EXIT

wait -n "${WORKER_PID}" "${GATEWAY_PID}"
EXIT_CODE=$?

cleanup
wait || true

exit "${EXIT_CODE}"
