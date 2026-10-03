#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(dirname "$SCRIPT_DIR")
cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required. Install Docker Desktop, then retry." >&2
    exit 1
fi

if ! command -v lsof >/dev/null 2>&1; then
    echo "lsof is required to check port 3000. Install it, then retry." >&2
    exit 1
fi

echo "Stopping this project's containers (database data is preserved)..."
docker compose down --remove-orphans

port_pids() {
    lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null | sort -u || true
}

PIDS=$(port_pids)
if [ -n "$PIDS" ]; then
    echo "Stopping process(es) using host port 3000: $PIDS"
    for PID in $PIDS; do
        kill -TERM "$PID" 2>/dev/null || true
    done

    ATTEMPTS=0
    while [ "$ATTEMPTS" -lt 25 ] && [ -n "$(port_pids)" ]; do
        sleep 0.2
        ATTEMPTS=$((ATTEMPTS + 1))
    done

    PIDS=$(port_pids)
    if [ -n "$PIDS" ]; then
        echo "Port 3000 is still occupied; force-stopping process(es): $PIDS"
        for PID in $PIDS; do
            kill -KILL "$PID" 2>/dev/null || true
        done
    fi
fi

exec docker compose up --build "$@"
