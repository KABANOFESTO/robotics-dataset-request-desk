#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
if [ -x .venv/bin/python ]; then
    PYTHON=.venv/bin/python
elif command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
else
    PYTHON=python
fi

if [ "$#" -gt 0 ]; then
    exec "$PYTHON" manage.py runserver "$@"
fi
exec "$PYTHON" manage.py runserver 0.0.0.0:8000
