# Dataset Request Desk frontend

The frontend uses Next.js App Router and TypeScript. Routes live directly in `app/`; no `src/` directory is needed. Project workflows are grouped under `features/`, with shared code in `lib/` and `components/`.

## Folder map

```text
fe/
├── app/                         # Routes, layouts, and global styles
│   ├── (app)/                   # Authenticated application routes
│   │   ├── admin/users/         # Optional admin user management
│   │   └── requests/
│   │       ├── [id]/            # Request details and workflow history
│   │       └── new/             # Client request creation
│   ├── login/                   # Public sign-in route
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root HTML layout and metadata
│   └── page.tsx                 # Redirects the root URL to requests
├── components/ui/              # Shared presentational primitives
├── features/
│   ├── admin/                   # Admin user management hooks
│   ├── analytics/               # Operator analytics hooks
│   ├── auth/                    # Login, logout, and current-user hooks
│   ├── episodes/                # Episode search and assignment hooks
│   └── requests/                # Request queries, validation, and actions
├── lib/
│   ├── redux/                   # Store provider and RTK Query feature slices
│   │   └── slices/              # Auth, requests, episodes, users, analytics APIs
│   ├── api.ts                   # Shared server-side API fetch/error handling
│   ├── session.ts               # Server-side session cookie access
│   ├── store.ts                 # Typed Redux store and hooks
│   └── types.ts                 # Types matching backend serializers
├── public/                      # Static assets
├── proxy.ts                     # Redirects unauthenticated app routes
├── next.config.ts               # Next.js configuration
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # TypeScript configuration and @/* alias
```

Route groups such as `(app)` organize layouts without adding the group name to the URL. The `proxy.ts` convention is used because this project runs Next.js 16; its former `middleware.ts` name is deprecated. The proxy's cookie check is only a navigation convenience. Django remains responsible for authentication and role authorization on every API request.

## Development

```sh
npm ci
npm run dev
```

The frontend runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` to the backend origin (without `/api`); it defaults to `http://127.0.0.1:8000`.

## Page integration

Redux is installed at the root layout through `StoreProvider`. Import hooks from feature modules so pages do not need to know the API slice layout:

```tsx
import { useGetRequestsQuery } from "@/features/requests/queries";
import { useTransitionRequestMutation } from "@/features/requests/actions";

function RequestList() {
  const { data: requests = [], isLoading, error } = useGetRequestsQuery();
  const [transitionRequest, transitionState] = useTransitionRequestMutation();

  // Render requests; call transitionRequest({ id, status }) from an action handler.
  return null;
}
```

Available feature hooks cover login/logout and current user, requests (list, detail, create, transition, review, assignment), filtered episodes, admin users, and operator analytics. Django validates all roles and workflow rules; the frontend only selects the matching action and displays API errors.

The login flow stores JWTs for the current browser tab, restores them through the provider, loads `/api/auth/me/`, refreshes expired access tokens, and clears the local session on logout. The backend `/api/auth/me/` endpoint was added to return the authenticated user's role and profile needed for role-aware navigation. JWTs held by browser JavaScript are exposed to any successful same-origin script injection, so use a strict Content Security Policy and consider moving to an HttpOnly-cookie authentication design before production.
