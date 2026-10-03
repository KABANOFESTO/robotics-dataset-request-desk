# Backend

Django REST Framework API for authentication, users, episodes, dataset requests, and analytics. PostgreSQL is used in deployment and Docker; automated tests use SQLite.

## Local setup

From `be/`, run:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_users
python manage.py runserver
```

The API runs at <http://localhost:8000>. Health check: <http://localhost:8000/healthz/>.

## Render deployment

Set the service root directory to `be`.

- **Build command:** `pip install -r requirements.txt`
- **Start command:**

```sh
python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn be.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

Set `AUTO_SEED_USERS=true` in the backend environment to create missing users from `seed/users.json` during migrations. Existing accounts and passwords are preserved. The supplied reviewer passwords are weak and public; use them only for the demo. Set `SEED_USERS_ALLOW_WEAK_PASSWORDS=true` only for that disposable review deployment.

## Episode import

From `be/`, import the supplied CSV with:

```sh
python manage.py import_episodes ../seed/episodes.csv
```

## API checks and tests

API endpoints were also checked manually with Postman. Run the automated backend tests from `be/`:

```sh
python -m pytest
```

Pytest writes `coverage.xml` and `htmlcov/`; GitHub Actions uploads the coverage report to Codecov. Main API routes include `/api/auth/`, `/api/users/`, `/api/episodes/`, `/api/requests/`, and `/api/analytics/`.
