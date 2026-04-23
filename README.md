# HEALTH AI — Co-Creation Platform

> A full-stack matchmaking platform that connects **engineers** and **healthcare professionals** to co-create medical AI projects — from idea to pilot — inside a safe, auditable workspace.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat&logo=google&logoColor=white)

---

## Overview

HEALTH AI bridges the gap between clinical expertise and technical engineering. Healthcare professionals post collaboration opportunities; engineers find matching projects using keyword-based and AI-powered semantic matching (Gemini 2.0 Flash). The platform handles the full lifecycle: from discovery → meeting request → NDA acceptance → confirmed meeting.

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 18 + TypeScript + Vite 6 |
| Routing | React Router 6 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS 3 |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| HTTP | Axios |

### Backend
| | |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express 4 |
| Database | MongoDB 7 + Mongoose 8 |
| Auth | JWT + bcryptjs |
| Security | helmet · express-rate-limit · express-mongo-sanitize |

### Infrastructure
| | |
|---|---|
| Containerisation | Docker + Docker Compose |
| Dev workflow | ts-node-dev (hot reload) |
| Prod serving | Node.js compiled · nginx (frontend) |

---

## Architecture

```
Browser
  │
  ├── :5173  Frontend (React / Vite)
  │             │
  │             ├── Zustand stores (auth · post · meeting · notification)
  │             └── Gemini AI (smart match chips, async)
  │
  └── :5000  Backend (Express / TypeScript)
               │
               ├── /api/auth          JWT auth, user management
               ├── /api/posts         CRUD + publish + partner-found
               ├── /api/meetings      Request → accept/decline/cancel
               ├── /api/notifications Auto-triggered on meeting events
               └── /api/logs          Admin audit trail (admin-only)
                          │
                     MongoDB :27017
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
# Clone & start everything (MongoDB + backend + frontend)
git clone https://github.com/<your-username>/healthai-co-creation-platform.git
cd healthai-co-creation-platform

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up -d

# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

To stop:
```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers + wipe database
```

### Option B — Manual (npm run dev)

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env         # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                  # http://localhost:5000

# Terminal 2 — Frontend
cd frontend
cp .env.example .env         # set VITE_API_URL and VITE_GEMINI_API_KEY
npm install
npm run dev                  # http://localhost:5173
```

---

## Environment Variables

### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthai
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=<your-google-ai-studio-key>
```

> Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com). Free tier: **1,500 requests/day · 15 requests/minute**.
> The app works without a Gemini key — AI chips simply won't appear.

---

## Demo Accounts

Register via `/register` or use the pre-seeded accounts below.  
All test account passwords: `Test123!` · Admin: `Admin123!`

| Role | Email | Expertise |
|------|-------|-----------|
| **Admin** | `admin@healthai.edu` | Full admin panel access |
| **Engineer** | `ahmet@metu.edu.tr` | ML · Computer Vision · NLP · TensorFlow |
| **Engineer** | `zeynep@boun.edu.tr` | Cloud · Backend · Kubernetes · IoT |
| **Engineer** | `can@itu.edu.tr` | Biomedical · Signal Processing · Wearables |
| **Healthcare** | `ayse@hacettepe.edu.tr` | Cardiology · ECG · Remote Monitoring |
| **Healthcare** | `mehmet@istanbul.edu.tr` | Neurology · MRI · Alzheimer's |
| **Healthcare** | `fatma@ege.edu.tr` | Endocrinology · Diabetes · CGM |

---

## Feature Overview

### Matching & Discovery
- **Keyword matching** — instant chips based on city / country / cross-role / expertise tag overlap
- **AI matching** — Gemini 2.0 Flash semantic analysis (async, cached per session)
- **"Best matches for you"** — featured row sorted by combined basic + AI score
- **Filters** — domain · project stage · status · posted-by role · city · country · free-text search

### Auth & Profiles
- JWT-based authentication with 7-day token expiry
- Hydration on page refresh (token → `/auth/me`)
- Profile with bio, institution, city, country, expertise tags
- Role-based route guards (`engineer` · `healthcare_professional` · `admin`)

### Post Lifecycle
```
draft → active → meeting_scheduled → partner_found
                                   → expired
```

### Meeting Workflow
```
POST /meetings          → status: pending
POST /meetings/:id/accept  → status: confirmed + confirmedSlot
POST /meetings/:id/decline → status: declined
POST /meetings/:id/cancel  → status: cancelled
```
Every state change automatically creates a notification for the other party.

### Notifications
Auto-generated on: `meeting_request` · `meeting_accepted` · `meeting_declined` · `meeting_cancelled`

### Admin Panel
- User list with suspend / unsuspend
- Audit log with filters (userId · action · date range · result) and pagination
- Actions logged: register · login · post_create · post_publish · post_delete · meeting_request · meeting_accept · meeting_decline · meeting_cancel · user_suspend · user_unsuspend · profile_update

### Security
- `helmet` — 12 HTTP security headers (CSP, HSTS, X-Frame-Options…)
- `express-rate-limit` — 20 req / 15 min on all `/api/auth/*` routes
- `express-mongo-sanitize` — strips `$`-prefixed keys from body/query
- `typeof` guards on login body (NoSQL injection via object payload)
- Request body size limited to 10 KB
- Passwords never returned in any API response

---

## Project Structure

```
.
├── docker-compose.yml          # dev (hot-reload volumes)
├── docker-compose.prod.yml     # prod (compiled + nginx)
│
├── backend/
│   ├── src/index.ts            # Express app entry point
│   ├── config/db.ts            # Mongoose connection
│   ├── middleware/             # authMiddleware · errorHandler · rateLimiter
│   ├── models/                 # User · Post · Meeting · Notification · Log
│   ├── controllers/            # authController · postController · meetingController …
│   ├── services/               # authService · postService · meetingService …
│   ├── routes/                 # authRoutes · postRoutes · meetingRoutes …
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── App.tsx             # Root — hydrate on mount, fetchPosts on auth
    │   ├── router/             # AppRouter · ProtectedRoute
    │   ├── pages/              # auth · dashboard · posts · meetings · admin · profile · errors
    │   ├── components/         # layout · posts · meetings · ui
    │   ├── store/              # authStore · postStore · meetingStore · notificationStore
    │   ├── lib/
    │   │   ├── api.ts          # Axios instance + interceptors
    │   │   └── gemini.ts       # Gemini client · analyzeProjectMatch · useSmartSuggestions
    │   ├── utils/matchPosts.ts # computeMatchReasons · computeEnhancedMatchReasons · rankByMatch
    │   └── types/              # auth.types · post.types · meeting.types · common.types
    ├── nginx.conf              # SPA routing + /api proxy (prod)
    └── Dockerfile
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user (hydrate) |
| PUT | `/api/auth/me/profile` | ✅ | Update profile |
| GET | `/api/auth/users` | Admin | List all users |
| PUT | `/api/auth/users/:id/suspend` | Admin | Suspend / unsuspend |
| GET | `/api/posts` | ✅ | List posts (query filters) |
| POST | `/api/posts` | ✅ | Create post |
| PUT | `/api/posts/:id` | ✅ | Update post |
| POST | `/api/posts/:id/publish` | ✅ | Publish (draft → active) |
| POST | `/api/posts/:id/partner-found` | ✅ | Close with partner |
| DELETE | `/api/posts/:id` | ✅ | Delete post |
| GET | `/api/meetings` | ✅ | List own meetings |
| POST | `/api/meetings` | ✅ | Request meeting |
| POST | `/api/meetings/:id/accept` | ✅ | Accept + confirm slot |
| POST | `/api/meetings/:id/decline` | ✅ | Decline |
| POST | `/api/meetings/:id/cancel` | ✅ | Cancel |
| GET | `/api/notifications` | ✅ | List own notifications |
| POST | `/api/notifications/:id/read` | ✅ | Mark as read |
| POST | `/api/notifications/mark-all-read` | ✅ | Mark all as read |
| GET | `/api/notifications/unread-count` | ✅ | Unread count |
| GET | `/api/logs` | Admin | Audit logs (with filters) |

All responses follow: `{ success: boolean, data: T }` · errors: `{ success: false, message: string }`

---

## Development Notes

- **Rate limiter resets** on server restart (in-memory store). Use `docker compose restart backend` during heavy testing.
- **Gemini cache** is session-scoped (module-level `Map`). Reloading the page re-analyzes posts. This is intentional — fresh analysis after new posts are added.
- **MongoDB in Docker** is isolated from your local MongoDB. Data persists in the `mongo_data` Docker volume until `docker compose down -v`.

---

© 2026 HEALTH AI — Co-Creation Platform · SENG 352 · Spring 2026
