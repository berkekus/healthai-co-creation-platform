# Graph Report - .  (2026-04-28)

## Corpus Check
- 97 files · ~150,968 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 323 nodes · 285 edges · 31 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Auth & API Layer|Backend Auth & API Layer]]
- [[_COMMUNITY_Frontend Architecture & Docs|Frontend Architecture & Docs]]
- [[_COMMUNITY_Meeting & Post Services|Meeting & Post Services]]
- [[_COMMUNITY_API Routes & Platform Features|API Routes & Platform Features]]
- [[_COMMUNITY_Auth UI & Registration|Auth UI & Registration]]
- [[_COMMUNITY_Backend Controllers & Config|Backend Controllers & Config]]
- [[_COMMUNITY_Meeting Interest Flow|Meeting Interest Flow]]
- [[_COMMUNITY_Notification System|Notification System]]
- [[_COMMUNITY_Engineer Persona Assets|Engineer Persona Assets]]
- [[_COMMUNITY_Meeting UI Components|Meeting UI Components]]
- [[_COMMUNITY_Post Routes & Pages|Post Routes & Pages]]
- [[_COMMUNITY_AI Match Integration|AI Match Integration]]
- [[_COMMUNITY_Login UI|Login UI]]
- [[_COMMUNITY_Post Matching Logic|Post Matching Logic]]
- [[_COMMUNITY_Clinician Persona Assets|Clinician Persona Assets]]
- [[_COMMUNITY_Test Utilities|Test Utilities]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]

## God Nodes (most connected - your core abstractions)
1. `HEALTH AI Co-Creation Platform` - 22 edges
2. `Backend Integration Roadmap (ROADMAP.md)` - 20 edges
3. `Frontend (React 18 / TypeScript / Vite 6)` - 18 edges
4. `Backend (Node.js / Express 4 / TypeScript / Mongoose 8)` - 16 edges
5. `Frontend README` - 9 edges
6. `pushNotification()` - 7 edges
7. `makeError()` - 7 edges
8. `Engineer Portrait Subject` - 7 edges
9. `sanitize()` - 6 edges
10. `resolveUpdateFailure()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `matchPosts (match reasoning + ranking utility)` --semantically_similar_to--> `matchPosts utility (smart matching)`  [INFERRED] [semantically similar]
  frontend/README.md → README.md
- `SessionTimeoutModal (30-min countdown)` --conceptually_related_to--> `JWT Authentication (Bearer token, 7-day expiry)`  [INFERRED]
  frontend/README.md → README.md
- `connectDB()` --calls--> `log()`  [INFERRED]
  backend\config\db.ts → backend\controllers\postController.ts
- `log()` --calls--> `createLog()`  [INFERRED]
  backend\controllers\meetingController.ts → backend\services\logService.ts
- `log()` --calls--> `createLog()`  [INFERRED]
  backend\controllers\postController.ts → backend\services\logService.ts

## Communities

### Community 0 - "Backend Auth & API Layer"
Cohesion: 0.06
Nodes (40): authController, authMiddleware, authService, Backend (Node.js / Express 4 / TypeScript / Mongoose 8), errorHandler (middleware), meetingController, meetingService, Log Model (+32 more)

### Community 1 - "Frontend Architecture & Docs"
Cohesion: 0.11
Nodes (24): Frontend README, matchPosts (match reasoning + ranking utility), PrivacyPage (/privacy), Reduced Motion Support (prefers-reduced-motion), Role Guards (AppRouter.tsx), SessionTimeoutModal (30-min countdown), WCAG AA Color Compliance, Zustand + localStorage Persistence (+16 more)

### Community 2 - "Meeting & Post Services"
Cohesion: 0.17
Nodes (17): acceptMeeting(), cancelMeeting(), declineMeeting(), getMeetingById(), makeError(), requestMeeting(), resolveUpdateFailure(), pushNotification() (+9 more)

### Community 3 - "API Routes & Platform Features"
Cohesion: 0.11
Nodes (19): Admin Panel (user suspension, post moderation, activity log), Auth API Routes (/api/auth/*), Logs API Routes (/api/logs) — admin only, Meetings API Routes (/api/meetings/*), Notifications API Routes (/api/notifications/*), Posts API Routes (/api/posts/*), bcrypt (≥10 rounds), Docker Compose (dev + prod) (+11 more)

### Community 4 - "Auth UI & Registration"
Cohesion: 0.22
Nodes (8): onSubmit(), getUserById(), loginUser(), registerUser(), sanitize(), setSuspended(), signToken(), updateUserProfile()

### Community 5 - "Backend Controllers & Config"
Cohesion: 0.22
Nodes (4): connectDB(), log(), log(), createLog()

### Community 6 - "Meeting Interest Flow"
Cohesion: 0.28
Nodes (3): handleNext(), handleSubmit(), validateStep()

### Community 7 - "Notification System"
Cohesion: 0.22
Nodes (2): handleClick(), markRead()

### Community 8 - "Engineer Persona Assets"
Cohesion: 0.28
Nodes (9): Casual Dark Sweater, Engineer Role, Eyeglasses, Professional Headshot Photo, HealthAI Co-Creation Platform, Neutral Green-Beige Gradient Background, Engineer Portrait Subject, Professional Male (+1 more)

### Community 9 - "Meeting UI Components"
Cohesion: 0.29
Nodes (2): handleAccept(), accept()

### Community 10 - "Post Routes & Pages"
Cohesion: 0.29
Nodes (3): postDetail(), onSubmit(), onSubmit()

### Community 11 - "AI Match Integration"
Cohesion: 0.43
Nodes (4): analyzeProjectMatch(), getGenAI(), getSmartSuggestions(), parseAIResponse()

### Community 15 - "Login UI"
Cohesion: 0.5
Nodes (2): onSubmit(), startCooldown()

### Community 16 - "Post Matching Logic"
Cohesion: 0.6
Nodes (3): computeEnhancedMatchReasons(), computeMatchReasons(), getCombinedMatchScore()

### Community 17 - "Clinician Persona Assets"
Cohesion: 0.5
Nodes (5): Clinician (Doctor), HealthAI Co-Creation Platform, Clinician Portrait Image, Stethoscope, White Lab Coat

### Community 18 - "Test Utilities"
Cohesion: 0.67
Nodes (2): createUser(), uniqueEmail()

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (1): Bug P0-3: Login/register failure log never written

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (1): Gap P1-7: POST /posts/:id/interest endpoint missing

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): Gap P1-8: Post expiry automation absent

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): Gap P1-9: lastActive only updated on login

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (1): Gap P1-10: Suspended user JWT remains valid

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (1): Gap P1-11: Notification delete/archive endpoint missing

### Community 93 - "Community 93"
Cohesion: 1.0
Nodes (1): Gap P1-12: /notifications/unread-count unused by frontend

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (1): Gap P2-13: listPosts lacks server-side pagination

### Community 95 - "Community 95"
Cohesion: 1.0
Nodes (1): Gap P2-16: Email verification flow is empty (isVerified field unused)

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (1): recomputePostStatus helper (proposed fix for P0-1)

### Community 97 - "Community 97"
Cohesion: 1.0
Nodes (1): backend/constants/logActions.ts (proposed unified action names)

### Community 98 - "Community 98"
Cohesion: 1.0
Nodes (1): Mock Data (mockUsers · mockPosts · mockMeetings · mockLogs)

### Community 99 - "Community 99"
Cohesion: 1.0
Nodes (1): LandingPage.tsx (public marketing page)

### Community 100 - "Community 100"
Cohesion: 1.0
Nodes (1): .planning/roadmap.md (10-phase delivery plan Faz 0-9)

### Community 101 - "Community 101"
Cohesion: 1.0
Nodes (1): .planning/SNAPSHOT.md (per-phase implementation log, latest Faz 9)

## Knowledge Gaps
- **68 isolated node(s):** `MongoDB (Atlas / mongo:7)`, `bcrypt (≥10 rounds)`, `Helmet (HTTP security headers)`, `express-mongo-sanitize`, `express-rate-limit` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Notification System`** (9 nodes): `notificationService.ts`, `NotificationsPage.tsx`, `handleClick()`, `deleteAllNotifications()`, `deleteNotification()`, `getNotificationsByUser()`, `getUnreadCount()`, `markAllRead()`, `markRead()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Meeting UI Components`** (7 nodes): `MeetingCard.tsx`, `CookieConsentBanner.tsx`, `formatSlot()`, `handleAccept()`, `handleCancel()`, `handleDecline()`, `accept()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login UI`** (5 nodes): `onInputBlur()`, `onInputFocus()`, `onSubmit()`, `startCooldown()`, `LoginPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Utilities`** (4 nodes): `helpers.ts`, `createPost()`, `createUser()`, `uniqueEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `Bug P0-3: Login/register failure log never written`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `Gap P1-7: POST /posts/:id/interest endpoint missing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `Gap P1-8: Post expiry automation absent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `Gap P1-9: lastActive only updated on login`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `Gap P1-10: Suspended user JWT remains valid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `Gap P1-11: Notification delete/archive endpoint missing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `Gap P1-12: /notifications/unread-count unused by frontend`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `Gap P2-13: listPosts lacks server-side pagination`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `Gap P2-16: Email verification flow is empty (isVerified field unused)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `recomputePostStatus helper (proposed fix for P0-1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `backend/constants/logActions.ts (proposed unified action names)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `Mock Data (mockUsers · mockPosts · mockMeetings · mockLogs)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `LandingPage.tsx (public marketing page)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (1 nodes): `.planning/roadmap.md (10-phase delivery plan Faz 0-9)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (1 nodes): `.planning/SNAPSHOT.md (per-phase implementation log, latest Faz 9)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HEALTH AI Co-Creation Platform` connect `API Routes & Platform Features` to `Backend Auth & API Layer`, `Frontend Architecture & Docs`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Frontend (React 18 / TypeScript / Vite 6)` connect `Frontend Architecture & Docs` to `Backend Auth & API Layer`, `API Routes & Platform Features`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Backend Integration Roadmap (ROADMAP.md)` connect `Backend Auth & API Layer` to `Frontend Architecture & Docs`, `API Routes & Platform Features`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `MongoDB (Atlas / mongo:7)`, `bcrypt (≥10 rounds)`, `Helmet (HTTP security headers)` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Auth & API Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Frontend Architecture & Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `API Routes & Platform Features` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._