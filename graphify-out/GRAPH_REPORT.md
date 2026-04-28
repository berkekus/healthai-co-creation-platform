# Graph Report - healthai-co-creation-platform  (2026-04-28)

## Corpus Check
- 92 files · ~153,714 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 329 nodes · 304 edges · 31 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
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
3. `Frontend (React 18 / TypeScript / Vite 6)` - 17 edges
4. `Backend (Node.js / Express 4 / TypeScript / Mongoose 8)` - 16 edges
5. `Frontend README` - 9 edges
6. `withEmails()` - 8 edges
7. `pushNotification()` - 8 edges
8. `makeError()` - 7 edges
9. `Engineer Portrait Subject` - 7 edges
10. `log()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `matchPosts utility (smart matching)` --semantically_similar_to--> `matchPosts (match reasoning + ranking utility)`  [INFERRED] [semantically similar]
  README.md → frontend/README.md
- `connectDB()` --calls--> `log()`  [INFERRED]
  backend\config\db.ts → backend\controllers\postController.ts
- `JWT Authentication (Bearer token, 7-day expiry)` --conceptually_related_to--> `SessionTimeoutModal (30-min countdown)`  [INFERRED]
  README.md → frontend/README.md
- `log()` --calls--> `createLog()`  [INFERRED]
  backend\controllers\meetingController.ts → backend\services\logService.ts
- `log()` --calls--> `createLog()`  [INFERRED]
  backend\controllers\postController.ts → backend\services\logService.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (40): authController, authMiddleware, authService, Backend (Node.js / Express 4 / TypeScript / Mongoose 8), errorHandler (middleware), meetingController, meetingService, Log Model (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (21): acceptMeeting(), cancelMeeting(), completeMeeting(), declineMeeting(), getMeetingById(), getMeetingsByPost(), getMeetingsByUser(), makeError() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (21): Frontend README, matchPosts (match reasoning + ranking utility), PrivacyPage (/privacy), Reduced Motion Support (prefers-reduced-motion), Role Guards (AppRouter.tsx), SessionTimeoutModal (30-min countdown), WCAG AA Color Compliance, Zustand + localStorage Persistence (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (19): Admin Panel (user suspension, post moderation, activity log), Auth API Routes (/api/auth/*), Logs API Routes (/api/logs) — admin only, Meetings API Routes (/api/meetings/*), Notifications API Routes (/api/notifications/*), Posts API Routes (/api/posts/*), bcrypt (≥10 rounds), Docker Compose (dev + prod) (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (9): connectDB(), log(), log(), fail(), ok(), run(), step(), unique() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (8): onSubmit(), getUserById(), loginUser(), registerUser(), sanitize(), setSuspended(), signToken(), updateUserProfile()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (2): handleClick(), markRead()

### Community 7 - "Community 7"
Cohesion: 0.28
Nodes (3): handleNext(), handleSubmit(), validateStep()

### Community 8 - "Community 8"
Cohesion: 0.28
Nodes (9): Casual Dark Sweater, Engineer Role, Eyeglasses, Professional Headshot Photo, HealthAI Co-Creation Platform, Neutral Green-Beige Gradient Background, Engineer Portrait Subject, Professional Male (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (2): handleAccept(), accept()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (3): postDetail(), onSubmit(), onSubmit()

### Community 11 - "Community 11"
Cohesion: 0.43
Nodes (4): analyzeProjectMatch(), getGenAI(), getSmartSuggestions(), parseAIResponse()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (2): onSubmit(), startCooldown()

### Community 16 - "Community 16"
Cohesion: 0.6
Nodes (3): computeEnhancedMatchReasons(), computeMatchReasons(), getCombinedMatchScore()

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (5): Clinician (Doctor), HealthAI Co-Creation Platform, Clinician Portrait Image, Stethoscope, White Lab Coat

### Community 18 - "Community 18"
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
- **70 isolated node(s):** `MongoDB (Atlas / mongo:7)`, `bcrypt (≥10 rounds)`, `Helmet (HTTP security headers)`, `express-mongo-sanitize`, `express-rate-limit` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (9 nodes): `notificationService.ts`, `NotificationsPage.tsx`, `handleClick()`, `deleteAllNotifications()`, `deleteNotification()`, `getNotificationsByUser()`, `getUnreadCount()`, `markAllRead()`, `markRead()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (7 nodes): `MeetingCard.tsx`, `CookieConsentBanner.tsx`, `formatSlot()`, `handleAccept()`, `handleCancel()`, `handleDecline()`, `accept()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (5 nodes): `onInputBlur()`, `onInputFocus()`, `onSubmit()`, `startCooldown()`, `LoginPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (4 nodes): `helpers.ts`, `createPost()`, `createUser()`, `uniqueEmail()`
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

- **Why does `HEALTH AI Co-Creation Platform` connect `Community 3` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Backend Integration Roadmap (ROADMAP.md)` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Frontend (React 18 / TypeScript / Vite 6)` connect `Community 2` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `MongoDB (Atlas / mongo:7)`, `bcrypt (≥10 rounds)`, `Helmet (HTTP security headers)` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._