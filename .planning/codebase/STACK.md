# Technology Stack

**Analysis Date:** 2026-04-25

## Languages

**Primary:**
- TypeScript 5.4.5+ - Used in both backend and frontend for type-safe development
- JavaScript/JSX/TSX - React components and browser runtime in frontend

**Secondary:**
- CSS/Tailwind CSS - Styling via utility-first framework

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Both backend and frontend development/production
- Browser runtime - React 18 frontend in Chrome/Firefox/Safari

**Package Manager:**
- npm (npm v10+, bundled with Node.js 20)
- Lockfile: `backend/package-lock.json` and `frontend/package-lock.json` present

## Frameworks

**Core Backend:**
- Express.js 4.19.2 - HTTP API framework with routing, middleware, and security headers

**Core Frontend:**
- React 18.3.1 - UI component library and state management foundation
- React Router DOM 6.30.3 - Client-side routing
- Vite 6.0.5 - Build tool and dev server (HMR-enabled)

**Frontend UI & Forms:**
- TailwindCSS 3.4.17 - Utility-first CSS framework
- Lucide React 0.469.0 - Icon library
- React Hook Form 7.72.1 - Form state and validation management
- @hookform/resolvers 5.2.2 - Schema validation resolvers for RHF
- Zod 4.3.6 - TypeScript-first schema validation
- Framer Motion 12.38.0 - Animation library

**Testing:**
- Not detected

**Build/Dev:**
- TypeScript 5.7.2+ (frontend), 5.4.5+ (backend) - Type compilation
- Vite 6.0.5 - Frontend bundler and dev server with React plugin
- ts-node-dev 2.0.0 - Backend development with hot-reload
- PostCSS 8.4.49 - CSS processing with autoprefixer
- Autoprefixer 10.4.20 - Browser CSS prefix automation

## Key Dependencies

**Critical Backend:**
- mongoose 8.4.1 - MongoDB ODM for data modeling and queries
- jsonwebtoken 9.0.3 - JWT token generation/verification for authentication
- bcryptjs 3.0.3 - Password hashing and comparison
- express-rate-limit 8.4.0 - Rate limiting for auth endpoints
- helmet 8.1.0 - Security headers middleware
- express-mongo-sanitize 2.2.0 - NoSQL injection prevention
- cors 2.8.5 - Cross-origin resource sharing

**Critical Frontend:**
- @google/generative-ai 0.24.1 - Google Gemini AI API client for smart matching
- axios 1.15.2 - HTTP client with interceptors for token-based auth
- zustand 5.0.12 - Lightweight state management for auth, posts, meetings, notifications
- react-dom 18.3.1 - React DOM rendering

## Configuration

**Environment:**
- `.env` files for development and production (see `.env.example` files)
- `MONGO_URI` - MongoDB connection string (Atlas or local)
- `JWT_SECRET` - Signing secret for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration duration (default: 7d)
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Runtime mode (development/production)
- `CLIENT_ORIGIN` - CORS origin for frontend (default: http://localhost:5173)
- `VITE_API_URL` - Frontend API endpoint URL
- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI features

**Build:**
- `backend/tsconfig.json` - TypeScript compiler options (target: ES2020, strict mode enabled)
- `frontend/tsconfig.json` - TypeScript compiler options (React JSX, bundler module resolution)
- `frontend/vite.config.ts` - Vite configuration with React plugin
- `backend/Dockerfile` - Multi-stage Docker build (dev, builder, prod)
- `frontend/Dockerfile` - Multi-stage Docker build (dev, builder, prod with nginx)

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+
- Docker and Docker Compose (for containerized development)
- .env files with API credentials (see `.env.example`)

**Production:**
- Docker and Docker Compose with:
  - MongoDB 7 service (Atlas recommended or self-hosted)
  - Node.js 20 Alpine container for backend API
  - Nginx Alpine container for frontend with static asset serving and reverse proxy
  - Environment variables injected at runtime (MONGO_URI, JWT_SECRET, etc.)

## Development & Run Commands

**Backend:**
```bash
npm run dev       # Start ts-node-dev with hot-reload (port 5000)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled JavaScript in production
```

**Frontend:**
```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # Build optimized production bundle
npm run preview   # Preview production build locally
```

**Docker (Development):**
```bash
docker-compose up     # Start backend (port 5000) + frontend (port 5173) with hot-reload
```

**Docker (Production):**
```bash
docker-compose -f docker-compose.prod.yml up   # Start MongoDB + compiled backend + nginx frontend
```

---

*Stack analysis: 2026-04-25*
