#!/bin/sh
set -eu

python manage.py migrate --noinput
python manage.py collectstatic --noinput

case "${AUTO_SEED_USERS:-false}" in
    true|1|yes|on)
        python manage.py seed_users
        ;;
esac

exec "$@"
