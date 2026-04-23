# HEALTH AI — Co-Creation Platform

A structured matchmaking platform that connects **engineers** and **healthcare professionals** across Europe so they can co-create medical AI projects — from idea to pilot — inside a safe, auditable, GDPR-compliant workspace.

> Frontend-only demo (mock API + Zustand stores + localStorage persistence). Backend lives behind the same API contract and can be swapped in without touching any page.

- **Stack:** React 18 · TypeScript · Vite 6 · Tailwind CSS 3 · React Router 6 · Zustand · React Hook Form + Zod
- **Fonts:** Plus Jakarta Sans (headlines · logo · buttons) + Source Sans 3 (body copy) via Google Fonts
- **Icons:** Material Symbols Outlined + Lucide React
- **Palette:** `hai-plum` `hai-teal` `hai-mint` `hai-lime` `hai-cream` `hai-offwhite`

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in /dist
npm run preview    # preview the built bundle
```

No environment variables are required — the app ships with realistic seed data (5 users, 10 posts, 7 meetings, 20 activity logs).

---

## Demo accounts

All passwords are `password123` (admin is `admin123`). Sign in via `/login`.

| Email                   | Role                     | City       | Highlights                                                       |
| ----------------------- | ------------------------ | ---------- | ---------------------------------------------------------------- |
| `e.muller@charite.edu`  | Healthcare professional  | Berlin     | 2 active posts · 1 confirmed meeting · GDPR data-export example  |
| `m.rossi@polimi.edu`    | Engineer                 | Barcelona  | FL framework post + incoming stroke-unit collaboration request   |
| `i.larsson@ki.edu`      | Healthcare professional  | Stockholm  | Oncology + ophthalmology posts, 3 pending meetings               |
| `k.nakamura@tum.edu`    | Engineer                 | Berlin     | Wearable fall-detector · mental-health NLP post                  |
| `admin@healthai.edu`    | Admin                    | Amsterdam  | Full admin panel access (users / posts / logs · CSV export)      |

---

## Demo scenarios

The seed data is tuned to walk through the six evaluation scenarios end-to-end:

1. **Registration & Login** — `/register` (3-step wizard) → email verification → rate-limit cooldown after 3 failed logins.
2. **Post Creation & Management** — `/posts/new` (4 themed section cards) → draft / activate → edit → close.
3. **Search & Filtering** — `/posts` debounced search · "Best matches for you" featured row · "Near me" city quick-toggle · domain / stage / collab / status filters.
4. **Meeting Request Workflow** — `ExpressInterestModal` (3-step: message → NDA → 3 proposed slots) → owner confirms / counter-proposes / declines.
5. **Admin Panel** — `/admin` (users tab · posts tab · logs tab with filters + CSV export).
6. **Profile & GDPR** — `/profile` edit identity · expertise tags · **Export my data** (JSON) · **Delete account** (destructive modal).

Full scenario → phase mapping lives in `.planning/roadmap.md`.

---

## Project structure

```
src/
  components/
    layout/           # AppLayout · LandingShell · Navbar · Footer · PageWrapper
    posts/            # PostCard · PostStatusBadge · PostFormFields
    meetings/         # MeetingCard · ExpressInterestModal
    ui/               # FormField · Skeleton · CookieConsentBanner · SessionTimeoutModal
  pages/
    auth/             # LoginPage · RegisterPage · VerifyEmailPage
    dashboard/        # DashboardPage
    posts/            # PostListPage · PostCreatePage · PostEditPage · PostDetailPage
    meetings/         # MeetingsPage
    admin/            # AdminPage
    profile/          # ProfilePage
    errors/           # NotFoundPage (404) · UnauthorizedPage (403) · PrivacyPage
    LandingPage.tsx   # public marketing page (decoupled from AppLayout)
  store/              # Zustand slices: auth · post · meeting · notification
  data/               # mockUsers · mockPosts · mockMeetings · mockLogs
  utils/              # matchPosts (match reasoning + ranking) · formatters · validation
  constants/          # routes · config (session timeouts, rate-limit) · enums
  types/              # TS contract types (auth · post · meeting · common)
  router/             # AppRouter with protected & role-guarded routes
.planning/
  roadmap.md          # 10-phase delivery plan (Faz 0 → Faz 9)
  SNAPSHOT.md         # Per-phase implementation log (latest: Faz 9 polish)
```

---

## Feature surface

- **Authentication** — email + password, `.edu` verification, session timeout (30 min) with countdown modal, rate limiting after 3 failed attempts
- **Post management** — draft / active / meeting_scheduled / partner_found / closed / expired states · confidentiality (public pitch vs. meeting-only) · expiry countdown
- **Smart matching** — per-card match chips (city · country · cross-role · expertise overlap) and a "Best matches for you" featured row driven by `utils/matchPosts.ts`
- **Meetings** — 3-step interest flow with NDA + slot selection · owner workflow (accept / counter-propose / decline) · tabbed inbox (All / Incoming / Outgoing / Confirmed)
- **Admin panel** — user suspension, post moderation, tamper-resistant activity log (24-month retention, CSV export)
- **GDPR** — Art. 6 legal basis · Art. 15 / 17 / 20 / 21 user rights · JSON data export · account deletion · cookie consent banner · privacy policy (`/privacy`)
- **Loading states** — shared `Skeleton` primitives (`<Skeleton/>`, `<SkeletonLine/>`, `<SkeletonPill/>`, `<PostCardSkeleton/>`, `<SkeletonGrid/>`)
- **Error states** — designed `404` + `403` pages with "Go back" · quick-link shortcuts · role-aware CTAs

---

## Architectural notes

- **Zustand + localStorage** persistence means every user action (register, post create, meeting request, GDPR delete) is immediately visible on reload without a backend. The store contracts match the planned REST API one-to-one.
- **Role guards** live in `router/AppRouter.tsx` and dispatch to `UnauthorizedPage` instead of silent redirects, so evaluators always see *why* a route is blocked.
- **Typography system:** Tailwind tokens `font-headline` / `font-feixen` → Plus Jakarta Sans · `font-body` → Source Sans 3. Legacy CSS variables (`--ff-display`, `--ff-sans`) remap to the same families for backward compat.
- **Responsive breakpoints:** desktop (≥1100 px) · tablet (760 – 1099 px, sidebar stacks on top) · mobile (≤760 px, single-column grid and mobile nav).
- **Reduced motion:** the skeleton shimmer and stepper animations auto-disable under `prefers-reduced-motion`.

---

## Accessibility

- Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`) in every layout shell
- Keyboard-reachable `PostCard` (`role="link"` + `Enter` / `Space` handlers) and focus-visible rings on all interactive controls
- ARIA on modals: `role="dialog"` (interest), `role="alertdialog"` (session timeout), `aria-labelledby` + `aria-describedby` + `aria-valuenow` where relevant
- Color pairings (`hai-plum` on `hai-offwhite`, `hai-plum` on `hai-mint` / `hai-lime`) were picked to pass WCAG AA for body copy

---

## Planning artifacts

- [`.planning/roadmap.md`](.planning/roadmap.md) — 10 phase delivery plan
- [`.planning/SNAPSHOT.md`](.planning/SNAPSHOT.md) — running log of every phase's implementation decisions

---

© 2026 HEALTH AI — Co-Creation Platform · SENG 384 capstone · Spring 2026.
