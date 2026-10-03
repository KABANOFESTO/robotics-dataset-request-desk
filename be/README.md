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

`seed_users` reads `seed/users.json` when present, otherwise uses `seed/users.example.json` in debug mode. It creates missing accounts and leaves existing passwords unchanged. Use `python manage.py seed_users --help` to provide a different file. Never put production credentials in source control. Set `AUTO_SETUP_ON_RUNSERVER=true` only if you explicitly want `runserver` to repeat migration and seeding automatically.

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
