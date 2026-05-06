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

[**Quick start**](#quick-start) &middot; [**API docs**](backend/API.md) &middot; [**Architecture**](#architecture) &middot; [**Roadmap**](backend/ROADMAP.md) &middot; [**Report a bug**](https://github.com/berkekus/healthai-co-creation-platform/issues)

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

| Area              | State                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| Core product      | **Stable** &mdash; auth, posts, meetings, notifications, admin all delivered  |
| API surface       | **Stable** &mdash; documented in [`backend/API.md`](backend/API.md)           |
| Test coverage     | **Active** &mdash; Vitest + Supertest backend, Vitest + Testing Library front |
| Production deploy | **Ready** &mdash; one-command Docker stack with MongoDB, Node and nginx       |
| AI features       | **Experimental** &mdash; Gemini-powered drafting behind a feature flag        |

The platform is actively maintained on the `main` and `backend` branches. The latest tracked work and gaps are listed in [`INTEGRATION_REVIEW.md`](INTEGRATION_REVIEW.md) and [`backend/CODE_REVIEW.md`](backend/CODE_REVIEW.md).

---

## Features

<table>
<tr><td valign="top" width="50%">

### Core product
- **Authentication** &mdash; email + password, `.edu` verification, 30-minute idle session timeout with countdown, rate limiting after 3 failed attempts.
- **Post lifecycle** &mdash; `draft` &rarr; `published` &rarr; `partner_found` (or `expired` / `closed`), with confidentiality flags (public pitch vs. meeting-only).
- **Smart matching** &mdash; per-card match chips (city, country, cross-role, expertise overlap) plus a *Best matches for you* featured row.
- **Meeting workflow** &mdash; 3-step interest flow (message &rarr; NDA &rarr; 3 proposed slots), owner accept / counter-propose / decline, tabbed inbox.
- **Real-time notifications** &mdash; push-style notifications with polling, unread count, mark-as-read, bulk actions.
- **Admin panel** &mdash; user suspension, post moderation, audit log with filters and CSV export.

</td><td valign="top" width="50%">

### Compliance & quality
- **GDPR-ready** &mdash; Art. 6 legal basis, Art. 15 / 17 / 20 / 21 user rights, JSON data export, account deletion, cookie consent banner.
- **Security** &mdash; JWT auth, bcrypt password hashing, `helmet`, rate limiting, `express-mongo-sanitize`, CORS allowlist.
- **Tamper-evident audit log** &mdash; every privileged action is logged with `userId`, `userEmail`, `role`, `action`, `ipAddress`, `result`.
- **Accessibility** &mdash; semantic landmarks, keyboard-reachable cards, ARIA on every modal, WCAG AA color pairings, `prefers-reduced-motion` support.
- **Testing** &mdash; Vitest + Supertest on the backend (in-memory MongoDB), Vitest + Testing Library on the frontend.
- **DX** &mdash; fully typed REST contract shared between client and server, single `docker compose up` for the whole stack.

</td></tr>
</table>

---

## Tech stack

| Layer        | Technologies                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 18, TypeScript 5, Vite 6, Tailwind CSS 3, React Router 6, Zustand, React Hook Form + Zod, Framer Motion, Lucide         |
| **Backend**  | Node.js 20, Express 4, TypeScript 5, Mongoose 8, Pino, `node-cron`                                                            |
| **Database** | MongoDB 7                                                                                                                     |
| **Security** | JWT, bcryptjs, Helmet, `express-rate-limit`, `express-mongo-sanitize`, CORS allowlist                                         |
| **Email**    | Nodemailer (SMTP &mdash; Gmail, SES, Mailgun&hellip;)                                                                         |
| **AI**       | Google Generative AI (Gemini) &mdash; optional, behind `VITE_GEMINI_API_KEY`                                                  |
| **Tooling**  | Docker, Docker Compose, Vitest, Supertest, `mongodb-memory-server`, Testing Library, ESLint, ts-node-dev                      |

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Browser"]
        UI["React 18 + Vite<br/>Zustand &middot; React Router<br/>Tailwind &middot; Framer Motion"]
    end

    subgraph Edge["Edge / Reverse proxy"]
        NGINX["nginx<br/>static assets + /api proxy"]
    end

    subgraph API["Backend (Node.js &middot; Express)"]
        AUTH["Auth & RBAC<br/>JWT &middot; bcrypt"]
        POSTS["Posts service"]
        MEET["Meetings service"]
        NOTIF["Notifications service"]
        LOGS["Audit log service"]
        AI["AI assist (Gemini)"]
    end

    subgraph Data["Persistence"]
        MONGO[("MongoDB 7<br/>users &middot; posts &middot; meetings<br/>notifications &middot; logs")]
    end

    SMTP["SMTP<br/>Nodemailer"]

    UI -->|HTTPS| NGINX
    NGINX -->|/api| AUTH
    NGINX --> POSTS
    NGINX --> MEET
    NGINX --> NOTIF
    NGINX --> LOGS
    NGINX --> AI

    AUTH --> MONGO
    POSTS --> MONGO
    MEET --> MONGO
    NOTIF --> MONGO
    LOGS --> MONGO

    AUTH -. verification mails .-> SMTP
    MEET  -. invitations .-> SMTP
```

**Key design principles**

- **One contract, two sides.** The TypeScript types in `frontend/src/types` and `backend/models` describe exactly the same entities &mdash; adding a field is a single PR.
- **Stateless API + JWT.** No server-side sessions; horizontal scaling is just *add another container*.
- **Audit log as a first-class citizen.** Every privileged write goes through `services/logService` so the admin tab and CSV export work without extra wiring.
- **Role-aware UI.** Route guards in `router/AppRouter.tsx` send unauthorised visitors to a designed `403` page, not a silent redirect &mdash; so it is always obvious *why* something is blocked.

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

| Variable          | Required | Default                              | Description                                            |
| ----------------- | :------: | ------------------------------------ | ------------------------------------------------------ |
| `PORT`            |          | `5000`                               | HTTP port                                              |
| `MONGO_URI`       | yes      | `mongodb://localhost:27017/healthai` | MongoDB connection string                              |
| `JWT_SECRET`      | yes      | &mdash;                              | Use a long random string in production                 |
| `JWT_EXPIRES_IN`  |          | `7d`                                 | Token lifetime                                         |
| `NODE_ENV`        |          | `development`                        | `development` &#124; `production`                      |
| `CLIENT_ORIGIN`   |          | `http://localhost:5173`              | CORS allowlist                                         |
| `SMTP_HOST` &hellip; |       | empty                                | When unset, e-mails are logged to the console         |
| `APP_BASE_URL`    |          | `http://localhost:5173`              | Used in e-mail links                                   |

### Frontend (`frontend/.env`)

| Variable                | Required | Default                       | Description                                            |
| ----------------------- | :------: | ----------------------------- | ------------------------------------------------------ |
| `VITE_API_URL`          | yes      | `http://localhost:5000/api`   | Backend base URL                                       |
| `VITE_GEMINI_API_KEY`   |          | &mdash;                       | Optional &mdash; enables the AI assistant features     |

---

## Project structure

```
healthai-co-creation-platform/
├── backend/
│   ├── src/                # app.ts, index.ts, cron.ts, logger.ts (entry points)
│   ├── routes/             # auth, posts, meetings, notifications, logs, AI
│   ├── controllers/        # request handlers
│   ├── services/           # business logic (logService, mailService, ...)
│   ├── models/             # Mongoose schemas: User, Post, Meeting, Notification, Log
│   ├── middleware/         # auth, admin, rate limiters, error handler
│   ├── scripts/            # smoke test, seed scripts, admin password reset
│   ├── tests/              # Vitest + Supertest + mongodb-memory-server
│   ├── API.md              # full REST reference
│   └── ROADMAP.md          # backend delivery plan
├── frontend/
│   ├── src/
│   │   ├── pages/          # auth, dashboard, posts, meetings, admin, profile, errors
│   │   ├── components/     # layout, posts, meetings, ui primitives
│   │   ├── store/          # Zustand slices: auth, post, meeting, notification
│   │   ├── router/         # AppRouter with protected & role-guarded routes
│   │   ├── utils/          # matchPosts, formatters, validation
│   │   ├── types/          # shared TS contract types
│   │   └── data/           # seed users, posts, meetings, logs
│   └── README.md           # frontend-only deep dive
├── requirements/           # SRS, SDD and user-guide source documents
├── docker-compose.yml      # local development stack
├── docker-compose.prod.yml # production stack (mongo + backend + nginx)
└── README.md               # you are here
```

---

## API reference

The full REST contract &mdash; request bodies, response envelopes, error codes &mdash; lives in **[`backend/API.md`](backend/API.md)**.

A quick taste:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "email": "jane@university.edu",
  "password": "password123",
  "role": "healthcare_professional",
  "institution": "Charite Berlin",
  "city": "Berlin",
  "country": "Germany"
}
```

```json
{
  "success": true,
  "data": {
    "user": { "id": "664f...", "role": "healthcare_professional", "isVerified": true },
    "token": "eyJhbGciOi..."
  }
}
```

All responses follow the same envelope:

```jsonc
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "message": "Human-readable reason" }
```

---

## Demo accounts

The frontend ships with realistic seed data (5 users, 10 posts, 7 meetings, 20 audit log entries). Sign in via `/login`.

| Email                    | Role                    | City      | Highlights                                                 |
| ------------------------ | ----------------------- | --------- | ---------------------------------------------------------- |
| `e.muller@charite.edu`   | Healthcare professional | Berlin    | 2 active posts, 1 confirmed meeting, GDPR data-export      |
| `m.rossi@polimi.edu`     | Engineer                | Barcelona | FL framework post, incoming stroke-unit collab request     |
| `i.larsson@ki.edu`       | Healthcare professional | Stockholm | Oncology + ophthalmology posts, 3 pending meetings         |
| `k.nakamura@tum.edu`     | Engineer                | Berlin    | Wearable fall-detector, mental-health NLP post             |
| `admin@healthai.edu`     | Admin                   | Amsterdam | Full admin panel, users / posts / logs, CSV export         |

> Default password is `password123` for users and `admin123` for admin.

---

## Testing

```bash
# Backend - Vitest + Supertest, in-memory MongoDB
cd backend
npm test
npm run test:coverage

# Frontend - Vitest + Testing Library
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

The backend exposes a small set of CLI scripts (run from `backend/`):

| Script                              | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `npm run smoke`                     | End-to-end smoke test against an in-memory MongoDB                       |
| `npm run seed:realistic-posts`      | Insert a realistic set of healthcare and engineer posts                  |
| `npm run seed:realistic-meetings`   | Insert paired meeting requests across the seeded posts                   |
| `npx ts-node scripts/reset-admin-password.ts` | Reset the admin account password (interactive)                 |

---

## Deployment

The repository ships with two Compose files:

- **`docker-compose.yml`** &mdash; local development with hot reload (frontend on `:5173`, backend on `:5000`).
- **`docker-compose.prod.yml`** &mdash; production stack: MongoDB 7 + compiled Node.js backend + static `nginx` frontend (`:80`) that proxies `/api` to the backend.

**Production checklist**

- [ ] Set a strong `JWT_SECRET` (`openssl rand -hex 32`).
- [ ] Point `CLIENT_ORIGIN` to your real domain.
- [ ] Configure SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) so verification e-mails are sent.
- [ ] Put the stack behind HTTPS (Caddy / Traefik / nginx with Let's Encrypt).
- [ ] Schedule MongoDB backups for the `mongo_data` volume.
- [ ] Rotate the admin password after the first deploy.

---

## Security

The platform is hardened against common web threats:

- **Transport** &mdash; CORS allowlist, `helmet` security headers, expected behind HTTPS in production.
- **Authentication** &mdash; bcrypt password hashing, JWTs with configurable expiry, 30-minute idle timeout in the client, lockout after 3 failed attempts.
- **Input safety** &mdash; `express-mongo-sanitize` strips `$`/`.` operators, request validators on every mutation, multipart upload size limits via `multer`.
- **Rate limiting** &mdash; `express-rate-limit` on auth and write endpoints.
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
| [`frontend/README.md`](frontend/README.md)              | Frontend-only deep dive                                        |

---

## Roadmap

- [x] Authentication, role-based access, account suspension
- [x] Post lifecycle (`draft` &rarr; `published` &rarr; `partner_found`)
- [x] Meeting workflow with NDA and slot proposals
- [x] Notification service with polling and unread count
- [x] Admin panel with audit log and CSV export
- [x] GDPR data export and account deletion
- [x] AI-assisted post drafting (Gemini, behind feature flag)
- [ ] Real-time notifications via WebSocket / Server-Sent Events
- [ ] Public profile pages with portfolio uploads
- [ ] i18n (EN, TR, DE) and RTL support
- [ ] OpenAPI 3.1 schema and auto-generated client

A more detailed, phase-by-phase plan lives in **[`backend/ROADMAP.md`](backend/ROADMAP.md)**.

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

- Built with React, Vite, Tailwind, Express and MongoDB &mdash; and the open-source ecosystems around them.
- Typography: **Plus Jakarta Sans** (headlines) and **Source Sans 3** (body) via Google Fonts.
- Icons: **Material Symbols Outlined** and **Lucide**.
- Originally created as a SENG 384 capstone project (Spring 2026).

<div align="center">

**If this project helped you, consider leaving a star &mdash; it really helps others discover it.**

</div>
