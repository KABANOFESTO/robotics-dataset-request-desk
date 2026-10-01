# Dataset Request Desk frontend

Next.js App Router frontend for the Django REST API. This commit establishes the frontend structure; screens and authentication are intentionally scaffolded for incremental implementation.

## Development

```sh
npm ci
npm run dev
```

The frontend runs at `http://localhost:3000`. Set `API_BASE_URL` to the backend API root (defaults to `http://localhost:8000/api`).

## Production container

Build from this directory with `docker build -t dataset-request-desk-frontend .`. Next.js is configured for standalone output. The session cookie and API authentication flow are scaffolds and must be completed before the UI can be used end to end.

## Planned implementation sequence

1. Authentication: JWT exchange, HTTP-only session cookies, session reading, and login/logout.
2. Requests: client list/create, operator list, detail/history, and legal status actions.
3. Episodes: operator filters and request assignment.
4. Admin users (optional): create, deactivate, and change roles.
