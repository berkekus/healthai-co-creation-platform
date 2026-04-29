# Software Design Document (SDD)

| Field | Value |
|-------|-------|
| **Project Name** | HEALTH AI Co-Creation & Innovation Platform |
| **Course** | [Course Name and Code] |
| **Group No / Name** | [Group number or name] |
| **Group Members** | [Full Name – Student ID] |
| **Submission Date** | 29/04/2026 |
| **Version** | 1.0 |

### Revision History

| Date | Version | Change Description | Author |
|------|---------|-------------------|--------|
| 29/04/2026 | 1.0 | Initial version | [Full Name] |

---

## Table of Contents

1. Introduction
2. Architectural Design
3. Component Design
4. Database Design
5. API Design
6. UI Design
7. Security Design
8. State Diagrams
9. SRS–SDD Traceability Matrix
10. Appendices

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document (SDD) translates the requirements defined in the SRS for the **HEALTH AI Co-Creation & Innovation Platform** into a concrete architectural and design blueprint. It describes how the system's components are structured, how they interact, and how each SRS requirement will be realized at the implementation level. This document guides developers during the construction phase and serves as the technical reference for the instructor.

### 1.2 Scope

This document covers the architectural design, component structure, database schema, REST API design, UI screen structure, security design, and post/meeting state diagrams for the HEALTH AI platform. The design is fully consistent with the functional and non-functional requirements specified in SRS Version 1.0.

### 1.3 Reference Documents

- Software Requirements Specification (SRS) – HEALTH AI Co-Creation & Innovation Platform, Version 1.0, 29/04/2026
- HEALTH AI Co-Creation Platform – Project Brief (Revised)

### 1.4 Definitions and Abbreviations

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| REST | Representational State Transfer — stateless HTTP-based API style |
| JWT | JSON Web Token — compact, self-contained token for authentication |
| ODM | Object Document Mapper — maps code objects to MongoDB documents (Mongoose) |
| MVC | Model-View-Controller — software architectural pattern |
| RBAC | Role-Based Access Control |
| CSP | Content Security Policy — HTTP header to prevent XSS |
| CORS | Cross-Origin Resource Sharing — controls browser cross-origin requests |
| SPA | Single Page Application — entire app served as one HTML file, navigation handled client-side |
| HMR | Hot Module Replacement — dev server feature for instant UI updates |
| GDPR | General Data Protection Regulation |
| NDA | Non-Disclosure Agreement |
| bcrypt | Adaptive password hashing algorithm |
| Mongoose | ODM library for Node.js and MongoDB |
| Zustand | Lightweight state management library for React |
| Vite | Modern frontend build tool and dev server |

---

## 2. Architectural Design

### 2.1 Architectural Overview

The system follows a **3-Tier Client-Server Architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION TIER                       │
│         React SPA (TypeScript + Tailwind CSS)            │
│      Served via Nginx (prod) / Vite dev server (dev)     │
└─────────────────────┬───────────────────────────────────┘
                      │  HTTPS REST API (JSON)
                      │  Authorization: Bearer <JWT>
┌─────────────────────▼───────────────────────────────────┐
│                 APPLICATION TIER                         │
│           Node.js + Express.js (TypeScript)              │
│   Routes → Controllers → Services → Mongoose Models     │
└─────────────────────┬───────────────────────────────────┘
                      │  Mongoose ODM (TCP)
┌─────────────────────▼───────────────────────────────────┐
│                    DATA TIER                             │
│                  MongoDB 7                               │
│   Collections: users, posts, meetings,                   │
│                notifications, logs                       │
└─────────────────────────────────────────────────────────┘
```

The **frontend and backend are fully decoupled**: the React SPA communicates with the Express backend exclusively through REST API calls using JSON. The backend itself follows a **layered MVC-like pattern**:

```
HTTP Request → Router → Controller → Service → Model → MongoDB
                                         ↓
                               logService (audit)
                               notificationService (push)
```

The frontend uses **Zustand** for global client-side state management, organized in per-domain stores (authStore, postStore, meetingStore, notificationStore). All HTTP calls go through a single **Axios instance** that attaches the JWT token to every request header.

An **AI Matching** subsystem runs on the frontend, calling the Google Gemini API directly to score compatibility between the logged-in user's expertise tags and available posts.

### 2.2 Layers

| Layer | Responsibility | Technology Choice |
|-------|---------------|------------------|
| **Presentation** | User interface rendering, client-side routing, form validation, state management, AI matching calls | React 18.3 (TypeScript 5.7), Vite 6, Tailwind CSS 3.4, React Router 6.30, Zustand 5.0, React Hook Form 7.72, Zod 4.3 |
| **Business Logic** | Request routing, JWT authentication, RBAC authorization, input validation, business rules (post lifecycle, meeting workflow), audit logging, notification dispatch | Node.js 20, Express.js 4.19, TypeScript 5.4, Helmet 8.1, express-rate-limit 8.4, express-mongo-sanitize 2.2 |
| **Data Access** | MongoDB document mapping, schema validation, query building, index management | Mongoose 8.4 (ODM) |
| **Database** | Persistent data storage for all entities | MongoDB 7 |

### 2.3 Deployment Diagram

#### Development Environment

```
Developer Machine
┌─────────────────────────────────────────────────────┐
│  Docker Compose (docker-compose.yml)                 │
│                                                      │
│  ┌──────────────────┐   ┌──────────────────┐        │
│  │  frontend:dev    │   │  backend:dev     │        │
│  │  Node.js (Vite)  │   │  Node.js 20      │        │
│  │  Port: 5173      │◄──│  Port: 5000      │        │
│  │  Hot Reload      │   │  ts-node-dev HMR │        │
│  └──────────────────┘   └────────┬─────────┘        │
│                                  │                   │
│                    ┌─────────────▼─────────┐        │
│                    │  mongodb:dev          │        │
│                    │  MongoDB 7            │        │
│                    │  Port: 27017          │        │
│                    └───────────────────────┘        │
└─────────────────────────────────────────────────────┘
Browser → http://localhost:5173
API calls → http://localhost:5000/api
```

#### Production Environment

```
Production Server
┌─────────────────────────────────────────────────────┐
│  Docker Compose (docker-compose.prod.yml)            │
│                                                      │
│  ┌──────────────────────────────────┐               │
│  │  frontend:prod                   │               │
│  │  Nginx 1.27 Alpine               │               │
│  │  Serves built React SPA          │               │
│  │  Port: 80 / 443 (TLS)            │               │
│  │  Reverse proxies /api → backend  │               │
│  └──────────────────────────────────┘               │
│                                                      │
│  ┌──────────────────┐   ┌──────────────────┐        │
│  │  backend:prod    │   │  mongodb:prod    │        │
│  │  Node.js 20      │   │  MongoDB 7       │        │
│  │  Compiled JS     │◄──│  Port: 27017     │        │
│  │  Port: 5000      │   │  (or Atlas)      │        │
│  └──────────────────┘   └──────────────────┘        │
└─────────────────────────────────────────────────────┘
Browser → https://your-domain.com
```

---

## 3. Component Design

### 3.1 Component List

| Component | Responsibility | Technology / Notes |
|-----------|---------------|-------------------|
| **AuthModule** | User registration, login, logout, JWT issuance, profile update, password change, GDPR data export, account deletion | `authRoutes.ts`, `authController.ts`, `authService.ts`, `User` model |
| **PostModule** | Post CRUD operations, lifecycle state transitions (draft→active→expired), interest tracking, publication | `postRoutes.ts`, `postController.ts`, `postService.ts`, `Post` model |
| **MatchingModule** | AI-powered expertise scoring via Google Gemini API, session-caching of results, keyword fallback matching | `frontend/lib/gemini.ts`, `frontend/utils/matchPosts.ts` |
| **MeetingModule** | Meeting request creation, status transitions (pending→confirmed→completed), time slot proposal and confirmation, NDA tracking | `meetingRoutes.ts`, `meetingController.ts`, `meetingService.ts`, `Meeting` model |
| **NotificationModule** | In-app notification creation (synchronous push during request), delivery to users, read/unread management, deletion | `notificationRoutes.ts`, `notificationController.ts`, `notificationService.ts`, `Notification` model |
| **AuditModule** | Structured logging of all significant user actions to audit trail, log querying with filters, CSV export | `logRoutes.ts`, `logController.ts`, `logService.ts`, `Log` model, `logActions.ts` constants |
| **AdminModule** | User management UI (search, suspend, view), post moderation, audit log access, CSV export download | Admin-only routes under `/api/logs` and `/api/auth/users`; `adminOnly` middleware |
| **SecurityModule** | JWT verification (`protect` middleware), role-based access control (`adminOnly`), rate limiting, CORS, Helmet headers, NoSQL sanitization | `authMiddleware.ts`, `rateLimiter.ts`, `app.ts` middleware chain |

### 3.2 Component Interaction Diagram

```
Browser (React SPA)
       │
       │ HTTPS + JWT Bearer Token
       ▼
┌──────────────────────────────────────────────────────┐
│                  SecurityModule                       │
│  Helmet → CORS → JSON parser → MongoSanitize         │
│  → protect (JWT verify) → adminOnly (role check)     │
└──────────┬───────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │              Express Router                  │
    │  /api/auth  /api/posts  /api/meetings        │
    │  /api/notifications  /api/logs               │
    └──────┬──────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │            Controller Layer                  │
    │  Parses request params, body, query          │
    │  Calls appropriate Service method            │
    └──────┬──────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │             Service Layer                    │
    │  Business logic, state transitions,          │
    │  ownership checks, validation                │
    │       │              │                       │
    │  ─────▼─────    ─────▼─────                 │
    │  AuditModule  NotificationModule             │
    │  (logService) (notifService)                 │
    └──────┬──────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │           Mongoose Models                    │
    │  User  Post  Meeting  Notification  Log      │
    └──────┬──────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │              MongoDB 7                       │
    └─────────────────────────────────────────────┘

Frontend-only:
    MatchingModule (gemini.ts + matchPosts.ts)
       │
       ▼ Direct HTTPS call
    Google Gemini API
```

---

## 4. Database Design

### 4.1 ER Diagram

> See Appendix A for the full visual ER Diagram.

**Summary of Relationships:**

```
User ──< Post           (one User authors many Posts)
User ──< Meeting        (one User makes many Meeting requests)
User ──< Meeting        (one User owns many Meetings as post author)
Post ──< Meeting        (one Post has many Meeting requests)
User ──< Notification   (one User receives many Notifications)
User ──< Log            (one User generates many audit Log entries)
```

### 4.2 Table Definitions

#### 4.2.1 users

| Field Name | Data Type | Required | Constraint | Description |
|-----------|-----------|----------|------------|-------------|
| _id | ObjectId | Yes | PK, auto-generated | Unique MongoDB identifier |
| name | String | Yes | trimmed | User's full name |
| email | String | Yes | unique, lowercase | User email address |
| password | String | Yes | — | bcrypt-hashed password (10 salt rounds) |
| role | String (enum) | Yes | engineer \| healthcare_professional \| admin | User role |
| institution | String | Yes | — | University or hospital name |
| city | String | Yes | — | City of user's institution |
| country | String | Yes | — | Country of user's institution |
| bio | String | No | — | Optional user biography |
| avatarUrl | String | No | — | Profile image URL |
| expertiseTags | [String] | No | — | Array of expertise keywords for AI matching |
| isVerified | Boolean | No | default: false | Email verification status |
| isSuspended | Boolean | No | default: false | Account suspension flag (set by admin) |
| lastActive | Date | No | — | Timestamp of last login |
| createdAt | Date | Auto | — | Document creation timestamp |
| updatedAt | Date | Auto | — | Last modification timestamp |

**Indexes:** email (unique)

---

#### 4.2.2 posts

| Field Name | Data Type | Required | Constraint | Description |
|-----------|-----------|----------|------------|-------------|
| _id | ObjectId | Yes | PK, auto-generated | Unique MongoDB identifier |
| title | String | Yes | — | Post title |
| authorId | ObjectId | Yes | FK → users | Reference to the post author |
| authorName | String | Yes | — | Denormalized author name (for display without join) |
| authorRole | String (enum) | Yes | engineer \| healthcare_professional | Denormalized author role |
| domain | String | Yes | — | Medical domain (e.g., cardiology, radiology) |
| expertiseRequired | String | Yes | — | Description of required technical expertise |
| description | String | Yes | — | Full project description |
| projectStage | String (enum) | Yes | idea \| concept_validation \| prototype \| pilot \| pre_deployment | Current project maturity stage |
| collaborationType | String (enum) | Yes | advisor \| co_founder \| research_partner \| contract | Type of collaboration sought |
| confidentiality | String (enum) | Yes | public_pitch \| meeting_only | Visibility level of post content |
| city | String | Yes | — | Project location city |
| country | String | Yes | — | Project location country |
| expiryDate | Date | Yes | — | Date after which post automatically expires |
| status | String (enum) | Yes | draft \| active \| meeting_scheduled \| partner_found \| expired | Post lifecycle state |
| interestCount | Number | No | default: 0 | Number of interest expressions received |
| meetingCount | Number | No | default: 0 | Number of meeting requests received |
| createdAt | Date | Auto | — | Document creation timestamp |
| updatedAt | Date | Auto | — | Last modification timestamp |

**Indexes:** authorId, status, domain, (country + city), fulltext(title, description, expertiseRequired)

---

#### 4.2.3 meetings

| Field Name | Data Type | Required | Constraint | Description |
|-----------|-----------|----------|------------|-------------|
| _id | ObjectId | Yes | PK, auto-generated | Unique MongoDB identifier |
| postId | ObjectId | Yes | FK → posts | Related post |
| postTitle | String | Yes | — | Denormalized post title |
| requesterId | ObjectId | Yes | FK → users | User who initiated the meeting request |
| requesterName | String | Yes | — | Denormalized requester name |
| requesterEmail | String | Yes | — | Denormalized requester email |
| ownerId | ObjectId | Yes | FK → users | Post author (meeting target) |
| ownerName | String | Yes | — | Denormalized owner name |
| ownerEmail | String | Yes | — | Denormalized owner email |
| status | String (enum) | Yes | pending \| time_proposed \| confirmed \| completed \| declined \| cancelled | Meeting lifecycle state |
| message | String | Yes | — | Requester's initial message |
| ndaAccepted | Boolean | Yes | — | Whether the requester accepted the NDA |
| proposedSlots | [Object] | No | [{date: String, time: String}] | Up to 3 time slots proposed by requester |
| confirmedSlot | Object | No | {date: String, time: String} | The slot confirmed by the post owner |
| createdAt | Date | Auto | — | Document creation timestamp |
| updatedAt | Date | Auto | — | Last modification timestamp |

**Indexes:** postId, requesterId, ownerId, status

---

#### 4.2.4 activity_logs

| Field Name | Data Type | Required | Constraint | Description |
|-----------|-----------|----------|------------|-------------|
| _id | ObjectId | Yes | PK, auto-generated | Unique MongoDB identifier |
| timestamp | Date | Yes | default: now | Exact time the action occurred |
| userId | ObjectId | No | FK → users | User who performed the action (null for anonymous) |
| userEmail | String | Yes | lowercase | Email at time of action |
| role | String | Yes | — | User role at time of action |
| action | String | Yes | from logActions enum | Standardized action code (e.g., USER_LOGIN_SUCCESS, POST_CREATE) |
| targetEntityId | String | No | — | ID of the resource affected (post ID, meeting ID, etc.) |
| result | String (enum) | Yes | success \| failure | Outcome of the action |
| ipAddress | String | No | — | IP address of the requester |
| createdAt | Date | Auto | — | Document creation timestamp |
| updatedAt | Date | Auto | — | Last modification timestamp |

**Indexes:** userId, timestamp (descending), action, result

**Sample action codes (40+ total):**
`USER_REGISTERED`, `USER_LOGIN_SUCCESS`, `USER_LOGIN_FAILURE`, `USER_LOGOUT`, `POST_CREATE`, `POST_PUBLISH`, `POST_UPDATE`, `POST_DELETE`, `POST_PARTNER_FOUND`, `MEETING_REQUEST`, `MEETING_ACCEPT`, `MEETING_DECLINE`, `MEETING_CANCEL`, `SUSPENSION_APPLIED`, `SUSPENSION_REMOVED`, `ACCOUNT_DELETED`, `DATA_EXPORT`

---

#### 4.2.5 notifications

| Field Name | Data Type | Required | Constraint | Description |
|-----------|-----------|----------|------------|-------------|
| _id | ObjectId | Yes | PK, auto-generated | Unique MongoDB identifier |
| userId | ObjectId | Yes | FK → users | Notification recipient |
| type | String (enum) | Yes | meeting_request \| meeting_accepted \| meeting_declined \| meeting_cancelled \| meeting_completed \| post_closed \| post_status_changed \| partner_found \| interest_received \| account_activity | Notification category |
| title | String | Yes | — | Short notification headline |
| body | String | Yes | — | Full notification message |
| isRead | Boolean | No | default: false | Whether the user has read this notification |
| linkTo | String | No | — | Frontend route to navigate to on click |
| createdAt | Date | Auto | — | Document creation timestamp |
| updatedAt | Date | Auto | — | Last modification timestamp |

**Indexes:** (userId + isRead)

---

## 5. API Design

**Base URL:** `/api`  
**Auth:** All protected routes require `Authorization: Bearer <JWT>` header.  
**Response envelope:** `{ success: true, data: {...} }` (success) / `{ success: false, message: "..." }` (error)

### 5.1 Authentication (Auth)

| Method | Endpoint | Description | Auth | SRS Ref. |
|--------|----------|-------------|------|---------|
| POST | `/api/auth/register` | Register a new user (name, email, password, role, institution, city, country) | Public | FR-01, FR-03, FR-04 |
| POST | `/api/auth/login` | Authenticate user, return JWT token | Public | FR-06 |
| POST | `/api/auth/logout` | Invalidate session (client clears token) | Authenticated | — |
| GET | `/api/auth/me` | Get current authenticated user's profile | Authenticated | — |
| PUT | `/api/auth/me/profile` | Update profile fields (bio, expertiseTags, institution, city, country, avatarUrl) | Authenticated | FR-09 |
| PUT | `/api/auth/me/password` | Change password (requires current password) | Authenticated | FR-05 |
| GET | `/api/auth/me/export` | Export all user data as JSON (GDPR) | Authenticated | NFR-05, NFR-06 |
| DELETE | `/api/auth/me` | Permanently delete account and associated content (GDPR) | Authenticated | NFR-07 |
| GET | `/api/auth/users` | List all users (admin: search, filter by role/suspension) | Admin | FR-40 |
| PATCH | `/api/auth/users/:id/suspend` | Suspend or unsuspend a user account | Admin | FR-42 |

### 5.2 Post Management (Posts)

| Method | Endpoint | Description | Auth | SRS Ref. |
|--------|----------|-------------|------|---------|
| GET | `/api/posts` | List posts with optional filters (status, domain, country, city, keyword) | Public/Auth | FR-20, FR-21 |
| POST | `/api/posts` | Create a new post (saved as Draft) | Authenticated | FR-10, FR-11 |
| GET | `/api/posts/:id` | Get full details of a specific post | Authenticated | — |
| PUT | `/api/posts/:id` | Update a post's fields (author only) | Post author | FR-13 |
| DELETE | `/api/posts/:id` | Delete a post (author or admin) | Post author / Admin | FR-14 |
| POST | `/api/posts/:id/publish` | Publish a draft post → status: active | Post author | FR-12 |
| POST | `/api/posts/:id/partner-found` | Mark post as Partner Found → status: partner_found | Post author | FR-16 |
| POST | `/api/posts/:id/interest` | Express interest in a post (increments interestCount) | Authenticated | FR-18 |

### 5.3 Meeting Requests (Meetings)

| Method | Endpoint | Description | Auth | SRS Ref. |
|--------|----------|-------------|------|---------|
| GET | `/api/meetings` | List all meetings for the current user (both as requester and owner) | Authenticated | — |
| POST | `/api/meetings` | Create a meeting request (message + ndaAccepted + proposedSlots) | Authenticated | FR-30 |
| GET | `/api/meetings/:id` | Get full details of a specific meeting | Authenticated | — |
| POST | `/api/meetings/:id/accept` | Accept a meeting request + confirm a time slot | Post owner | FR-31, FR-32 |
| POST | `/api/meetings/:id/decline` | Decline a meeting request | Post owner | FR-31 |
| POST | `/api/meetings/:id/cancel` | Cancel a confirmed or pending meeting | Either party | FR-33 |

### 5.4 Notifications

| Method | Endpoint | Description | Auth | SRS Ref. |
|--------|----------|-------------|------|---------|
| GET | `/api/notifications` | List all notifications for the current user | Authenticated | FR-34 |
| GET | `/api/notifications/unread-count` | Get count of unread notifications | Authenticated | — |
| PATCH | `/api/notifications/:id/read` | Mark a specific notification as read | Authenticated | — |
| PATCH | `/api/notifications/mark-all-read` | Mark all notifications as read | Authenticated | — |
| DELETE | `/api/notifications/:id` | Delete a specific notification | Authenticated | — |
| DELETE | `/api/notifications` | Delete all notifications for current user | Authenticated | — |

### 5.5 Admin / Audit Logs

| Method | Endpoint | Description | Auth | SRS Ref. |
|--------|----------|-------------|------|---------|
| GET | `/api/logs` | Get audit log entries with filters (user, action, result, dateRange) and CSV export | Admin | FR-43, FR-44 |

### 5.6 Health Check

| Method | Endpoint | Description | Auth | SRS Ref. |
|--------|----------|-------------|------|---------|
| GET | `/api/health` | Server health check (returns status + uptime) | Public | — |

---

## 6. UI Design

### 6.1 Screen List and Navigation

| Screen | Description | Access |
|--------|-------------|--------|
| **Landing Page** (`/`) | Marketing homepage: hero section, platform features, partner logos, call-to-action buttons (Register / Learn More) | Public |
| **Login** (`/login`) | Email + password form; redirects to Dashboard on success | Public |
| **Register** (`/register`) | 3-step wizard: Step 1 – name/email/password, Step 2 – role/institution/city/country, Step 3 – bio/expertise tags | Public |
| **Verify Email** (`/verify-email`) | Email verification confirmation screen | Public |
| **Dashboard** (`/dashboard`) | Active post feed, top AI-matched posts, quick navigation cards | Authenticated |
| **Post List** (`/posts`) | Searchable + filterable post grid, Featured Match section at top (AI-ranked) | Authenticated |
| **Post Detail** (`/posts/:id`) | Full post information, author info, interest button, "Request Meeting" modal trigger | Authenticated |
| **Post Create** (`/posts/new`) | Multi-field creation form (title, domain, stage, expertise, description, location, expiry) | Authenticated |
| **Post Edit** (`/posts/:id/edit`) | Pre-filled form to edit an existing post | Post author |
| **Meetings** (`/meetings`) | Tabbed view: All / Incoming / Outgoing / Confirmed; meeting cards with action buttons (Accept, Decline, Cancel) | Authenticated |
| **Profile** (`/profile`) | Edit profile form, change password section, "Export My Data" button, "Delete Account" button | Authenticated |
| **Notifications** (`/notifications`) | Chronological notification list with read/unread indicators, mark-all-read, delete | Authenticated |
| **Admin Panel** (`/admin`) | Tabbed: Users (search + suspend), Posts (view + filter), Audit Logs (filter + CSV export) | Admin only |
| **Privacy Policy** (`/privacy`) | Full GDPR-compliant privacy policy | Public |
| **404** (`/404`) | Page not found error page | All |
| **403** (`/403`) | Unauthorized access error page | All |

**Navigation Flow Diagram:**

```
[Landing] ──► [Login] ──► [Dashboard] ──► [Post List] ──► [Post Detail] ──► [Meeting Request Modal]
    └──────► [Register]        │               │
                               │               └──► [Post Create]
                               │               └──► [Post Edit]
                               ├──────────────► [Meetings]
                               ├──────────────► [Notifications]
                               ├──────────────► [Profile]
                               └──────────────► [Admin Panel]  (admin role only)
```

Protected routes redirect unauthenticated users to `/login`. Admin routes redirect non-admin users to `/403`.

### 6.2 Wireframes / Mockups

> See Appendix B for wireframes of the following screens:
> - Registration Page (3-step wizard)
> - Dashboard (Post List with Featured Match section)
> - Post Detail + Meeting Request Modal
> - Admin Panel (Users tab)

---

## 7. Security Design

| Security Requirement | Design Decision | SRS Ref. |
|--------------------|-----------------|---------|
| **Authentication** | JWT-based. Token issued on login (7-day expiry by default, configurable via `JWT_EXPIRES_IN`). Stored in localStorage on the client. Attached to every API request via Axios interceptor: `Authorization: Bearer <token>`. On 401 response, Axios interceptor redirects to `/login`. | FR-06, NFR |
| **Password Storage** | bcryptjs with 10 salt rounds. Passwords are hashed before saving to MongoDB. Plaintext passwords are never logged or returned in API responses. | FR-05, NFR-03 |
| **Authorization (RBAC)** | `protect` middleware verifies JWT signature and expiry, then attaches the user object to `req.user`. `adminOnly` middleware checks `req.user.role === 'admin'`. Service layer enforces resource-level ownership (e.g., only the post author may publish or delete their post). | FR-03, FR-08 |
| **Session Management** | JWT expiry enforced server-side. Frontend `SessionTimeoutModal` component tracks inactivity (30 min) and shows a 5-minute countdown warning before auto-logout. | NFR-14 |
| **GDPR Compliance** | Data export endpoint (`GET /api/auth/me/export`) collects and returns all user data as JSON. Account deletion (`DELETE /api/auth/me`) removes the user document and all associated posts and meetings. Audit logs are intentionally retained. Cookie consent banner shown on first visit. Privacy Policy page at `/privacy`. | NFR-05, NFR-06, NFR-07 |
| **Rate Limiting** | `express-rate-limit` configured on all `/api/auth` routes: max 15 requests per 15 minutes per IP. Returns HTTP 429 when exceeded. | NFR-04 |
| **HTTP Security Headers** | `Helmet` middleware sets: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (HSTS in production). | NFR-11 |
| **Input Sanitization** | `express-mongo-sanitize` strips `$` and `.` characters from request body, query, and params to prevent NoSQL injection attacks. | NFR-12 |
| **CORS** | CORS configured with explicit origin allowlist: `http://localhost:5173` (dev), `http://localhost:4173` (preview), and `CLIENT_ORIGIN` env var (production). `credentials: true` to allow cookies/auth headers. | NFR-09 |
| **HTTPS in Production** | Nginx configured to serve the frontend over TLS (HTTPS). All API traffic between browser and Nginx is encrypted. | NFR-10 |
| **Suspended User Handling** | `isSuspended` flag checked on every authenticated request inside `protect` middleware. Suspended users receive HTTP 403 immediately, even if their JWT is still valid. | FR-08 |

---

## 8. State Diagrams

### 8.1 Post Lifecycle

**Visual State Diagram:**

```
              ┌─────────┐
              │  DRAFT  │
              └────┬────┘
                   │ User clicks "Publish"
                   ▼
              ┌─────────┐
         ┌───►│  ACTIVE │◄────────────────────────────┐
         │    └────┬────┘                             │
         │         │                    \             │
         │    Meeting    expiryDate      Meeting      │
         │    Request    reached         Cancelled    │
         │    Accepted      │            or Declined  │
         │         │         ▼                        │
         │         │    ┌─────────┐                   │
         │         │    │ EXPIRED │                   │
         │         │    └─────────┘                   │
         │         ▼                                   │
         │  ┌─────────────────────┐                   │
         └──│  MEETING_SCHEDULED  │───────────────────┘
            └──────────┬──────────┘
                       │
                       │ Owner marks "Partner Found"
                       │ or expiryDate reached
                       ▼
            ┌──────────────────┐    ┌─────────┐
            │  PARTNER_FOUND   │    │ EXPIRED │
            └──────────────────┘    └─────────┘
```

**Transition Table:**

| From State | Trigger Event | To State |
|-----------|--------------|----------|
| (new) | Author saves the form | Draft |
| Draft | Author clicks "Publish" | Active |
| Active | A meeting request is accepted by the post owner | Meeting Scheduled |
| Active | `expiryDate` is reached | Expired |
| Meeting Scheduled | Post owner clicks "Partner Found" | Partner Found |
| Meeting Scheduled | The active meeting is cancelled or declined | Active |
| Meeting Scheduled | `expiryDate` is reached | Expired |

### 8.2 Meeting Request Lifecycle

**Visual State Diagram:**

```
           ┌─────────┐
           │ PENDING │
           └────┬────┘
                │
      ┌─────────┴────────────┐
      │                      │
  Owner                  Owner
  accepts               declines
      │                      │
      ▼                      ▼
┌─────────────┐        ┌──────────┐
│ TIME_PROPOSED│        │ DECLINED │
└──────┬───────┘        └──────────┘
       │
       │ Owner confirms a time slot
       ▼
┌─────────────┐
│  CONFIRMED  │
└──────┬──────┘
       │
   ┌───┴─────────────────┐
   │                     │
Either party          Meeting date
cancels               passes
   │                     │
   ▼                     ▼
┌──────────┐       ┌───────────┐
│CANCELLED │       │ COMPLETED │
└──────────┘       └───────────┘
```

**Transition Table:**

| From State | Trigger Event | To State |
|-----------|--------------|----------|
| (new) | Requester submits a meeting request | Pending |
| Pending | Post owner clicks "Accept" | Time Proposed |
| Pending | Post owner clicks "Decline" | Declined |
| Pending | Requester cancels before decision | Cancelled |
| Time Proposed | Post owner confirms a time slot | Confirmed |
| Confirmed | Either party cancels the meeting | Cancelled |
| Confirmed | The confirmed meeting date/time passes | Completed |

---

## 9. SRS–SDD Traceability Matrix

| SRS Ref. | Requirement Summary | SDD Component | SDD Section |
|---------|---------------------|--------------|-------------|
| FR-01 | User registration with email | AuthModule | 3.1, 5.1 |
| FR-02 | Email verification | AuthModule + Nodemailer | 3.1, 5.1 |
| FR-03 | Role selection on registration | AuthModule | 3.1, 5.1, 7 |
| FR-04 | Institution/city/country required | AuthModule | 3.1, 5.1 |
| FR-05 | Password hashing (bcrypt 10 rounds) | SecurityModule | 3.1, 7 |
| FR-06 | JWT issuance on login | AuthModule, SecurityModule | 3.1, 5.1, 7 |
| FR-07 | 30-minute session timeout | Frontend SessionTimeoutModal | 6.1, 7 |
| FR-08 | Admin user suspension | AdminModule, SecurityModule | 3.1, 5.1, 7 |
| FR-09 | Profile update | AuthModule | 3.1, 5.1 |
| FR-10 | Post creation with required fields | PostModule | 3.1, 5.2 |
| FR-11 | Draft status on creation | PostModule | 3.1, 5.2, 8.1 |
| FR-12 | Publish post (draft → active) | PostModule | 3.1, 5.2, 8.1 |
| FR-13 | Post editing by author | PostModule | 3.1, 5.2 |
| FR-14 | Post deletion | PostModule | 3.1, 5.2 |
| FR-15 | Automatic post expiry | PostModule | 3.1, 5.2, 8.1 |
| FR-16 | Partner found status | PostModule | 3.1, 5.2, 8.1 |
| FR-17 | Post → Meeting Scheduled status | MeetingModule + PostModule | 3.1, 5.2, 5.3, 8.1 |
| FR-18 | Express interest in post | PostModule | 3.1, 5.2 |
| FR-19 | Interest/meeting count tracking | PostModule (Post model) | 4.2.2 |
| FR-20 | Keyword search | PostModule | 3.1, 4.2.2, 5.2 |
| FR-21 | Filter posts by domain/city/etc. | PostModule | 3.1, 5.2 |
| FR-22 | AI-powered matching (Gemini) | MatchingModule | 3.1 |
| FR-23 | Keyword fallback matching | MatchingModule | 3.1 |
| FR-24 | Featured match display | MatchingModule, Frontend | 3.1, 6.1 |
| FR-30 | Send meeting request (message + NDA + slots) | MeetingModule | 3.1, 5.3 |
| FR-31 | Accept/decline meeting | MeetingModule | 3.1, 5.3, 8.2 |
| FR-32 | Confirm time slot | MeetingModule | 3.1, 5.3, 8.2 |
| FR-33 | Cancel meeting | MeetingModule | 3.1, 5.3, 8.2 |
| FR-34 | In-app notifications for meeting events | NotificationModule | 3.1, 5.4 |
| FR-35 | No duplicate meeting requests | MeetingModule (service validation) | 3.1 |
| FR-40 | Admin view/search users | AdminModule | 3.1, 5.1 |
| FR-41 | Admin view/filter posts | AdminModule, PostModule | 3.1, 5.2 |
| FR-42 | Admin suspend/unsuspend | AdminModule, SecurityModule | 3.1, 5.1, 7 |
| FR-43 | Admin audit log with filters | AuditModule | 3.1, 5.5 |
| FR-44 | Admin CSV export | AuditModule | 3.1, 5.5 |
| FR-45 | Profile completeness % | AdminModule (frontend computed) | 6.1 |
| FR-50 | Log all significant actions | AuditModule (logService) | 3.1, 4.2.4 |
| FR-51 | Log entry field structure | AuditModule (Log model) | 4.2.4 |
| FR-52 | Indefinite log retention | AuditModule + Database design | 4.2.4 |
| FR-53 | Log filtering support | AuditModule | 3.1, 5.5 |
| NFR-03 | bcrypt 10 salt rounds | SecurityModule | 7 |
| NFR-04 | Rate limiting on /api/auth | SecurityModule (rateLimiter.ts) | 7 |
| NFR-05 | GDPR compliance | AuthModule | 5.1, 7 |
| NFR-06 | JSON data export | AuthModule | 5.1, 7 |
| NFR-07 | Account deletion | AuthModule | 5.1, 7 |
| NFR-09 | CORS allowlist | SecurityModule | 7 |
| NFR-10 | HTTPS in production | Nginx deployment | 2.3, 7 |
| NFR-11 | Helmet security headers | SecurityModule | 7 |
| NFR-12 | NoSQL injection prevention | SecurityModule (mongo-sanitize) | 7 |
| NFR-14 | Session timeout + warning modal | Frontend, SecurityModule | 6.1, 7 |
| NFR-15 | Docker Compose deployment | Deployment design | 2.3 |

---

## 10. Appendices

- **Appendix A:** ER Diagram (visual)
- **Appendix B:** UI Wireframes — Registration (3-step), Post List + Featured Match, Post Detail + Meeting Modal, Admin Panel
- **Appendix C:** Post Lifecycle State Diagram (visual)
- **Appendix D:** Meeting Request Lifecycle State Diagram (visual)
