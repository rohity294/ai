#!/usr/bin/env bash
set -euo pipefail

PORT_TO_CHECK="${PORT:-8080}"

# A lightweight TCP check for platforms that expect exposed port activity.
if command -v nc >/dev/null 2>&1; then
  nc -z 127.0.0.1 "${PORT_TO_CHECK}"
else
  # Fallback: verify launcher process is alive if netcat is unavailable.
  pgrep -f "openclaw-launcher.jar" >/dev/null
fi
