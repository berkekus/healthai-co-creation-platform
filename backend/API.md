# HealthAI Co-Creation Platform — Backend API

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <token>
```

All responses follow the envelope:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "..." }
```

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness probe |

**Response 200**
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Auth — `/api/auth`

Global rate limit applies to the entire `/api/auth` prefix.

### POST `/api/auth/register`

Create a new account. Returns token immediately (no email verification step).

**Body**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@university.edu",
  "password": "password123",
  "role": "engineer | healthcare_professional | admin",
  "institution": "Charité Berlin",
  "city": "Berlin",
  "country": "Germany"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "664f...",
      "name": "Dr. Jane Smith",
      "email": "jane@university.edu",
      "role": "engineer",
      "institution": "Charité Berlin",
      "city": "Berlin",
      "country": "Germany",
      "bio": null,
      "avatarUrl": null,
      "expertiseTags": [],
      "isVerified": true,
      "isSuspended": false,
      "lastActive": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJ..."
  }
}
```

**Errors** — `400` missing/invalid fields · `409` email already registered

---

### POST `/api/auth/login`

**Body**
```json
{ "email": "jane@university.edu", "password": "password123" }
```

**Response 200** — same envelope as register (`user` + `token`)

**Errors** — `400` missing fields · `401` invalid credentials · `403` account suspended

---

### POST `/api/auth/logout` 🔒

Writes audit log entry. Client must discard token.

**Response 200**
```json
{ "success": true, "message": "Logged out" }
```

---

### GET `/api/auth/me` 🔒

Returns the authenticated user's profile.

**Response 200** — `{ "success": true, "data": { ...user } }`

---

### PUT `/api/auth/me/profile` 🔒

Update own profile. All fields optional.

**Body** (partial)
```json
{
  "name": "Dr. Jane Smith",
  "institution": "Charité Berlin",
  "city": "Berlin",
  "country": "Germany",
  "bio": "Cardiologist specialising in AI-assisted diagnosis.",
  "avatarUrl": "https://example.com/avatar.png",
  "expertiseTags": ["ML", "Cardiology"],
  "position": "Associate Professor",
  "department": "Department of Cardiology",
  "orcid": "0000-0002-1825-0097",
  "institutionWebsite": "https://www.charite.de",
  "contactEmail": "cardiology-research@charite.de",
  "linkedinUrl": "https://www.linkedin.com/in/jane-smith"
}
```

Professional details (`position` … `linkedinUrl`) are public on the profile. `orcid` accepts the bare iD or the `https://orcid.org/` form and must have a valid check digit; `linkedinUrl` must point to linkedin.com; `institutionWebsite` must be an http(s) address. Sending an empty string clears a field.

**Response 200** — `{ "success": true, "data": { ...updatedUser } }`

**Errors** — `400` invalid ORCID iD, web address, email or LinkedIn link

---

### GET `/api/auth/providers`

Which account providers this server can link, so clients only offer working buttons.

**Response 200**
```json
{ "success": true, "data": { "github": true, "linkedin": false } }
```

---

### PUT `/api/auth/me/password` 🔒

**Body**
```json
{ "oldPassword": "password123", "newPassword": "newpassword456" }
```

**Response 200** — `{ "success": true, "message": "Password updated" }`

**Errors** — `400` missing fields / new password < 8 chars / wrong old password

---

### DELETE `/api/auth/me` 🔒

Permanently delete the authenticated account after confirming the current password.

**Body**
```json
{ "password": "password123" }
```

**Response 200** — `{ "success": true, "message": "Account permanently deleted" }`

**Errors** — `400` missing or incorrect password · `401` invalid or expired authentication token

---

### GET `/api/auth/users` 🔒 Admin

List all users with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by role |
| `search` | string | Name or email substring (case-insensitive) |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "users": [ { ...user } ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

### GET `/api/auth/users/:id` 🔒

Get a single user by ID (any authenticated user).

**Response 200** — `{ "success": true, "data": { ...user } }`

**Errors** — `404` user not found

---

### PUT `/api/auth/users/:id/suspend` 🔒 Admin

**Body**
```json
{ "isSuspended": true }
```

**Response 200** — `{ "success": true, "data": { ...user } }`

---

## Posts — `/api/posts`

All endpoints require authentication.

### GET `/api/posts` 🔒

List published posts with filters. Use `mine=true` to list own posts (all statuses).

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `domain` | string | Posts spanning this domain (any of a post's `domains`; merged legacy names such as `Radiology` match `Radiology & Imaging`) |
| `expertise` | string | Filter by expertise required |
| `city` | string | Filter by city |
| `country` | string | Filter by country |
| `projectStage` | string | `idea \| pilot \| clinical_trial \| scaling` |
| `authorRole` | string | `engineer \| healthcare_professional` |
| `status` | string | `draft \| published \| partner_found` (ignored when `mine=true`) |
| `search` | string | Full-text search on title/description |
| `mine` | `"true"` | Return only the requester's posts |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "posts": [ { ...post } ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

### POST `/api/posts` 🔒

Create a draft post. Admins cannot create posts. Rate-limited per user.

**Body**
```json
{
  "title": "AI-assisted ECG interpretation",
  "domains": ["Cardiology", "Remote Patient Monitoring"],
  "expertiseRequired": "Machine Learning",
  "description": "Looking for an ML engineer to help interpret ECG signals.",
  "projectStage": "idea",
  "collaborationType": "research_partner",
  "levelOfCommitment": "flexible",
  "confidentiality": "public_pitch",
  "city": "Berlin",
  "country": "Germany",
  "expiryDate": "2025-06-01T00:00:00.000Z"
}
```

`domains` holds one to three names; the first is also stored as `domain` for older clients, which may still send a single `domain` instead.

**Response 201** — `{ "success": true, "data": { ...post } }`

**Errors** — `400` missing fields or more than three domains · `403` admins cannot post

---

### GET `/api/posts/:id` 🔒

**Response 200** — `{ "success": true, "data": { ...post } }`

**Errors** — `404` post not found

---

### PUT `/api/posts/:id` 🔒

Update a post. Only the author (or admin) can update. Accepts any subset of the create body.

**Response 200** — `{ "success": true, "data": { ...updatedPost } }`

---

### POST `/api/posts/:id/publish` 🔒

Move a draft to `published`. Only the author can publish.

**Response 200** — `{ "success": true, "data": { ...post } }`

---

### POST `/api/posts/:id/partner-found` 🔒

Mark an active, meeting-scheduled or expired post as `partner_found`. Only the author can call this. Requests still `pending` or `time_proposed` are cancelled and their requesters notified; meetings with a confirmed time are kept.

**Response 200** — `{ "success": true, "data": { ...post } }`

**Errors** — `400` draft post · `403` not the author

---

### POST `/api/posts/:id/reopen` 🔒

Undo "Partner Found". The post becomes `active` (or `meeting_scheduled` if a confirmed meeting remains). Closed requests stay closed.

**Body** (only needed when the expiry date has passed)
```json
{ "expiryDate": "2026-12-31" }
```

**Response 200** — `{ "success": true, "data": { ...post } }`

**Errors** — `400` post is not `partner_found`, or expired without a new future `expiryDate` · `403` not the author

---

### POST `/api/posts/:id/interest` 🔒

Express interest in a post (records the requester). Rate-limited.

**Response 200**
```json
{ "success": true, "data": { "interested": true } }
```

---

### DELETE `/api/posts/:id` 🔒

Delete a post. Only the author or admin can delete.

**Response 200** — `{ "success": true, "message": "Post deleted" }`

---

## Meetings — `/api/meetings`

All endpoints require authentication.

### GET `/api/meetings` 🔒

List meetings for the authenticated user. Pass `?postId=<id>` to get meetings for a specific post (author or admin only).

Every meeting returned by the meeting endpoints also carries `postStatus`, the post's current status — e.g. `partner_found` once the author has closed it — so clients can tell whether "Mark partner found" still applies.

**Response 200** — `{ "success": true, "data": [ { ...meeting, "postStatus": "active" } ] }`

---

### POST `/api/meetings` 🔒

Request a meeting on an `active` or `meeting_scheduled` post that is not your own. Rate-limited per user.

**Body**
```json
{
  "postId": "664f...",
  "postTitle": "AI-assisted ECG interpretation",
  "ownerId": "664f...",
  "ownerName": "Dr. Jane Smith",
  "message": "I would love to collaborate on this project.",
  "ndaAccepted": true,
  "proposedSlots": [
    { "date": "2025-02-10", "time": "14:00", "timezone": "Europe/Berlin" },
    { "date": "2025-02-11", "time": "10:00", "timezone": "Europe/Berlin" }
  ]
}
```

Propose 1–5 unique future slots. `time` is `HH:MM` on a 24-hour clock; `timezone` is an optional IANA zone (older clients omit it).

**Response 201** — `{ "success": true, "data": { ...meeting } }`

**Errors** — `400` missing fields, invalid/past/duplicate slots, unknown time zone, closed post or own post · `404` post or requester not found · `409` an open request (pending, accepted or confirmed) already exists

---

### GET `/api/meetings/:id` 🔒

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

### POST `/api/meetings/:id/accept` 🔒

Accept a pending request (`pending → time_proposed`). Only the post owner can accept. Opens the meeting's conversation for both parties.

**Response 200** — `{ "success": true, "data": { ...meeting } }`

**Errors** — `400` not pending · `403` not the owner

---

### POST `/api/meetings/:id/confirm` 🔒

Confirm one of the proposed slots (`time_proposed → confirmed`). The stored slot keeps its time zone. Other requests for the post stay open.

**Body**
```json
{ "slot": { "date": "2025-02-10", "time": "14:00" } }
```

**Response 200** — `{ "success": true, "data": { ...meeting } }`

**Errors** — `400` slot not proposed · `403` not the owner · `409` a participant already has a meeting at that time

---

### POST `/api/meetings/:id/reschedule` 🔒

Requester replaces the proposed slots while the owner is choosing or after a time was confirmed; the meeting returns to `time_proposed`.

**Body** — `{ "proposedSlots": [ { "date": "2025-02-12", "time": "09:30", "timezone": "Europe/Berlin" } ] }`

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

### POST `/api/meetings/:id/complete` 🔒

Either participant marks a confirmed meeting as held (`confirmed → completed`). This does **not** close the post; the author uses `partner-found` for that.

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

### POST `/api/meetings/:id/decline` 🔒

Decline a `pending` or `time_proposed` request. Only the post owner can decline. Optional body: `{ "reason": "…" }`.

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

### POST `/api/meetings/:id/cancel` 🔒

Cancel an accepted meeting. Either participant can cancel.

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

## Conversations — `/api/conversations`

### GET `/api/conversations/by-meeting/:meetingId` 🔒

The conversation of a meeting. For an accepted, scheduled or held meeting without one (accepted before chats opened on acceptance) it is created on first request.

**Response 200** — `{ "success": true, "data": { ...conversation } }`

**Errors** — `403` not a participant · `404` no such meeting, or the request has not been accepted

---

## Comments — `/api/posts/:id/comments`

### GET `/api/posts/:id/comments` 🔒

Twenty comments per page, oldest first: `?page=2`. Each comment has an `id`; replies carry the parent's id in `parentId`.

**Response 200** — `{ "success": true, "data": { "comments": [ { "id": "…", "parentId": null, ... } ], "total": 3, "page": 1, "pages": 1 } }`

---

### POST `/api/posts/:id/comments` 🔒

**Body** — `{ "content": "Is this open to engineers in Portugal?", "parentId": null }`

Notifies the post author (`new_comment`) and, for a reply, the author of the parent comment (`comment_reply`); nobody is notified about their own comment.

**Errors** — `400` empty/too long content or unknown parent · `404` post not found

---

## Notifications — `/api/notifications`

All endpoints require authentication. Notifications are scoped to the authenticated user.

### GET `/api/notifications` 🔒

**Response 200** — `{ "success": true, "data": [ { ...notification } ] }`

---

### GET `/api/notifications/unread-count` 🔒

**Response 200**
```json
{ "success": true, "data": { "count": 3 } }
```

---

### POST `/api/notifications` 🔒

Push a notification to any user (internal/admin use).

**Body**
```json
{
  "userId": "664f...",
  "type": "meeting_request",
  "title": "New meeting request",
  "body": "Marco Rossi wants to meet about your ECG project.",
  "linkTo": "/meetings/664f..."
}
```

**Response 201** — `{ "success": true, "data": { ...notification } }`

---

### POST `/api/notifications/:id/read` 🔒

Mark a single notification as read.

**Response 200** — `{ "success": true, "data": { ...notification } }`

---

### POST `/api/notifications/mark-all-read` 🔒

Mark all notifications for the user as read.

**Response 200** — `{ "success": true, "message": "All notifications marked as read" }`

---

### DELETE `/api/notifications/:id` 🔒

Delete a single notification.

**Response 200** — `{ "success": true, "message": "Notification deleted" }`

---

### DELETE `/api/notifications` 🔒

Delete all notifications for the authenticated user.

**Response 200** — `{ "success": true, "message": "All notifications deleted" }`

---

## Logs — `/api/logs`

### GET `/api/logs` 🔒 Admin

Returns audit log entries.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "userId": "664f...",
      "userEmail": "jane@university.edu",
      "role": "engineer",
      "action": "POST_CREATE",
      "targetEntityId": "664f...",
      "result": "success",
      "ipAddress": "::1",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Common Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad request — missing or invalid fields |
| 401 | Unauthenticated — missing or expired token |
| 403 | Forbidden — insufficient role or ownership |
| 404 | Resource not found |
| 409 | Conflict — e.g. duplicate email, stale meeting state |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
