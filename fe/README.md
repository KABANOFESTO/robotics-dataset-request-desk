# Frontend

Next.js 16 App Router frontend for the Dataset Request Desk. Routes are in `app/`; role-specific features are in `features/`; shared UI and Redux Toolkit Query setup are in `components/` and `lib/`.

## Run locally

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. Set `NEXT_PUBLIC_API_URL` in `.env` to the backend origin when running services separately; it defaults to `http://127.0.0.1:8000`. Docker and Render set `INTERNAL_API_URL` to the backend's private address. Browser API calls pass through `app/api/[...path]/route.ts`, which forwards them to Django.

## Roles and routes

- Admin: `/admin`, `/admin/requests`, `/admin/episodes`, `/admin/report`, `/admin/users`.
- Operator: `/operator`, `/operator/requests`, `/operator/episodes`, `/operator/analytics`.
- Client: `/client`, `/client/requests`, `/client/new-request`.
- `/login` — sign-in.

Feature hooks are the page-facing API. Django remains responsible for access checks and workflow rules; navigation guards only improve the user experience. See the root [README](../README.md) for Docker setup and [NOTES](../NOTES.md) for security considerations.
