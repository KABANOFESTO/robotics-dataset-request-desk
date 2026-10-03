# Design notes

## Design and decisions
PostgreSQL is the source of truth. Clients own dataset requests; assignments link requests to unique episodes; a status-history row records each transition and who made it. Django REST Framework enforces ownership, roles, valid transitions, episode quality, and fulfillment counts. The Next.js app shows role-specific screens but does not decide authorization.

Key decisions:
1. **Workflow rules live in the API and database**, so they hold for non-UI clients and an episode can't be assigned twice.
2. **CSV rows are normalized and validated before saving.** Invalid rows are reported, repeated IDs are skipped, and imports can be rerun safely.
3. **Analytics are aggregated in the database** (ORM queries; `PERCENTILE_CONT` for the median on PostgreSQL). SQLite is for isolated tests only.

**Limits:** episodes hold metadata only (no video files or export jobs); CSV import is synchronous; there is a Render config but no live URL; no real-time updates. Incomplete: the health route is `/healthz/` instead of `/health`, and request logs lack per-request duration and user ID.

## What went wrong
In Docker review, auth and API requests reached Django without trailing slashes, causing CSRF failures and 404s. I compared the frontend calls with Django's URL patterns and replaced the broad Next.js rewrite with a server-side API route that forwards to canonical slash-terminated paths. The production build couldn't be verified locally (Turbopack failed to bind a port); TypeScript checks passed. Rebuild the frontend image in Docker to confirm.

## Security
Passwords use Django's hashers. Short-lived JWT access/refresh tokens authenticate requests, and Django checks roles and ownership server-side. Inputs and CSV rows are validated; secrets stay in environment variables.

Main risks before production: token theft via script injection (tokens are readable by JavaScript) and credential attacks (no login rate limiting). Fixes: HttpOnly cookies, a strict CSP, and login throttling.

## Scale and next steps
At 10x users, a single API service and unpaginated lists break first. At 100x episodes, per-row import checks and date-range analytics scans get costly. I'd add pagination, bulk/staging-table imports, index and query-plan review, and cached or pre-aggregated analytics. Five million episodes would still need load testing.

Next: pagination, safer token storage, async import with progress, and frontend interaction tests.

## AI tooling
I used OpenAI Codex only occasionally, as a professional would, for reference on specific pieces of code. The design, implementation, and decisions are my own, and I reviewed everything I kept and can explain and support it.