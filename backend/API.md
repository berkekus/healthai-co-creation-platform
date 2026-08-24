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
  "expertiseTags": ["ML", "Cardiology"]
}
```

**Response 200** — `{ "success": true, "data": { ...updatedUser } }`

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
| `domain` | string | Filter by medical domain |
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
  "domain": "cardiology",
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

**Response 201** — `{ "success": true, "data": { ...post } }`

**Errors** — `400` missing fields · `403` admins cannot post

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

Mark post as `partner_found`. Only the author can call this.

**Response 200** — `{ "success": true, "data": { ...post } }`

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

**Response 200** — `{ "success": true, "data": [ { ...meeting } ] }`

---

### POST `/api/meetings` 🔒

Request a meeting on a published post. Rate-limited per user.

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
    { "date": "2025-02-10", "time": "14:00" },
    { "date": "2025-02-11", "time": "10:00" }
  ]
}
```

**Response 201** — `{ "success": true, "data": { ...meeting } }`

**Errors** — `400` missing fields · `404` requester not found

---

### GET `/api/meetings/:id` 🔒

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

### POST `/api/meetings/:id/accept` 🔒

Accept a meeting and confirm a slot. Only the post owner can accept.

**Body**
```json
{ "slot": { "date": "2025-02-10", "time": "14:00" } }
```

**Response 200** — `{ "success": true, "data": { ...meeting } }`

**Errors** — `400` missing slot · `403` not the owner · `409` meeting already accepted

---

### POST `/api/meetings/:id/decline` 🔒

Decline a pending meeting request. Only the post owner can decline.

**Response 200** — `{ "success": true, "data": { ...meeting } }`

---

### POST `/api/meetings/:id/cancel` 🔒

Cancel an accepted meeting. Either participant can cancel.

**Response 200** — `{ "success": true, "data": { ...meeting } }`

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
