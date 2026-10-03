# Dataset Request Desk

[![CI](https://github.com/KABANOFESTO/robotics-dataset-request-desk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/KABANOFESTO/robotics-dataset-request-desk/actions/workflows/ci.yml)
[![Backend coverage](https://codecov.io/gh/KABANOFESTO/robotics-dataset-request-desk/branch/main/graph/badge.svg)](https://codecov.io/gh/KABANOFESTO/robotics-dataset-request-desk/tree/main)

A role-based app for clients to request robot episode datasets, operators to fulfil them, and admins to manage users. The backend is Django REST Framework with PostgreSQL; the frontend is Next.js 16 and TypeScript.

## Clone and start with Docker

Install Docker Desktop, clone the repository, then run these commands from the project folder:

```sh
git clone https://github.com/KABANOFESTO/robotics-dataset-request-desk.git
cd robotics-dataset-request-desk
docker compose build
docker compose up
```

Open <http://localhost:3000>. The API is at <http://localhost:8000>; its health check is <http://localhost:8000/healthz/>. Docker applies migrations and creates any missing review users before the API starts. Users and app data persist in the `postgres_data` volume.

Stop the app with `docker compose down`. To start it again, run `docker compose up`. If code or dependencies changed, rebuild first with `docker compose build`.

If port `3000` is already in use, `./docker/start.sh` stops the process using it and starts the app. The normal `docker compose down` command keeps the database and users. Only use `docker compose down --volumes` when you want to permanently delete local data and recreate the seeded users.

### Local review accounts

Docker seeds these local review accounts on first startup:

| Admin | `admin@example.com` |`admin123`
| Operator | `ops1@example.com` |`ops123`
| Client | `client-a@example.com` |`client123`

**Note:** Reviewer credentials are available in the seed data for testing. GitHub security checks may flag them, but they are test-only credentials.


The backend generates a random local-only password for each account and prints it in its startup output. Save the credentials the first time the database is seeded; existing users and passwords are preserved on later starts. If you need fresh credentials, `docker compose down --volumes` deletes the local database so the next startup can seed new accounts.

## Check and test

Run `cd be && python -m pytest`. For manual backend setup and migration commands, see [be/README.md](be/README.md).

The backend coverage badge reports the `pytest-cov` report uploaded from CI. Connect the repository to Codecov; if uploads require authentication, add its repository token as the GitHub Actions secret `CODECOV_TOKEN`. Coverage is backend-only: CI checks the frontend with lint and a production build, but there is no frontend coverage suite yet. Local coverage is written to `be/htmlcov/index.html` and `be/coverage.xml`.

## Documentation

- [Backend guide](be/README.md) — development, data import, and tests.
- [Frontend guide](fe/README.md) — routes, structure, and development.
- [Design notes](NOTES.md) — decisions, limitations, security, and scale.
- [Deployment guide](DEPLOYMENT.md) — Render configuration and secrets.
