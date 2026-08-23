# Frontend Test Findings

*Test date: 2026-08-23*

Findings from an end-to-end manual/automated pass over the running frontend (backend on `:5000` against the Atlas cluster, frontend `vite` dev server on `:5174`), driven with headless Chromium (Playwright) through every route, as Doctor/Engineer and Admin accounts. Each item below was reproduced and traced to its source, not just observed once. Severity scale matches [CONCERNS.md](CONCERNS.md): **high** (action soon), **med** (plan around), **low** (nice to fix).

---

## High

| # | Area | File | Issue |
|---|---|---|---|
| 1 | AI matching / AI Assist | `backend/services/aiMatchService.ts:121`, `backend/controllers/aiController.ts:10` | `GEMINI_MODEL=gemini-2.0-flash` (`backend/.env`) has been retired by Google. Every call to `/api/ai/matches` and `/api/ai/improve-post` fails with a 502. Frontend degrades gracefully (fallback ranking badge, "temporarily unavailable" message on AI Assist) but the platform's core AI feature is fully dead. **Fix:** update `GEMINI_MODEL` to a current model name. |
| 2 | i18n | `frontend/src/pages/auth/RegisterPage.tsx` | Registration form is essentially unlocalized — only 6 `t()` calls in the whole file. Labels ("Full name", "Institutional email", "Confirm password"), headings ("Create your account"), and validation messages ("Only institutional .edu email addresses are accepted...", "Password must be at least 8 characters") are all hardcoded English, while the rest of the app (navbar, Login page) renders in Turkish. This is the primary sign-up path. |
| 3 | i18n | `frontend/src/components/posts/PostFormFields.tsx:90-137` | Post create/edit form is largely hardcoded English ("The basics", "What you're looking for", "How you want to collaborate", "AI Assist", "Min. 50 characters"). Shared by both `PostCreatePage` and `PostEditPage`, so both are affected. |
| 4 | i18n | `frontend/src/pages/admin/AdminPage.tsx` | Admin panel is almost entirely hardcoded English ("Welcome back, Admin", "User growth", "Quick actions", "Recent users", "Top domains") despite the surrounding chrome being Turkish. |

## Medium

| # | Area | File | Issue |
|---|---|---|---|
| 5 | Data / logic bug | `frontend/src/pages/dashboard/DashboardPage.tsx:142,149` | `firstName = user.name.split(' ')[0]` combined with seed data storing the honorific in `name` (e.g. `"Dr. Elif Kaya"`) yields `"Dr."` as the first name. JSX then appends its own literal `.` (`{firstName}<span>.</span>`), producing `"Dr.."` in the dashboard greeting. Either strip honorifics before deriving `firstName`, or store them separately from the seed data. |
| 6 | UI text | `frontend/src/pages/errors/NotFoundPage.tsx`, `frontend/src/pages/errors/UnauthorizedPage.tsx:33` | Recurring "double punctuation" pattern: several headings append a hardcoded `<span>.</span>` (or `?`) after a translation string that *already* ends in that punctuation mark. Confirmed on: 404 page ("Bu sayfayı bulamıyoruz.."), 403 page ("Erişim izniniz yok.." — both `tr.json:616` and `en.json:616` already end in a period), and the Forgot Password heading ("Şifrenizi mi unuttunuz??"). Worth auditing every page using this decorative-trailing-punctuation pattern (12 files match `<span...>.</span>`; most are fine because their strings don't end in punctuation, but each should be checked). |
| 7 | i18n | `frontend/src/pages/meetings/MeetingsPage.tsx:178` | Page heading `"Your <span>meetings</span>"` is hardcoded English; every other string on the page (tabs, stats, table) is correctly localized. |
| 8 | Content / seed data | notification seed content (`backend/scripts/seed-*.ts`) | Some notification titles/bodies are missing Turkish diacritics ("toplanti", "icin" instead of "toplantı", "için"), and one notification type ("New message from X") is never translated at all while sibling notification types are. |
| 9 | Auth flow | `frontend/src/store/authStore.ts:74-80` | `logout()` fires `api.post('/auth/logout')` before the following `localStorage.removeItem('token')` line, intending the request to carry a valid token. Because axios's request interceptor reads the token on a microtask (after the synchronous `removeItem` has already run), the token is gone by the time the request is dispatched — the logout call always hits the backend unauthenticated and gets a 401. Client-side session teardown still succeeds (harmless to the user), but the backend never receives a real logout signal, and it pollutes error logs on every sign-out. **Fix:** await the API call (or read/cache the token first) before clearing storage. *(Note: this supersedes the "No `/auth/logout` endpoint" line in [CONCERNS.md](CONCERNS.md) — the endpoint exists now, it's just always called unauthenticated.)* |

## Low

| # | Area | File | Issue |
|---|---|---|---|
| 10 | Dead code | `frontend/src/components/ui/ThemeToggle.tsx`, `frontend/src/store/themeStore.ts` | A full dark-mode system exists (store + toggle component + dozens of `dark:` Tailwind classes throughout the app) but `ThemeToggle` is never imported/rendered anywhere. Users have no way to switch themes despite the styling being built for it. |
| 11 | Code quality | `frontend/src/pages/admin/AdminPage.tsx:205-208` | `UserGrowthChart`'s `yTicks = [0, Math.round(maxVal * 0.5), maxVal]` can contain duplicate values when `maxVal` is small (0 or 1 — common early in the platform's life / narrow date ranges). Since the JSX uses `key={v}`, React logs a "duplicate key" warning and gridline labels risk being dropped/duplicated. Use `key={i}` (the map index) instead of `key={v}`. |

---

## Confirmed working (no action needed)

- Protected routes (`/dashboard`, `/posts`, `/meetings`, `/profile`, `/notifications`, `/messages`, `/admin`) all redirect to `/login` when logged out.
- Role-based access works: a Doctor account visiting `/admin` correctly lands on the 403/Unauthorized page.
- Cookie-consent choice persists in `localStorage` and doesn't reappear across reloads/navigation.
- Login, Profile, the user-facing Dashboard body copy, Notifications, Messages, and the Meetings table/stats are all correctly and consistently localized.
- Post listing (filter/search/pagination), post detail, conversation open + message history load, and meeting stats all work correctly against live data.
- Dev quick-login buttons and the Cloudflare Turnstile test key behave as expected.
- AI-service failure is handled gracefully by the UI (fallback ranking badge, inline "temporarily unavailable" notice) rather than crashing.

---

## Test scope

Routes exercised: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/oauth-callback`, `/privacy`, `/404`, `/unauthorized`, `/dashboard`, `/posts`, `/posts/:id`, `/posts/new`, `/meetings`, `/profile`, `/profile/:userId`, `/notifications`, `/messages`, `/messages/:id`, `/admin` — as logged-out, Doctor, and Admin. Not covered in this pass: full register-to-verified-account completion (only validation was exercised, to avoid writing test accounts into the live Atlas cluster), `PostEditPage` specifically (shares `PostFormFields`, so finding #3 applies), and meeting scheduling / `ExpressInterestModal`.
