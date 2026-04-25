# Structure

*Last updated: 2026-04-25*

## Repo layout (top level)

```
healthai-co-creation-platform/
├── backend/                  # Express + Mongoose API
├── frontend/                 # React + Vite SPA
├── docker-compose.yml        # Local dev: backend + frontend + MongoDB
├── docker-compose.prod.yml   # Production composition
├── README.md
├── .gitignore
├── .mcp.json                 # MCP server config (project-local)
└── .planning/                # GSD workspace (this folder)
```

## Backend

```
backend/
├── src/
│   └── index.ts              # App entry: middleware chain + route mounts + listen
├── config/
│   └── db.ts                 # Mongoose connection
├── routes/                   # Express routers, one per domain
│   ├── authRoutes.ts
│   ├── postRoutes.ts
│   ├── meetingRoutes.ts
│   ├── notificationRoutes.ts
│   └── logRoutes.ts
├── controllers/              # HTTP shape (request parse → service → response)
│   ├── authController.ts
│   ├── postController.ts
│   ├── meetingController.ts
│   ├── notificationController.ts
│   └── logController.ts
├── services/                 # Business logic, state transitions, audit logging
│   ├── authService.ts
│   ├── postService.ts
│   ├── meetingService.ts
│   ├── notificationService.ts
│   └── logService.ts
├── models/                   # Mongoose schemas
│   ├── User.ts
│   ├── Post.ts
│   ├── Meeting.ts
│   ├── Notification.ts
│   └── Log.ts
├── middleware/
│   ├── authMiddleware.ts     # JWT verify → req.user
│   ├── rateLimiter.ts        # express-rate-limit (auth only — see CONCERNS.md)
│   └── errorHandler.ts       # Centralized error → JSON
└── constants/
    └── logActions.ts         # Audit action codes + CRITICAL_LOG_ACTIONS set
```

**Where new code goes:**

| Adding... | Touch |
|---|---|
| New endpoint | `routes/<domain>Routes.ts` + `controllers/<domain>Controller.ts` + `services/<domain>Service.ts` |
| New collection | `models/<Name>.ts` (PascalCase, singular) |
| New cross-cutting middleware | `middleware/<name>Middleware.ts` |
| New audit action | `constants/logActions.ts` (and update `CRITICAL_LOG_ACTIONS` if security-relevant) |

## Frontend

```
frontend/
├── src/
│   ├── main.tsx              # ReactDOM bootstrap
│   ├── App.tsx               # Top-level: hydrate auth, fetch posts, render router
│   ├── router/
│   │   ├── AppRouter.tsx     # Route definitions
│   │   └── ProtectedRoute.tsx
│   ├── pages/                # Route-level screens
│   │   ├── LandingPage.tsx
│   │   ├── auth/             # login, register
│   │   ├── dashboard/
│   │   ├── posts/            # list, detail, create, edit
│   │   ├── meetings/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── admin/            # log/audit views
│   │   └── errors/           # 404/etc.
│   ├── components/           # Reusable UI
│   │   ├── ui/               # Primitives (buttons, inputs)
│   │   ├── layout/           # Headers, nav
│   │   ├── posts/            # Post-domain widgets
│   │   └── meetings/         # Meeting-domain widgets
│   ├── store/                # Zustand stores (one per domain)
│   │   ├── authStore.ts
│   │   ├── postStore.ts
│   │   ├── meetingStore.ts
│   │   └── notificationStore.ts
│   ├── lib/
│   │   ├── api.ts            # Axios client (JWT header, 401 redirect)
│   │   └── gemini.ts         # Google Gemini SDK wrapper
│   ├── types/                # `*.types.ts` per domain
│   ├── utils/
│   │   └── validators.ts     # Zod schemas
│   ├── constants/
│   ├── data/                 # Static seed/demo data
│   └── styles/
├── public/                   # Static assets
│   └── images/
├── docs/
└── .instructions/            # Project-local AI instructions (non-GSD)
```

**Where new code goes:**

| Adding... | Touch |
|---|---|
| New route / page | `pages/<domain>/<Name>.tsx` + register in `router/AppRouter.tsx` |
| New domain state | `store/<domain>Store.ts` |
| New shared component | `components/<scope>/<Name>.tsx` |
| New API call | Method on the relevant `store/*Store.ts`; uses `lib/api.ts` |
| New form schema | `utils/validators.ts` (Zod) |
| New type | `types/<domain>.types.ts` |

## Naming conventions (file-level)

| What | Convention | Example |
|---|---|---|
| React component | PascalCase `.tsx` | `CreatePost.tsx` |
| Type module | `<domain>.types.ts` | `post.types.ts` |
| Backend service / controller / route | `<domain>{Service|Controller|Routes}.ts` | `postService.ts`, `postRoutes.ts` |
| Zustand store | `<domain>Store.ts` | `postStore.ts` |
| Mongoose model | PascalCase singular | `Post.ts`, `User.ts` |

## Notable / anomalous paths

- `frontend/.planning/` — empty/stub planning dir inside the frontend (separate from the repo-root `.planning/` GSD workspace). Likely safe to remove.
- `frontend/.instructions/` — project-local AI instruction files unrelated to GSD.
- `frontend/C/Program Files/Git/app/` — **accidentally committed Windows Git installation path**. Looks like a misfired `git add` from a Windows machine; should be removed and added to `.gitignore`.
- `backend/.env.atlas` (untracked, in current git status) — secondary env file alongside `.env`.

## Top-level files of interest

| File | Purpose |
|---|---|
| `backend/src/index.ts` | App composition + listen |
| `frontend/src/App.tsx` | Auth hydration + initial fetch + router |
| `frontend/src/lib/api.ts` | Axios instance — single point for backend I/O |
| `frontend/src/router/AppRouter.tsx` | Route table |
| `docker-compose.yml` | Local stack (backend + frontend + Mongo) |
| `.mcp.json` | MCP servers configured for the project |

## What's not here

- No `tests/` or `__tests__/` directory anywhere — see [TESTING.md](TESTING.md).
- No CI workflows committed (`.github/workflows/` absent).
- No shared `packages/` or workspace monorepo — backend and frontend are sibling projects with independent `package.json`s.
