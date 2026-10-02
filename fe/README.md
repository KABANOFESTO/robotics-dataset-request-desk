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
│   ├── auth/                    # Login, logout, and session actions
│   ├── episodes/                # Episode search and assignment
│   └── requests/                # Request queries, validation, and actions
├── lib/                         # Shared API/session helpers and domain types
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

The frontend runs at `http://localhost:3000`. Set `API_BASE_URL` to the backend API root; it defaults to `http://localhost:8000/api`.

## Current implementation stage

This is the frontend foundation, not a finished UI. Page files and feature modules mark the implementation boundaries. The next steps are authentication and secure cookie handling, client/operator request workflows, episode assignment, and optional admin user management.
