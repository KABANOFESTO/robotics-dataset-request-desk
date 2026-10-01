# Dataset Request Desk frontend

The frontend uses Next.js App Router and TypeScript. The structure groups route entry points under `src/app`, project workflows under `src/features`, and shared code under `src/lib` and `src/components`.

## Folder map

```text
fe/
├── src/
│   ├── app/                         # URL routes and shared page layouts
│   │   ├── (app)/                   # Authenticated application routes
│   │   │   ├── admin/users/         # Optional admin user management
│   │   │   └── requests/
│   │   │       ├── [id]/            # Request details and workflow history
│   │   │       └── new/             # Client request creation
│   │   ├── login/                   # Public sign-in route
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root HTML layout and metadata
│   │   └── page.tsx                  # Redirects the root URL to requests
│   ├── components/ui/                # Shared presentational primitives
│   ├── features/
│   │   ├── auth/                     # Login, logout, and session actions
│   │   ├── episodes/                 # Episode search and assignment
│   │   └── requests/                 # Request queries, validation, and actions
│   ├── lib/
│   │   ├── api.ts                    # Shared Django API fetch/error handling
│   │   ├── session.ts                # Server-side session cookie access
│   │   └── types.ts                  # Types matching backend serializers
│   └── proxy.ts                      # Redirects unauthenticated app routes
├── public/                           # Static assets
├── next.config.ts                    # Next.js configuration (standalone output)
├── package.json                      # Scripts and dependencies
└── tsconfig.json                     # TypeScript configuration and @/* alias
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
