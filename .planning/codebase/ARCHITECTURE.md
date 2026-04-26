# Architecture

*Last updated: 2026-04-25*

## Pattern

Two-tier web app: **React SPA frontend** ↔ **Express REST backend** ↔ **MongoDB**. Backend follows a **layered MVC variant**: `routes → controllers → services → models`. Frontend uses **Zustand-per-domain** with React Hook Form + Zod for forms and a single Axios client for I/O.

## High-level diagram

```
┌────────────────────────┐         ┌──────────────────────────────┐         ┌──────────┐
│  React SPA (Vite)      │  HTTPS  │  Express API                 │ Mongoose│ MongoDB  │
│  frontend/src          │ ──────► │  backend/src/index.ts        │ ──────► │          │
│                        │  REST   │                              │         │          │
│  • pages/              │ ◄────── │  routes/ → controllers/      │ ◄────── │          │
│  • components/         │   JSON  │         → services/          │         │          │
│  • store/ (Zustand)    │         │         → models/ (Mongoose) │         │          │
│  • lib/api.ts (Axios)  │         │  middleware/ (auth, rate,    │         │          │
│  • lib/gemini.ts       │         │              error)          │         │          │
└────────────────────────┘         └──────────────────────────────┘         └──────────┘
         │
         │ direct
         ▼
   Google Gemini API
```

## Backend layers

Bottom-up:

| Layer | Path | Responsibility |
|---|---|---|
| **Models** | `backend/models/` | Mongoose schemas: `User`, `Post`, `Meeting`, `Notification`, `Log`. Define shape, indexes (where present), Mongoose-level validation. |
| **Services** | `backend/services/` | Business logic. Services own state transitions (post lifecycle, meeting accept/decline, notification fan-out, audit logging via `LogService`). Talk to models. |
| **Controllers** | `backend/controllers/` | HTTP shape. Parse request, invoke service, format response, attach `statusCode` to errors. |
| **Routes** | `backend/routes/` | Mount controllers under `/api/*`, attach middleware (`protect`, `authLimiter`). |
| **Middleware** | `backend/middleware/` | `authMiddleware.ts` (JWT verify → `req.user`), `rateLimiter.ts` (express-rate-limit), `errorHandler.ts` (centralized error → JSON). |
| **Config / Constants** | `backend/config/db.ts`, `backend/constants/logActions.ts` | Mongoose connection, audit action codes + `CRITICAL_LOG_ACTIONS` set. |
| **Entry** | `backend/src/index.ts` | App composition: helmet → cors → json → `express-mongo-sanitize` → routes → `notFound` → `errorHandler`. |

## Request lifecycle (backend)

```
HTTP request
  → helmet (security headers)
  → cors (origin allowlist: localhost:5173, localhost:4173, CLIENT_ORIGIN env)
  → express.json({ limit: '10kb' })
  → express-mongo-sanitize (strip $-prefixed keys)
  → /api/auth: authLimiter → authRoutes → authController → authService → User model
  → /api/posts | /api/meetings | /api/notifications | /api/logs:
        protect (JWT) → controller → service → model
  → 200/201/204 JSON
  → on throw: errorHandler (Mongoose ValidationError → 400, CastError → 400,
              duplicate key → 409, JsonWebTokenError → 401, default → 500)
```

Health check is open: `GET /health`.

## Frontend architecture

| Concern | Implementation |
|---|---|
| **Routing** | `frontend/src/router/AppRouter.tsx` — react-router; `ProtectedRoute.tsx` gates authed routes. |
| **State** | Zustand stores per domain: `authStore`, `postStore`, `meetingStore`, `notificationStore` (`frontend/src/store/`). |
| **Bootstrapping** | `frontend/src/App.tsx` — on mount: `authStore.hydrate()` (restore session from token), then `postStore.fetchPosts()` once `isAuthenticated`. |
| **HTTP** | Single Axios instance in `frontend/src/lib/api.ts`. Adds `Authorization: Bearer <token>`; on 401, clears token and redirects to login. |
| **Forms** | React Hook Form + Zod (schemas in `frontend/src/utils/validators.ts`). |
| **AI** | `frontend/src/lib/gemini.ts` — Google Gemini called directly from the browser (see `INTEGRATIONS.md`). |
| **Styling** | `frontend/src/styles/` (Tailwind/CSS — see STACK.md). |

## Data flow (typical write — "create post")

```
CreatePost.tsx (page)
  → form submit (React Hook Form, Zod-validated)
  → postStore.createPost(payload)
  → api.post('/api/posts', payload)            [Axios + JWT]
  → routes/postRoutes.ts → protect → postController.createPost
  → postService.createPost(authorId, payload)  [Log via LogService]
  → Post.create(...)                            [Mongoose]
  → response → store optimistic update → UI re-render
```

## Data flow (typical read — "list posts")

```
App.tsx mount
  → useAuthStore.hydrate()
  → if isAuthenticated: usePostStore.fetchPosts()
  → api.get('/api/posts')
  → routes → protect → postController.listPosts → postService.listPosts
    (currently: full collection, no pagination — see CONCERNS.md)
  → Post.find(...) → response
  → postStore.posts = [...] → UI
```

## Authentication / authorization

- **Auth**: JWT issued by `authService` on register/login. Stored client-side; `authStore.hydrate()` reads token → calls `/auth/me` → populates user.
- **Authz**: `protect` middleware verifies JWT and sets `req.user`. Fine-grained checks (e.g. "is this post mine?") live in services. **Status checks (suspended, etc.) are not re-validated per request** — see CONCERNS.md.

## Domains

| Domain | Models | Services | Stores | Pages |
|---|---|---|---|---|
| Auth / Users | `User` | `authService` | `authStore` | `pages/auth/` |
| Posts (co-creation listings) | `Post` | `postService` | `postStore` | `pages/posts/` |
| Meetings | `Meeting` | `meetingService` | `meetingStore` | `pages/meetings/` |
| Notifications | `Notification` | `notificationService` | `notificationStore` | `pages/notifications/` |
| Logs (admin / audit) | `Log` | `logService` | — | `pages/admin/` |

Recent work has focused on: post lifecycle (`draft → active → meeting_scheduled → completed/expired`), interest expression, notifications fan-out, and admin audit visibility.

## Entry points

| Side | File |
|---|---|
| Backend HTTP | `backend/src/index.ts` |
| Backend DB connect | `backend/config/db.ts` |
| Frontend bootstrap | `frontend/src/main.tsx` → `frontend/src/App.tsx` |
| Frontend routing | `frontend/src/router/AppRouter.tsx` |
| Frontend HTTP | `frontend/src/lib/api.ts` |
| AI | `frontend/src/lib/gemini.ts` |

## Cross-cutting

- **Audit logging**: every domain service calls `LogService.record(...)` for noteworthy actions. Action codes in `backend/constants/logActions.ts`; critical subset tracked in `CRITICAL_LOG_ACTIONS`.
- **Error handling**: services throw `Error` with `statusCode`; `errorHandler.ts` translates to JSON response.
- **Security middleware**: `helmet`, `cors` allowlist, `express-mongo-sanitize`, `express.json({ limit: '10kb' })`.

## Notable absences

- No background jobs / scheduler — post expiry sweeping happens inline on read.
- No queue / message bus — notifications written synchronously in the same request.
- No WebSocket / SSE — notifications are pull-based from frontend (no live push).
- No tests (see TESTING.md).
- No path aliases — relative imports throughout.
