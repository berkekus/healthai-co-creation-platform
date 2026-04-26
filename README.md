# HEALTH AI — Co-Creation Platform

> A full-stack matchmaking platform that connects **engineers** and **healthcare professionals** to co-create medical AI projects — from idea to pilot — inside a safe, auditable workspace.

---

## Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 · TypeScript · Vite 6 · Tailwind CSS 3 · React Router 6 · Zustand · React Hook Form + Zod |
| Backend   | Node.js · Express 4 · TypeScript · Mongoose 8 |
| Database  | MongoDB (Atlas for dev · containerised `mongo:7` for production) |
| Auth      | JWT (Bearer token, 7-day expiry) · bcrypt (≥10 rounds) |
| Security  | Helmet · express-mongo-sanitize · express-rate-limit |
| Dev       | ts-node-dev (hot reload) · Docker Compose |

**Fonts:** Plus Jakarta Sans (headlines · logo · buttons) + Source Sans 3 (body copy)  
**Icons:** Material Symbols Outlined + Lucide React  
**Palette:** `hai-plum` `hai-teal` `hai-mint` `hai-lime` `hai-cream` `hai-offwhite`

---

## Quick Start

### Option 1 — Docker Compose (recommended)

```bash
# Development (hot reload on both frontend and backend)
docker compose up

# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

> **MongoDB:** The dev compose file expects Atlas or a local MongoDB instance. Set `MONGO_URI` in `backend/.env` before starting.

```bash
# Production (nginx + compiled Node.js + containerised MongoDB)
JWT_SECRET=<secret> docker compose -f docker-compose.prod.yml up --build
# App served at http://localhost:80
```

### Option 2 — Local (no Docker)

**Backend**

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev            # http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
npm run build          # production bundle → /dist
npm run preview        # preview built bundle
```

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

## Environment Variables

### `backend/.env`

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/healthai
JWT_SECRET=<256-bit random string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### `frontend/.env` (optional override)

```
VITE_API_URL=http://localhost:5000/api
```

---

## API Overview

Base URL: `http://localhost:5000/api`  
All responses follow `{ "success": true, "data": <payload> }` / `{ "success": false, "message": "..." }`.  
Protected routes require `Authorization: Bearer <token>`.

| Prefix               | Description                          |
|----------------------|--------------------------------------|
| `POST /auth/register` | Register a new user                 |
| `POST /auth/login`   | Login, returns JWT                   |
| `GET  /auth/me`      | Current user profile                 |
| `PUT  /auth/me/profile` | Update own profile                |
| `GET  /auth/users`   | List all users (admin only)          |
| `PUT  /auth/users/:id/suspend` | Suspend/unsuspend user (admin) |
| `GET  /posts`        | List posts (drafts excluded)         |
| `POST /posts`        | Create post                          |
| `PUT  /posts/:id`    | Edit post (author or admin)          |
| `POST /posts/:id/publish` | Publish a draft               |
| `POST /posts/:id/partner-found` | Mark partner found        |
| `POST /posts/:id/interest` | Express interest             |
| `DELETE /posts/:id`  | Delete post (author or admin)        |
| `GET  /meetings`     | List user's meetings                 |
| `POST /meetings`     | Send meeting request                 |
| `POST /meetings/:id/accept`  | Accept a pending request     |
| `POST /meetings/:id/decline` | Decline a pending request    |
| `POST /meetings/:id/cancel`  | Cancel a meeting             |
| `GET  /notifications` | List own notifications              |
| `POST /notifications/:id/read` | Mark as read               |
| `POST /notifications/mark-all-read` | Mark all as read        |
| `GET  /logs`         | Activity log (admin only)            |
| `GET  /health`       | Health check                         |

---

## Project Structure

### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthai
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```
healthai-co-creation-platform/
├── docker-compose.yml          # dev: hot reload, Atlas/local MongoDB
├── docker-compose.prod.yml     # prod: nginx + compiled backend + mongo:7
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/         # AppLayout · LandingShell · Navbar · Footer
│       │   ├── posts/          # PostCard · PostStatusBadge · PostFormFields
│       │   ├── meetings/       # MeetingCard · ExpressInterestModal
│       │   └── ui/             # FormField · Skeleton · CookieConsentBanner
│       ├── pages/
│       │   ├── auth/           # LoginPage · RegisterPage · VerifyEmailPage
│       │   ├── dashboard/      # DashboardPage
│       │   ├── posts/          # PostListPage · PostCreatePage · PostDetailPage
│       │   ├── meetings/       # MeetingsPage
│       │   ├── admin/          # AdminPage
│       │   ├── profile/        # ProfilePage
│       │   └── errors/         # NotFoundPage (404) · UnauthorizedPage (403)
│       ├── store/              # Zustand slices: auth · post · meeting · notification
│       ├── types/              # Shared TS contract types
│       ├── utils/              # matchPosts · formatters · validators
│       ├── constants/          # routes · config · enums
│       └── router/             # AppRouter (protected + role-guarded routes)
└── backend/
    ├── src/index.ts            # Express app entry point
    ├── config/db.ts            # Mongoose connection
    ├── models/                 # User · Post · Meeting · Notification · Log
    ├── controllers/            # authController · postController · meetingController …
    ├── services/               # authService · postService · meetingService …
    ├── routes/                 # authRoutes · postRoutes · meetingRoutes …
    ├── middleware/             # authMiddleware · errorHandler · rateLimiter
    └── constants/              # logActions
```

> Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com). Free tier: **1,500 requests/day · 15 requests/minute**.
> The app works without a Gemini key — AI chips simply won't appear.

---

## Features

- **Authentication** — email + password, `.edu` verification, JWT sessions, rate limiting after 3 failed attempts, session timeout modal (frontend 30 min)
- **Post management** — `draft → active → meeting_scheduled → partner_found → closed / expired` lifecycle · confidentiality levels · expiry countdown
- **Smart matching** — per-card match chips (city · country · cross-role · expertise overlap) and a "Best matches for you" featured row
- **Meetings** — 3-step interest flow (message → NDA → 3 proposed slots) · owner workflow (accept / counter-propose / decline) · tabbed inbox
- **Notifications** — in-app notifications triggered on every meeting state change; `mark-all-read` supported
- **Admin panel** — user suspension, post moderation, tamper-resistant activity log (CSV export)
- **GDPR** — Art. 6/15/17/20/21 rights · JSON data export · account deletion · cookie consent · `/privacy` page
- **Loading states** — shared `Skeleton` primitives (`<Skeleton/>`, `<SkeletonLine/>`, `<PostCardSkeleton/>`, `<SkeletonGrid/>`)
- **Error states** — designed `404` + `403` pages with role-aware CTAs

---

## Demo Accounts

Register any account via `/register` (3-step wizard) or use the seeded accounts once the DB is populated (see `frontend/src/data/mock*.ts` for reference data).

> All seed passwords are `password123` (admin: `admin123`).

| Email                   | Role                    | City       |
|-------------------------|-------------------------|------------|
| `e.muller@charite.edu`  | Healthcare professional | Berlin     |
| `m.rossi@polimi.edu`    | Engineer                | Barcelona  |
| `i.larsson@ki.edu`      | Healthcare professional | Stockholm  |
| `k.nakamura@tum.edu`    | Engineer                | Berlin     |
| `admin@healthai.edu`    | Admin                   | Amsterdam  |

---

## Evaluation Scenarios

1. **Registration & Login** — `/register` wizard → email verification → rate-limit cooldown
2. **Post Creation** — `/posts/new` (4 section cards) → draft → publish → edit → close
3. **Search & Filtering** — debounced search · "Best matches" row · city toggle · domain / stage / collab / status filters
4. **Meeting Request Workflow** — `ExpressInterestModal` (3 steps) → owner confirms / declines
5. **Admin Panel** — `/admin` users · posts · logs tabs with filters + CSV export
6. **Profile & GDPR** — `/profile` edit · **Export my data** (JSON) · **Delete account**

---

## Planning Artifacts

- [`backend/ROADMAP.md`](backend/ROADMAP.md) — Backend integration roadmap and current gap analysis
- [`.planning/roadmap.md`](.planning/roadmap.md) — 10-phase frontend delivery plan
- [`.planning/SNAPSHOT.md`](.planning/SNAPSHOT.md) — Per-phase implementation log

---

© 2026 HEALTH AI — Co-Creation Platform · SENG 352 capstone · Spring 2026.
