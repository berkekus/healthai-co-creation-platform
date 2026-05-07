<div align="center">

# HEALTH AI &mdash; Co-Creation Platform

### Where clinicians and engineers co-create medical AI &mdash; safely, auditably, together.

A full-stack, GDPR-aware matchmaking platform that connects **healthcare professionals** and **AI / ML engineers** across Europe so they can move from idea to pilot inside a single, structured workspace.

[![Status](https://img.shields.io/badge/status-active-22c55e?style=flat-square)](#project-status)
[![License: MIT](https://img.shields.io/badge/License-MIT-22d3a8?style=flat-square)](#license)
[![Node](https://img.shields.io/badge/Node-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](#quick-start)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4?style=flat-square)](#contributing)

[**Quick start**](#quick-start) &middot; [**API docs**](backend/API.md) &middot; [**Architecture**](#architecture) &middot; [**Roadmap**](#roadmap) &middot; [**Report a bug**](https://github.com/berkekus/healthai-co-creation-platform/issues)

</div>

---

## Table of contents

- [Why this project?](#why-this-project)
- [Project status](#project-status)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Demo accounts](#demo-accounts)
- [Testing](#testing)
- [Seeding & utility scripts](#seeding--utility-scripts)
- [Deployment](#deployment)
- [Security](#security)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Why this project?

Building useful medical AI is hard &mdash; not because the models are missing, but because **the right people rarely meet at the right time**. Clinicians have problems and data; engineers have skills and curiosity; institutions have legal requirements that can stall any pilot for months.

**HEALTH AI** is a structured co-creation workspace that removes that friction:

- **A common ground.** A single platform where engineers and healthcare professionals publish needs and capabilities in a consistent, searchable format.
- **Auditable from day one.** Every privileged action &mdash; registration, post creation, meeting request, account deletion &mdash; is recorded in a tamper-evident audit log with a 24-month retention policy.
- **GDPR by design.** Lawful basis (Art. 6), data export (Art. 20), right to erasure (Art. 17), cookie consent and a privacy policy ship in the box.
- **Smart matching, not blind search.** Posts are ranked by a transparent matching engine that explains *why* two users were paired (city, country, cross-role, expertise overlap).

> Originally built as a SENG 384 capstone project &mdash; designed and engineered to production-grade standards.

---

## Project status

| Area                  | State                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- |
| Core product          | **Stable** &mdash; auth, posts, meetings, messaging, notifications, admin all live |
| In-app messaging      | **Stable** &mdash; conversation channel opens automatically on meeting confirmation|
| API surface           | **Stable** &mdash; documented in [`backend/API.md`](backend/API.md)               |
| Test coverage         | **Active** &mdash; Vitest + Supertest backend, Vitest + Testing Library front      |
| Production deploy     | **Ready** &mdash; one-command Docker stack with MongoDB, Node and nginx            |
| AI features           | **Experimental** &mdash; Gemini-powered drafting behind a feature flag             |
| Dark mode             | **Stable** &mdash; system-wide dark/light toggle, persisted to localStorage        |

---

## Features

<table>
<tr><td valign="top" width="50%">

### Core product
- **Authentication** &mdash; email + password, `.edu` verification, Cloudflare Turnstile CAPTCHA, 30-minute idle session timeout with countdown.
- **Post lifecycle** &mdash; `draft` &rarr; `published` &rarr; `partner_found` (or `expired` / `closed`), with confidentiality flags (public pitch vs. meeting-only).
- **Smart matching** &mdash; per-card match chips (city, country, cross-role, expertise overlap) plus a *Best matches for you* featured row.
- **Meeting workflow** &mdash; 3-step interest flow (message &rarr; NDA &rarr; 3 proposed slots), owner accept / counter-propose / decline, tabbed inbox with calendar view.
- **In-app messaging** &mdash; private conversation channel opens automatically when a meeting is confirmed; persistent message history, 8-second polling, read receipts, conversation deletion.
- **Saved posts** &mdash; bookmark any post from its detail page; saved posts appear in a dedicated dashboard section, persisted across sessions.
- **Public profiles** &mdash; view any user's public profile (name, role, institution, bio, expertise tags) directly from a post's author card.
- **Real-time notifications** &mdash; push-style notifications with polling, unread count, mark-as-read, bulk actions. Separate unread badge for messages.
- **Dark mode** &mdash; system-wide dark / light toggle in the navbar, persisted to localStorage. All pages fully themed.
- **Admin panel** &mdash; user suspension, post moderation, audit log with filters and CSV export, user CSV export, working date-range and chart filters.

</td><td valign="top" width="50%">

### Compliance & quality
- **GDPR-ready** &mdash; Art. 6 legal basis, Art. 15 / 17 / 20 / 21 user rights, JSON data export, account deletion, cookie consent banner.
- **Bot protection** &mdash; Cloudflare Turnstile CAPTCHA on login, register and forgot-password (test keys for dev, real keys for production).
- **Security** &mdash; JWT auth, bcrypt password hashing, `helmet`, targeted rate limiting on mutation endpoints only, `express-mongo-sanitize`, CORS allowlist.
- **Tamper-evident audit log** &mdash; every privileged action is logged with `userId`, `userEmail`, `role`, `action`, `ipAddress`, `result`.
- **Accessibility** &mdash; semantic landmarks, keyboard-reachable cards, ARIA on every modal, WCAG AA color pairings, `prefers-reduced-motion` support.
- **Testing** &mdash; Vitest + Supertest on the backend (in-memory MongoDB), Vitest + Testing Library on the frontend.
- **DX** &mdash; fully typed REST contract shared between client and server, single `docker compose up` for the whole stack.

</td></tr>
</table>

---

## Tech stack

| Layer        | Technologies                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 18, TypeScript 5, Vite 6, Tailwind CSS 3, React Router 6, Zustand, React Hook Form + Zod, Lucide, `@marsidev/react-turnstile` |
| **Backend**  | Node.js 20, Express 4, TypeScript 5, Mongoose 8, Pino, `node-cron`                                                                   |
| **Database** | MongoDB 7                                                                                                                             |
| **Security** | JWT, bcryptjs, Helmet, `express-rate-limit`, `express-mongo-sanitize`, CORS allowlist, Cloudflare Turnstile                          |
| **Email**    | Nodemailer (SMTP &mdash; Gmail, SES, Resend&hellip;)                                                                                  |
| **AI**       | Google Generative AI (Gemini) &mdash; optional, behind `VITE_GEMINI_API_KEY`                                                         |
| **Tooling**  | Docker, Docker Compose, Vitest, Supertest, `mongodb-memory-server`, Testing Library, ESLint, ts-node-dev                             |

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Browser"]
        UI["React 18 + Vite<br/>Zustand · React Router<br/>Tailwind · Dark mode"]
    end

    subgraph Edge["Edge / Reverse proxy"]
        NGINX["nginx<br/>static assets + /api proxy"]
    end

    subgraph API["Backend (Node.js · Express)"]
        AUTH["Auth & RBAC<br/>JWT · bcrypt · Turnstile"]
        POSTS["Posts service"]
        MEET["Meetings service"]
        CONV["Conversations &<br/>Messages service"]
        NOTIF["Notifications service"]
        LOGS["Audit log service"]
        AI["AI assist (Gemini)"]
    end

    subgraph Data["Persistence"]
        MONGO[("MongoDB 7<br/>users · posts · meetings<br/>conversations · messages<br/>notifications · logs")]
    end

    SMTP["SMTP<br/>Nodemailer"]
    CF["Cloudflare<br/>Turnstile"]

    UI -->|HTTPS| NGINX
    NGINX -->|/api| AUTH & POSTS & MEET & CONV & NOTIF & LOGS & AI
    AUTH --> MONGO
    POSTS --> MONGO
    MEET --> MONGO
    CONV --> MONGO
    NOTIF --> MONGO
    LOGS --> MONGO
    AUTH -. verification mails .-> SMTP
    MEET  -. invitations .-> SMTP
    AUTH -. captcha verify .-> CF
```

**Key design principles**

- **One contract, two sides.** The TypeScript types in `frontend/src/types` and `backend/models` describe exactly the same entities &mdash; adding a field is a single PR.
- **Stateless API + JWT.** No server-side sessions; horizontal scaling is just *add another container*.
- **Audit log as a first-class citizen.** Every privileged write goes through `services/logService` so the admin tab and CSV export work without extra wiring.
- **Role-aware UI.** Route guards in `router/AppRouter.tsx` send unauthorised visitors to a designed `403` page, not a silent redirect.
- **Conversation channels are meeting-scoped.** A private messaging channel is created automatically when a meeting request is accepted &mdash; no separate setup required.

---

## Quick start

### Option 1 &mdash; Docker (recommended)

```bash
git clone https://github.com/berkekus/healthai-co-creation-platform.git
cd healthai-co-creation-platform

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

Then open:

- Frontend &rarr; http://localhost:5173
- Backend  &rarr; http://localhost:5000/api/health

### Option 2 &mdash; Run locally without Docker

You will need **Node.js 20+** and a running **MongoDB 7** instance.

```bash
# Backend
cd backend
cp .env.example .env       # set MONGO_URI + JWT_SECRET
npm install
npm run dev                # http://localhost:5000

# Frontend (in a second terminal)
cd frontend
cp .env.example .env       # set VITE_API_URL
npm install
npm run dev                # http://localhost:5173
```

After starting both servers, seed realistic data:

```bash
cd backend
npm run seed:realistic-posts    # creates 5 users + 10 posts
npm run seed:demo-messages      # creates a confirmed meeting + sample conversation
```

### Option 3 &mdash; Production build with Docker

```bash
JWT_SECRET="$(openssl rand -hex 32)" \
CLIENT_ORIGIN="https://your.domain" \
docker compose -f docker-compose.prod.yml up -d --build
```

This brings up `mongodb` + a compiled Node.js backend + a static `nginx` frontend (port `80`) that serves the build artefacts and proxies `/api` to the backend.

---

## Environment variables

### Backend (`backend/.env`)

| Variable               | Required | Default                              | Description                                            |
| ---------------------- | :------: | ------------------------------------ | ------------------------------------------------------ |
| `PORT`                 |          | `5000`                               | HTTP port                                              |
| `MONGO_URI`            | yes      | `mongodb://localhost:27017/healthai` | MongoDB connection string                              |
| `JWT_SECRET`           | yes      | &mdash;                              | Use a long random string in production                 |
| `JWT_EXPIRES_IN`       |          | `7d`                                 | Token lifetime                                         |
| `NODE_ENV`             |          | `development`                        | `development` &#124; `production`                      |
| `CLIENT_ORIGIN`        |          | `http://localhost:5173`              | CORS allowlist                                         |
| `SMTP_HOST` &hellip;   |          | empty                                | When unset, e-mails are logged to the console          |
| `APP_BASE_URL`         |          | `http://localhost:5173`              | Used in e-mail links                                   |
| `TURNSTILE_SECRET_KEY` |          | test key (always passes)             | Cloudflare Turnstile secret — required in production   |
| `GEMINI_API_KEY`       |          | &mdash;                              | Optional — enables AI drafting features                |

### Frontend (`frontend/.env`)

| Variable                  | Required | Default                       | Description                                              |
| ------------------------- | :------: | ----------------------------- | -------------------------------------------------------- |
| `VITE_API_URL`            | yes      | `http://localhost:5000/api`   | Backend base URL                                         |
| `VITE_TURNSTILE_SITE_KEY` |          | test key (always passes)      | Cloudflare Turnstile site key — required in production   |
| `VITE_GEMINI_API_KEY`     |          | &mdash;                       | Optional — enables the AI assistant features             |

> **Cloudflare Turnstile:** In development the bundled test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) are used — they always pass automatically. For production, get free keys at [dash.cloudflare.com/turnstile](https://dash.cloudflare.com/turnstile).

---

## Project structure

```
healthai-co-creation-platform/
├── backend/
│   ├── src/                    # app.ts, index.ts, cron.ts, logger.ts
│   ├── routes/                 # auth, posts, meetings, conversations, notifications, logs, AI
│   ├── controllers/            # request handlers
│   ├── services/               # authService, postService, meetingService,
│   │                           #   conversationService, notificationService, logService, mailService
│   ├── models/                 # User, Post, Meeting, Conversation, Message, Notification, Log
│   ├── middleware/             # authMiddleware (userName added), rateLimiter, errorHandler, upload
│   ├── utils/                  # asyncHandler, AppError, verifyTurnstile
│   ├── scripts/                # smoke-test, seed-realistic-posts, seed-realistic-meetings,
│   │                           #   seed-demo-messages, reset-admin-password
│   ├── tests/                  # Vitest + Supertest + mongodb-memory-server
│   ├── API.md                  # full REST reference
│   └── ROADMAP.md              # backend delivery plan
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/           # Login (dev-access buttons + Turnstile), Register, ForgotPassword
│   │   │   ├── dashboard/      # DashboardPage with SavedPosts section
│   │   │   ├── posts/          # PostListPage, PostDetailPage (Share/Save), PostCreate, PostEdit
│   │   │   ├── meetings/       # MeetingsPage with Open Chat button
│   │   │   ├── messages/       # ConversationsPage, ConversationPage (polling chat)
│   │   │   ├── profile/        # ProfilePage (own), PublicProfilePage (/profile/:userId)
│   │   │   ├── admin/          # AdminPage (overview, users, posts, logs — all buttons working)
│   │   │   ├── notifications/  # NotificationsPage
│   │   │   └── errors/         # 404, 403, Privacy
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, Navbar (ThemeToggle + msg badge), Footer
│   │   │   └── ui/             # ThemeToggle, Skeleton, SessionTimeoutModal, CookieConsent
│   │   ├── store/              # authStore, postStore, meetingStore, conversationStore,
│   │   │                       #   notificationStore, themeStore
│   │   ├── router/             # AppRouter with protected, role-guarded & public-profile routes
│   │   ├── types/              # auth, post, meeting, conversation, common
│   │   └── styles/             # globals.css (design tokens + dark mode overrides)
│   └── README.md               # frontend-only deep dive
├── requirements/               # SRS, SDD and user-guide source documents
├── docker-compose.yml          # local development stack
├── docker-compose.prod.yml     # production stack (mongo + backend + nginx)
└── README.md                   # you are here
```

---

## API reference

The full REST contract &mdash; request bodies, response envelopes, error codes &mdash; lives in **[`backend/API.md`](backend/API.md)**.

Key endpoint groups:

| Prefix                     | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `POST /api/auth/login`     | Login with Turnstile token verification                                  |
| `POST /api/auth/register`  | Register with `.edu` email and Turnstile verification                    |
| `GET  /api/posts`          | Browse / filter posts with smart matching                                |
| `POST /api/meetings`       | Request a meeting (NDA + 3 time slots)                                   |
| `PUT  /api/meetings/:id/accept` | Accept meeting → automatically opens a conversation channel        |
| `GET  /api/conversations`  | List the current user's conversation channels                            |
| `POST /api/conversations/:id/messages` | Send a message in a conversation                           |
| `GET  /api/auth/users/:id` | Get a user's public profile                                              |

All responses follow the same envelope:

```jsonc
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "message": "Human-readable reason" }
```

---

## Demo accounts

Run `npm run seed:realistic-posts` followed by `npm run seed:demo-messages` to populate the database. The login page also exposes **Dev Access** quick-login buttons for the three accounts below.

| Email                            | Password        | Role                    | Notes                                               |
| -------------------------------- | --------------- | ----------------------- | --------------------------------------------------- |
| `elif.kaya@istanbul.edu.tr`      | `HealthAI2026!` | Healthcare Professional | Cardiology posts, confirmed meeting, sample chat    |
| `mert.aydin@metu.edu.tr`         | `HealthAI2026!` | Engineer                | ML / federated learning posts, sample conversation  |
| `admin@healthai.edu`             | `Admin1234!`    | Admin                   | Full admin panel, user management, audit log, CSV   |

> **Dev Access buttons** on the login page let you sign in as any of these accounts with a single click — no typing required.

---

## Testing

```bash
# Backend — Vitest + Supertest, in-memory MongoDB
cd backend
npm test
npm run test:coverage

# Frontend — Vitest + Testing Library
cd frontend
npm test
```

A scripted smoke test that exercises the full happy path (register &rarr; login &rarr; create post &rarr; publish &rarr; request meeting &rarr; accept) is also available:

```bash
cd backend
npm run smoke
```

---

## Seeding & utility scripts

All scripts are run from `backend/`:

| Script                                            | Purpose                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run smoke`                                   | End-to-end smoke test against a live MongoDB                      |
| `npm run seed:realistic-posts`                    | Insert 5 seeded users + 10 realistic healthcare posts             |
| `npm run seed:realistic-meetings`                 | Insert paired meeting requests across the seeded posts            |
| `npm run seed:demo-messages`                      | Create a confirmed meeting + 10-message sample conversation       |
| `npx ts-node scripts/reset-admin-password.ts`     | Reset the admin account password                                  |

---

## Deployment

The repository ships with two Compose files:

- **`docker-compose.yml`** &mdash; local development with hot reload (frontend on `:5173`, backend on `:5000`).
- **`docker-compose.prod.yml`** &mdash; production stack: MongoDB 7 + compiled Node.js backend + static `nginx` frontend (`:80`) that proxies `/api` to the backend.

**Production checklist**

- [ ] Set a strong `JWT_SECRET` (`openssl rand -hex 32`).
- [ ] Point `CLIENT_ORIGIN` to your real domain.
- [ ] Configure SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) so verification e-mails are sent.
- [ ] Replace Turnstile test keys with real keys from [dash.cloudflare.com/turnstile](https://dash.cloudflare.com/turnstile).
- [ ] Put the stack behind HTTPS (Caddy / Traefik / nginx with Let's Encrypt).
- [ ] Schedule MongoDB backups for the `mongo_data` volume.
- [ ] Rotate the admin password after the first deploy.

---

## Security

The platform is hardened against common web threats:

- **Bot protection** &mdash; Cloudflare Turnstile CAPTCHA on login, register and forgot-password; skipped in dev, enforced in production.
- **Transport** &mdash; CORS allowlist, `helmet` security headers, expected behind HTTPS in production.
- **Authentication** &mdash; bcrypt password hashing, JWTs with configurable expiry, 30-minute idle timeout in the client.
- **Rate limiting** &mdash; `express-rate-limit` applied only to auth mutation endpoints (`/login`, `/register`, `/forgot-password`, `/resend-verification`, `/reset-password`) — not to session-read or authenticated endpoints.
- **Input safety** &mdash; `express-mongo-sanitize` strips `$`/`.` operators, request validators on every mutation, multipart upload size limits via `multer`.
- **Auditability** &mdash; every privileged action is appended to the audit log; admin export is CSV-only and read-only.

> Found a security issue? **Please do not open a public GitHub issue.** E-mail the maintainers directly so we can ship a fix before disclosure.

---

## Documentation

Living documentation lives next to the code:

| Document                                                | What is in it                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| [`backend/API.md`](backend/API.md)                      | Full REST contract, error envelope, status codes               |
| [`backend/ROADMAP.md`](backend/ROADMAP.md)              | Phase-by-phase backend delivery plan                           |
| [`backend/CODE_REVIEW.md`](backend/CODE_REVIEW.md)      | Internal code-review notes and known follow-ups                |
| [`INTEGRATION_REVIEW.md`](INTEGRATION_REVIEW.md)        | End-to-end integration notes between frontend and backend      |
| [`requirements/`](requirements)                         | Source SRS, SDD and user-guide drafts                          |

---

## Roadmap

- [x] Authentication, role-based access, account suspension
- [x] Post lifecycle (`draft` &rarr; `published` &rarr; `partner_found`)
- [x] Meeting workflow with NDA and slot proposals
- [x] In-app private messaging (conversation channel per confirmed meeting)
- [x] Notification service with polling and unread count
- [x] Admin panel with audit log, CSV export and user management
- [x] GDPR data export and account deletion
- [x] AI-assisted post drafting (Gemini, behind feature flag)
- [x] Cloudflare Turnstile CAPTCHA on all public auth forms
- [x] Dark mode — system-wide, persisted, all pages covered
- [x] Public profile pages (`/profile/:userId`)
- [x] Saved posts with dashboard section
- [ ] Real-time notifications via WebSocket / Server-Sent Events
- [ ] i18n (EN, TR, DE) and RTL support
- [ ] OpenAPI 3.1 schema and auto-generated client
- [ ] File / document attachments in conversations

---

## Contributing

Contributions, issues and feature requests are very welcome. The short version:

1. **Fork** the repo and create your branch from `main` (e.g. `feat/post-tags`).
2. Run the relevant test suite (`npm test` in `backend/` and/or `frontend/`).
3. Follow the existing TypeScript and ESLint conventions &mdash; descriptive names, no dead code.
4. Open a pull request with a clear description of *what* changed and *why*.

If you are planning a non-trivial change, please open an issue first so we can align on scope.

---

## License

Distributed under the **MIT License**. A `LICENSE` file will be added to the repository root; until then, the project may be used and adapted under the standard MIT terms.

---

## Acknowledgements

- Built with React, Vite, Tailwind CSS, Express and MongoDB &mdash; and the open-source ecosystems around them.
- Typography: **Plus Jakarta Sans** (headlines) and **Source Sans 3** (body) via Google Fonts.
- Icons: **Lucide**.
- Bot protection: **Cloudflare Turnstile**.
- Originally created as a SENG 384 capstone project (Spring 2026).

<div align="center">

**If this project helped you, consider leaving a star &mdash; it really helps others discover it.**

</div>
