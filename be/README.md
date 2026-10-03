# Backend

Django REST Framework API for authentication, users, episodes, requests, assignments, and analytics. PostgreSQL is used by Docker and deployment; pytest uses an isolated in-memory SQLite database.

## Run locally

From this directory, create and activate a virtual environment, then install the development requirements:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
```

Copy `.env.example` to `.env` and set local values as needed. For a fresh database, apply the committed migrations and seed review users explicitly:

```sh
python manage.py migrate
python manage.py seed_users
python manage.py runserver
```

`makemigrations` creates migration files after model changes; it does not apply them or create users. On a clean clone, the migrations are already committed, so run it only after changing models:

```sh
python manage.py makemigrations
python manage.py migrate
```

`seed_users` reads `seed/users.json` when present, otherwise uses `seed/users.example.json` in debug mode. It creates missing accounts and leaves existing passwords unchanged. Use `python manage.py seed_users --help` to provide a different file. Never put production credentials in source control.

To create configured review users as part of `python manage.py migrate`, set `AUTO_SEED_USERS=true`. Provide the user data through `SEED_USERS_JSON` or `SEED_USERS_FILE`. On Render, put these values in the backend service's environment settings; migrations run at startup before Gunicorn. The seeder is idempotent and does not change existing accounts or passwords by default. For a one-time repair of existing demo logins, temporarily set `SEED_USERS_RESET_EXISTING_PASSWORDS=true`; it updates passwords only for emails in the seed data, then turn it off after the deploy. If a disposable review deployment must use the supplied weak demo passwords, set `SEED_USERS_ALLOW_WEAK_PASSWORDS=true` there only; keep it disabled for real user accounts.

For Render, set the service root directory to `be`, use `pip install -r requirements.txt` as the build command, and use this start command so migrations (and optional seeding) happen before the web server starts:

```sh
python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn be.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

Set `AUTO_SEED_USERS=true` in Render. The committed seed file is used by default; use `SEED_USERS_FILE` or `SEED_USERS_JSON` for private credentials. The provided reviewer passwords are weak and publicly known, so only enable `SEED_USERS_ALLOW_WEAK_PASSWORDS=true` for a disposable demo deployment.

## Import episode data

From `be/`, import the supplied CSV with:

```sh
python manage.py import_episodes ../seed/episodes.csv
```

The importer normalizes accepted values, skips duplicate episode IDs, and reports invalid rows. It accepts robots `arm-01`, `arm-02`, `arm-03`, `mobile-01`, and `humanoid-01`. Operators and admins can also import CSV from the app.

## Tests and coverage

```sh
python -m pytest
```

The suite covers authentication and user management, episode import, request permissions and transitions, assignments, and analytics. Coverage is written to `htmlcov/index.html` and `coverage.xml`; CI uploads both reports. See the root [README](../README.md) for the full review setup and [NOTES](../NOTES.md) for design limits.

## API entry points

- `POST /api/auth/token/` — obtain JWTs; `GET /api/auth/me/` — current user.
- `/api/requests/`, `/api/episodes/`, `/api/users/` — role-protected resources.
- `GET /api/analytics/` — date-range analytics.
- `GET /healthz/` — database-aware health check.
