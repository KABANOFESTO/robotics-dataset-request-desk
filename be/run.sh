#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
if [ -x .venv/bin/python ]; then
    PYTHON=.venv/bin/python
else
    PYTHON=python
fi

"$PYTHON" manage.py migrate
"$PYTHON" manage.py seed_users
if [ "$#" -gt 0 ]; then
    exec "$PYTHON" manage.py runserver "$@"
fi
exec "$PYTHON" manage.py runserver 0.0.0.0:8000
