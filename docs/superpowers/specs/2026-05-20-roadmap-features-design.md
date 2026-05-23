# HealthAI Co-Creation Platform — Roadmap Features Design

**Date:** 2026-05-20  
**Branch:** backend  
**Status:** Approved for implementation

---

## Overview

Three tiers of features to differentiate the platform from peer projects. Each tier is independently testable and ends with a git commit. Features are additive — no existing functionality is removed.

---

## Tier 1 — High impact, short implementation

### 1A: AI Profile Completion Score

**What it does:** Gemini analyzes a user's profile fields (name, bio, expertiseTags, institution, city, country, avatarUrl) and returns a 0–100 score plus a list of actionable suggestions (max 3). Shown as a progress ring on the Profile page.

**Architecture:**
- New backend endpoint: `POST /api/ai/profile-score`
- Controller calls `aiProfileScoreService.ts` — builds a structured prompt, calls Gemini, parses JSON response `{ score: number, suggestions: string[] }`
- Frontend: `useProfileScore` hook in `src/lib/gemini.ts`, renders `<ProfileScoreCard>` component on `ProfilePage.tsx`
- Score is re-fetched on profile save; cached in component state (no store needed)
- Fallback: if Gemini unavailable, compute score locally by counting filled fields (each field = 100/7 points)

**Data contract:**
```ts
// Request (authenticated)
POST /api/ai/profile-score
// Response
{ score: number; suggestions: string[]; }
```

---

### 1B: Real-Time Messaging via WebSocket (Socket.io)

**What it does:** Replaces the 8-second polling in `conversationStore` with a persistent Socket.io connection. Messages appear instantly. Online presence indicator per conversation.

**Architecture:**
- Backend: add `socket.io` to the Express server in `src/app.ts`. Auth middleware validates JWT from `auth` handshake query param. Each user joins a room named `user:<userId>`. On new message, emit `new_message` to all participants' rooms.
- New file: `src/socket.ts` — socket server setup, exported and attached in `index.ts`
- Frontend: `src/lib/socket.ts` — singleton Socket.io client, connects on auth, disconnects on logout. `conversationStore` listens for `new_message` events and appends to message list instead of polling.
- Polling fallback: keep the 8s poll as fallback if socket disconnects (already exists, just keep it)
- Typing indicators: out of scope for now

**Packages:** `socket.io` (backend), `socket.io-client` (frontend)

---

### 1C: Post Comments / Q&A

**What it does:** Public discussion thread under each post. Any authenticated user can ask a question or leave a comment. Author can reply. Max 500 chars per comment.

**Architecture:**
- New Mongoose model: `Comment` — `{ postId, authorId, authorName, authorRole, content, parentId?, createdAt }`
- New routes: `GET /api/posts/:id/comments`, `POST /api/posts/:id/comments`, `DELETE /api/comments/:id` (own or admin)
- Frontend: `<CommentsSection>` component rendered at bottom of `PostDetailPage.tsx`
- No separate store — local `useState` + direct API calls via `api.ts`
- Pagination: 20 comments per page, load-more button

---

## Tier 2 — Strong differentiators

### 2A: AI Meeting Summary

**What it does:** After a meeting is marked `completed`, a "Generate Summary" button appears. It sends the conversation message history to Gemini and returns a structured summary: key topics discussed, agreed next steps, open questions. Displayed inline and saveable as PDF (ties into Tier 3A).

**Architecture:**
- New endpoint: `POST /api/ai/meeting-summary/:meetingId`
- Validates meeting is `completed` and requester is a participant
- Fetches conversation messages, builds prompt, calls Gemini
- Response: `{ topics: string[], nextSteps: string[], openQuestions: string[] }`
- Stored on the Meeting document: `aiSummary?: { topics, nextSteps, openQuestions, generatedAt }`
- Frontend: `<MeetingSummaryPanel>` on `MeetingsPage` completed tab; shows spinner during generation, caches result

---

### 2B: Collaboration Score / Badge System

**What it does:** Users earn badges based on platform activity. Badges shown on public profile and post cards. Score is a sum of weighted badge values.

**Badge definitions (fixed set, not user-configurable):**

| Badge | Trigger | Points |
|-------|---------|--------|
| `first_post` | Published first post | 10 |
| `active_collaborator` | 3+ confirmed meetings | 25 |
| `trusted_partner` | 5+ completed meetings | 50 |
| `community_helper` | 10+ comments posted | 15 |
| `profile_complete` | Score ≥ 80 (from 1A) | 20 |
| `early_adopter` | Account created before milestone date | 30 |

**Architecture:**
- New field on User model: `badges: string[]`, `collaborationScore: number`
- New service: `badgeService.ts` — `recalculateBadges(userId)` function, called from meeting complete, post publish, comment create, profile update hooks
- New endpoint: `GET /api/users/:id/badges` (public)
- Frontend: `<BadgeList>` component used on `PublicProfilePage` and `PostCard`

---

### 2C: GitHub / LinkedIn OAuth

**What it does:** Users can link their GitHub or LinkedIn account to their profile. Linked accounts show as verified badges on public profile. No password change — links as secondary auth method only.

**Architecture:**
- Backend: `passport.js` with `passport-github2` and `passport-linkedin-oauth2` strategies
- New routes: `GET /api/auth/github`, `GET /api/auth/github/callback`, same for linkedin
- On callback: if email matches existing user → link account (add `githubId`/`linkedinId` to User). If no match → create new user
- New User fields: `githubId?: string`, `linkedinId?: string`, `githubUsername?: string`, `linkedinProfileUrl?: string`
- Frontend: "Connect GitHub" / "Connect LinkedIn" buttons on `ProfilePage`; linked status shown on `PublicProfilePage`
- `.env` placeholders: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

---

## Tier 3 — Quick wins, high visibility

### 3A: Export to PDF

**What it does:** Two PDF export surfaces:
1. **Post PDF** — from `PostDetailPage`, "Export as PDF" button generates a formatted PDF of the post (title, description, author, stage, requirements)
2. **Meeting Summary PDF** — from the summary panel (2A), export the AI summary as PDF

**Architecture:**
- Frontend-only: `jsPDF` + `html2canvas` — no backend changes needed
- `src/utils/pdfExport.ts` utility with `exportPostToPdf(post)` and `exportSummaryToPdf(summary, meeting)` functions
- Triggered by buttons in existing components

**Package:** `jspdf`, `html2canvas`

---

### 3B: Full TR/EN i18n Completion

**What it does:** Audit all `useTranslation` calls against `en.json` and `tr.json`, fill every missing key. All UI text (including error messages, toast notifications, and admin panel) is translatable.

**Architecture:**
- Script: `scripts/check-i18n.ts` — greps all `t('...')` calls in `src/`, compares against both locale files, outputs missing keys
- Fill all missing keys in both `en.json` and `tr.json`
- Language switcher already exists in Navbar — no new UI needed

---

### 3C: Email Digest Preferences + Weekly Digest

**What it does:** Users can opt in to a weekly email digest summarizing: new posts matching their expertise, upcoming meetings, unread message count. Preference stored per user.

**Architecture:**
- New User field: `notifPrefs.weeklyDigest: boolean` (default `false`) — already has `notifPrefs` object
- New endpoint: already covered by `PUT /api/auth/me/notif-prefs`
- New cron job: `src/cron/weeklyDigest.ts` — runs every Monday 09:00, queries users with `weeklyDigest: true`, fetches relevant data, sends email via existing `emailService`
- New email template: `src/services/email/weeklyDigestTemplate.ts`
- Frontend: toggle on `ProfilePage` notification preferences section

---

## Implementation Order

```
Tier 1A → 1B → 1C → [verify all] → commit
Tier 2A → 2B → 2C → [verify all] → commit  
Tier 3A → 3B → 3C → [verify all] → commit
```

## Verification Checklist (per tier)

- [ ] Backend endpoints return correct HTTP status codes
- [ ] Frontend renders without console errors
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Existing tests still pass (`npm run test`)

---

*Spec written by Claude Sonnet 4.6 — 2026-05-20*
