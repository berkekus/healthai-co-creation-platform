# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**AI/LLM:**
- Google Gemini API (gemini-2.0-flash model)
  - What it's used for: AI-powered semantic matching between user expertise and project requirements
  - SDK/Client: `@google/generative-ai` 0.24.1
  - Auth: `VITE_GEMINI_API_KEY` environment variable (frontend only)
  - Implementation: `frontend/src/lib/gemini.ts`
  - Features: Smart suggestion scoring with rate-limiting, session-based caching, graceful fallback to keyword matching
  - Rate limiting: Batch size 2, 4-second delay between batches to prevent 429 errors

## Data Storage

**Databases:**
- MongoDB 7
  - Connection: `MONGO_URI` environment variable (e.g., `mongodb://localhost:27017/healthai` for local, Atlas URI for cloud)
  - Client: Mongoose 8.4.1 (ODM)
  - Connection logic: `backend/config/db.ts` with health checks in docker-compose
  - Collections: User, Post, Meeting, Notification, Log

**File Storage:**
- Not detected - Codebase uses local files only, no S3/GCS/Azure Blob integration

**Caching:**
- Session-level in-memory cache for Gemini API responses (frontend)
- No Redis or external cache service detected
- Implementation: `_cache` Map in `frontend/src/lib/gemini.ts`

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no third-party OAuth/SSO)
  - Implementation: Backend JWT generation in `backend/services/authService.ts`
  - Token creation: `jsonwebtoken` 9.0.3 with `JWT_SECRET` and expiration (`JWT_EXPIRES_IN`)
  - Password hashing: `bcryptjs` 3.0.3 with 10 salt rounds
  - Frontend token storage: `localStorage` via `token` key
  - Frontend token injection: Axios interceptor in `frontend/src/lib/api.ts` adds `Authorization: Bearer <token>` header
  - Token validation: Backend middleware verifies JWT signature (not yet integrated, auth.ts not found)
  - Logout: Frontend clears localStorage on 401 response and redirects to login

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Datadog, or similar integration

**Logs:**
- Console logging (console.log, console.error) in backend
  - Database connection status: `backend/config/db.ts`
  - Server startup: `backend/src/index.ts`
  - MongoDB errors logged to stdout
- No external logging service (ELK, Splunk, etc.) detected

## CI/CD & Deployment

**Hosting:**
- Docker-based containerization for local and cloud deployment
- Backend: Node.js 20 Alpine image with compiled TypeScript
- Frontend: Nginx 1.27 Alpine with static SPA assets and reverse proxy to backend
- Development: Docker Compose with mounted volumes for hot-reload
- Production: Docker Compose with MongoDB service, no external orchestration (Kubernetes, etc.)

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, Jenkins, or similar

**Deployment Architecture:**
- Development: `docker-compose.yml`
  - Frontend on http://localhost:5173 (Vite dev server)
  - Backend on http://localhost:5000 (ts-node-dev)
  - MongoDB running in host (local install, not containerized)
- Production: `docker-compose.prod.yml`
  - Frontend on http://localhost:80 (Nginx reverse proxy with static assets)
  - Backend on http://backend:5000 (compiled Node.js)
  - MongoDB on mongodb://mongodb:27017 (containerized service)
  - Nginx reverse proxy: `/api/*` routed to backend, `/` serves SPA with fallback to index.html

## Environment Configuration

**Required env vars:**

Backend (`.env.example` at `backend/.env.example`):
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Token signing secret (required)
- `NODE_ENV` - Environment mode (development/production)
- `JWT_EXPIRES_IN` - Token expiration (optional, default: 7d)
- `CLIENT_ORIGIN` - CORS allowed origin (optional, default: http://localhost:5173)

Frontend (`.env.example` at `frontend/.env.example`):
- `VITE_API_URL` - Backend API base URL (default: http://localhost:5000/api)
- `VITE_GEMINI_API_KEY` - Google Gemini API key (required for AI features)

**Secrets location:**
- `.env` files in `backend/` and `frontend/` (not committed to git)
- Docker Compose loads via `env_file` directive in development
- Production: Environment variables injected at container runtime

## Webhooks & Callbacks

**Incoming:**
- Not detected - No webhook receivers for external events

**Outgoing:**
- Not detected - No webhook senders to external services

## HTTP API Communication

**Frontend to Backend:**
- Base URL: `VITE_API_URL` environment variable (defaults to http://localhost:5000/api)
- Client: Axios 1.15.2 with interceptors
- Authentication: JWT Bearer token in `Authorization` header (added by `api.interceptors.request`)
- Response handling: 401 redirects to login, errors extracted from `response.data.message`
- CORS: Enabled in backend with dynamic origin validation against `allowedOrigins`

**Backend API Endpoints:**
- `/api/auth/*` - Authentication routes (rate-limited via `express-rate-limit`)
- `/api/posts/*` - Post management (CRUD, filtering, publish, interest, partner matching)
- `/api/meetings/*` - Meeting request handling
- `/api/notifications/*` - Notification push and retrieval
- `/api/logs/*` - Activity logging
- `/health` - Health check endpoint

## Security Features

**Backend Security Middleware:**
- `helmet` - Sets security headers (CSP, X-Frame-Options, etc.)
- `express-mongo-sanitize` - Strips `$` prefixed keys to prevent NoSQL injection
- `express-rate-limit` - Rate limiting on `/api/auth/*` endpoints (prevent brute-force)
- CORS with origin validation - Only allows configured origins
- JSON payload limit: 10KB max body size
- JWT authentication with expiration
- Password hashing: bcryptjs with 10 salt rounds

---

*Integration audit: 2026-04-25*
