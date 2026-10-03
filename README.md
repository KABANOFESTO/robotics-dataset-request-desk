# Dataset Request Desk

[![CI](https://github.com/KABANOFESTO/robotics-dataset-request-desk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/KABANOFESTO/robotics-dataset-request-desk/actions/workflows/ci.yml)
[![Backend coverage](https://codecov.io/gh/KABANOFESTO/robotics-dataset-request-desk/branch/main/graph/badge.svg)](https://codecov.io/gh/KABANOFESTO/robotics-dataset-request-desk/tree/main)

A role-based workspace for requesting and fulfilling robotics dataset tasks. Clients submit and review requests, operators assign eligible episodes and manage delivery, and admins manage users and monitor activity.

**Live demo:** [robotics-dataset-request-desk.vercel.app](https://robotics-dataset-request-desk.vercel.app/)

## Reviewer accounts

Use these demo accounts to explore each role in the live app or a local Docker setup.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `admin123` |
| Operator | `ops1@example.com` | `ops123` |
| Operator | `ops2@example.com` | `ops123` |
| Client | `client-a@example.com` | `client123` |
| Client | `client-b@example.com` | `client123` |

These are shared demo credentials for this review project only. Do not use them for real accounts or sensitive data.

## Run locally with Docker

Install and start Docker Desktop, then run these commands from a terminal:

```sh
git clone https://github.com/KABANOFESTO/robotics-dataset-request-desk.git
cd robotics-dataset-request-desk
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:8000/healthz/](http://localhost:8000/healthz/). Docker applies migrations and creates any missing review accounts. PostgreSQL data persists between runs.

Stop the app with:

```sh
docker compose down
```

Start it again with `docker compose up`. To rebuild after changing code or dependencies, use `docker compose up --build`. To delete the local database and its data, use `docker compose down --volumes`.

If port `3000` is occupied, `./docker/start.sh` stops the process using that port, then rebuilds and starts the project.

## Tests and coverage

Run the backend tests from the project root:

```sh
cd be
python -m pytest
```

Coverage reports are written to `be/htmlcov/index.html` and `be/coverage.xml`. GitHub Actions uploads backend coverage to Codecov; frontend CI runs lint and a production build.

## Project guides

- [Backend guide](be/README.md) — setup, Render configuration, API, data import, and tests.
- [Frontend guide](fe/README.md) — routes, structure, and local development.
- [Design notes](NOTES.md) — decisions, limitations, security, and scaling considerations.
