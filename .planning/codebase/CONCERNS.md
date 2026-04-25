# Concerns

*Last updated: 2026-04-25*

Tech debt, bugs, security gaps, performance risks, fragile areas, and test gaps observed during codebase mapping. Severity scale: **high** (action soon), **med** (plan around), **low** (nice to fix).

A `Current Gaps` doc was committed earlier in the project history (commit `36092da`) and overlaps with several findings here.

---

## High

| # | Area | File | Issue |
|---|---|---|---|
| 1 | Post lifecycle | `backend/services/postService.ts:50-189`, `backend/services/meetingService.ts:56-130` | Status transitions break when a meeting is declined or cancelled — posts can get stuck in `meeting_scheduled`. |
| 2 | Auth / authz | `backend/services/postService.ts:50-84` | Listing `/posts?status=draft` returns other users' drafts. Drafts must be scoped to the author. |
| 3 | Auth / authz | `backend/controllers/postController.ts:87-95` | Post update accepts arbitrary fields — a user can mutate `authorId`, `status`, `createdAt` on any post they can hit. Whitelist updatable fields. |
| 4 | DoS / scaling | `backend/services/postService.ts:83` | `/posts` returns the full collection — no pagination, no limit. Single hot endpoint can OOM the process. |
| 5 | DoS | `backend/src/index.ts:48` | Rate limiter only mounted on `/auth`. `/posts`, `/meetings`, `/notifications` have no protection. |
| 6 | Audit logging | `backend/constants/logActions.ts` vs frontend admin | Action name casing mismatch (snake_case vs UPPER_SNAKE) — admin panel cannot match security events to log entries. |
| 7 | Tests | (entire repo) | Zero tests covering authorization. Authz bugs are silent. |
| 8 | Tests | (entire repo) | Zero tests covering post status lifecycle (`draft → active → meeting_scheduled → completed`). State machine drift undetectable. |

## Medium

- **Incomplete auth-failure logging** — `backend/controllers/authController.ts:45-53` — failed-login attempts not consistently logged to `Log` collection.
- **Suspended users keep valid JWTs** — `backend/middleware/authMiddleware.ts:34-36` — token validity not re-checked against user `status`. Suspension only takes effect at expiry.
- **No pagination on admin endpoint** — `/auth/users` returns full user list.
- **JWT secret not validated at startup** — `backend/src/index.ts` — server boots even if `JWT_SECRET` is missing/empty.
- **No HTTPS enforcement** in production config.
- **Email verification absent** — `User.isVerified` field exists but no flow sets it. Either implement verification or remove the field.
- **Post-expiry check on every list call** — `backend/services/postService.ts` — sweeps expirations inline on read. Should be a scheduled job / TTL index.
- **No indexes on Meeting queries** — `backend/models/Meeting.ts` — full collection scans likely under load.
- **Notification query unbounded** — no `limit()` on `/notifications`.
- **Frontend filters client-side** — list endpoints return everything, frontend filters in memory. Won't scale beyond a few hundred records.
- **Meeting race condition** — concurrent accept/decline on the same meeting can leave inconsistent state. No optimistic-lock / version field.
- **Multiple concurrent meetings on same post** — no uniqueness check; two requesters can both have `meeting_scheduled` against one post.
- **No structured error codes** — clients distinguish errors by HTTP status only; UI strings are hardcoded against status codes.
- **No DB connection pool config** — `mongoose.connect` uses defaults; production sizing not declared.
- **Notification push has no backpressure** — burst notifications can overwhelm consumers.
- **No password-reset endpoint.**
- **No `/auth/logout` endpoint** — frontend just discards token client-side; server-side blacklist absent.

## Low

- `User.lastActive` only updated on login (not on activity).
- `/auth/register` returns a JWT but the frontend ignores it (forces a separate login round-trip).
- Unused endpoint: `getUnreadCount` on notifications — not wired in UI.
- No HTTP→HTTPS redirect (deployment-level concern).
- Meeting calendar conflict detection missing — overlapping slots accepted.
- No avatar/profile-image support on `User`.

---

## Test Gaps (consolidated)

- **Authentication / authorization** — zero coverage.
- **Post status state machine** — zero coverage.
- **`errorHandler.ts` middleware branches** (ValidationError / CastError / duplicate-key / JWT) — zero coverage.
- **Validators** (`frontend/src/utils/validators.ts`) — Zod schemas untested.
- **Zustand stores** — auth/post/meeting stores untested.

See [TESTING.md](TESTING.md) for the full picture (no test infrastructure currently exists).

---

## Files most worth attention

- `backend/services/postService.ts` — pagination, draft scoping, expiry sweep, status transitions.
- `backend/controllers/postController.ts` — input whitelist on update.
- `backend/middleware/rateLimiter.ts` (and `index.ts` mount points) — broaden rate-limiter coverage.
- `backend/middleware/authMiddleware.ts` — re-check user status on each request.
- `backend/src/index.ts` — startup-time env validation.
- `backend/services/meetingService.ts` — race conditions, conflict detection.
- (entire repo) — introduce a baseline test layer; see TESTING.md.
