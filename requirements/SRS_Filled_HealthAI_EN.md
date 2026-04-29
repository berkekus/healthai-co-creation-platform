# Software Requirements Specification (SRS)

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
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Definitions and Abbreviations
   - 1.4 Intended Audience
2. Overall Description
   - 2.1 Product Perspective
   - 2.2 User Roles
   - 2.3 Assumptions and Dependencies
   - 2.4 Constraints
3. Functional Requirements
   - 3.1 User Registration & Access Control
   - 3.2 Post Management
   - 3.3 Search & Matching
   - 3.4 Meeting Request Workflow
   - 3.5 Administrative Dashboard
   - 3.6 Activity Logging & Audit Trail
4. Non-Functional Requirements
5. Use Cases
6. Data Model
7. Interface Requirements
8. Requirements Traceability Matrix
9. Appendices

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the **HEALTH AI Co-Creation & Innovation Platform**. It provides a complete description of the functional and non-functional requirements, use cases, and data model for the system. This SRS serves as the contractual basis between the development team and course instructor, guiding the design and implementation phases of the project.

### 1.2 Scope

The HEALTH AI Co-Creation & Innovation Platform is a web-based matchmaking system that connects **engineers** and **healthcare professionals** across Europe to collaboratively design and develop medical AI projects. The platform supports the full lifecycle of collaboration — from project post creation and AI-powered partner matching to meeting scheduling and partnership confirmation.

The platform **does not** provide: financial transaction processing, contract management, medical advice, video conferencing integration, or direct file sharing between users.

### 1.3 Definitions and Abbreviations

| Term | Definition |
|------|------------|
| SRS | Software Requirements Specification |
| SDD | Software Design Document |
| RBAC | Role-Based Access Control — access control based on user roles |
| GDPR | General Data Protection Regulation — EU privacy and data law |
| NDA | Non-Disclosure Agreement — confidentiality agreement accepted before meetings |
| JWT | JSON Web Token — stateless authentication token issued on login |
| API | Application Programming Interface |
| REST | Representational State Transfer — architectural style for web APIs |
| WCAG | Web Content Accessibility Guidelines |
| AI | Artificial Intelligence |
| CRUD | Create, Read, Update, Delete |
| SPA | Single Page Application |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| ODM | Object Document Mapper (e.g., Mongoose for MongoDB) |

### 1.4 Intended Audience

This document is intended for:
- **Course instructor**: to evaluate the completeness of requirements specification
- **Development team**: as the authoritative reference for system behavior
- **Project stakeholders**: to validate that requirements match the project brief

---

## 2. Overall Description

### 2.1 Product Perspective

Current processes for collaboration between healthcare professionals and engineers rely on informal channels — conferences, personal networks, and email chains — which are inefficient and geographically constrained. The HEALTH AI platform addresses this gap by providing a structured, role-based digital environment where users can discover suitable partners based on expertise, medical domain, and project stage.

The platform is a standalone web application deployed via Docker containers and does not replace or integrate with any existing legacy system. It communicates with MongoDB for data persistence and the Google Gemini API for AI-powered matching.

### 2.2 User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Engineer** | Software/hardware/AI engineers seeking collaboration on medical AI projects | Register, create/publish posts, browse posts, express interest, request meetings, manage own profile |
| **Healthcare Professional** | Medical practitioners or researchers seeking technical partners for AI projects | Register, create/publish posts, browse posts, express interest, request meetings, manage own profile |
| **Admin** | Platform administrator responsible for content moderation and oversight | All user permissions + user suspension/unsuspension, post management, audit log access, CSV export |

### 2.3 Assumptions and Dependencies

1. Users are assumed to have a valid email address accessible during registration.
2. The system depends on a stable internet connection between the frontend and backend.
3. The Google Gemini API is assumed to be available for AI-powered matching; a keyword-based fallback is used when unavailable.
4. A MongoDB instance (local or MongoDB Atlas) must be available for data persistence.
5. Meeting scheduling takes place externally (e.g., Zoom, Microsoft Teams); the platform manages only time slot proposals and confirmations.
6. Users are assumed to operate a modern browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+).

### 2.4 Constraints

1. No patient data or sensitive medical records are stored in the system.
2. The platform does not integrate with any video conferencing tool.
3. No financial transactions are processed on the platform.
4. The system must comply with GDPR requirements (data export, account deletion, cookie consent).
5. File uploads are limited to profile images only; no document sharing is supported.
6. The backend request body size is limited to 10 KB to prevent abuse.

---

## 3. Functional Requirements

### 3.1 User Registration & Access Control

| ID | Requirement Description | Priority | Source |
|----|------------------------|----------|--------|
| FR-01 | The system shall allow users to register with a valid email address and a secure password. | High | Brief 4.1 |
| FR-02 | The system shall send an email verification link upon successful registration. | High | Brief 4.1 |
| FR-03 | The user shall be able to select a role during registration: Engineer or Healthcare Professional. | High | Brief 4.1 |
| FR-04 | The system shall require users to provide institution name, city, and country during registration. | High | Brief 4.1 |
| FR-05 | The system shall hash all user passwords using bcrypt before storage; plaintext passwords shall never be stored. | High | Brief 4.1 |
| FR-06 | The system shall issue a JWT token with a configurable expiry upon successful login. | High | Brief 4.1 |
| FR-07 | The system shall invalidate the frontend session after 30 minutes of user inactivity, displaying a warning modal before expiry. | Medium | Brief 4.1 |
| FR-08 | The admin shall be able to suspend a user account, preventing that user from logging in until unsuspended. | High | Brief 4.5 |
| FR-09 | The authenticated user shall be able to update their profile information (bio, expertise tags, institution, city, country, avatar). | Medium | Brief 4.1 |
| FR-10-auth | The user shall be able to change their password after verifying the current password. | Medium | Brief 4.1 |

### 3.2 Post Management

| ID | Requirement Description | Priority | Source |
|----|------------------------|----------|--------|
| FR-10 | The system shall allow authenticated engineers and healthcare professionals to create posts with the following mandatory fields: title, domain, required expertise, description, project stage, collaboration type, confidentiality level, city, country, and expiry date. | High | Brief 4.2 |
| FR-11 | Newly created posts shall be saved in "Draft" status until explicitly published by the author. | High | Brief 4.2 |
| FR-12 | The post author shall be able to publish a draft post, changing its status to "Active". | High | Brief 4.2 |
| FR-13 | The post author shall be able to edit any field of their own post while it is in Draft or Active status. | Medium | Brief 4.2 |
| FR-14 | The post author shall be able to permanently delete their own post. | Medium | Brief 4.2 |
| FR-15 | The system shall automatically change the status of Active or Meeting Scheduled posts whose expiry date has passed to "Expired". | High | Brief 4.2 |
| FR-16 | The post author shall be able to mark an active post as "Partner Found", which closes the post to further meeting requests. | High | Brief 4.2 |
| FR-17 | The system shall automatically change the post status to "Meeting Scheduled" when a meeting request for that post is accepted by its author. | High | Brief 4.2 |
| FR-18 | Authenticated users shall be able to express interest in an active post; the interest count shall be incremented accordingly. | Medium | Brief 4.2 |
| FR-19 | The system shall track and display the interest count and meeting request count for each post. | Low | Brief 4.2 |

### 3.3 Search & Matching

| ID | Requirement Description | Priority | Source |
|----|------------------------|----------|--------|
| FR-20 | The system shall allow users to search posts by keyword across post title, description, and required expertise fields. | High | Brief 4.3 |
| FR-21 | The system shall allow users to filter posts by domain, country, city, project stage, collaboration type, and post status. | High | Brief 4.3 |
| FR-22 | The system shall use the Google Gemini AI API to score expertise compatibility between the logged-in user's profile and available posts, presenting top-scoring posts as "Featured Matches". | Medium | Brief 4.3 |
| FR-23 | The system shall fall back to keyword-based matching when the AI service is unavailable or returns an error. | Medium | Brief 4.3 |
| FR-24 | Featured Match posts shall be displayed at the top of the post list for authenticated users. | Low | Brief 4.3 |

### 3.4 Meeting Request Workflow

| ID | Requirement Description | Priority | Source |
|----|------------------------|----------|--------|
| FR-30 | An authenticated user shall be able to send a meeting request for an active post by providing: a message, NDA acceptance confirmation, and three proposed time slots (date + time). | High | Brief 4.4 |
| FR-31 | The post author shall be able to accept or decline an incoming meeting request from the Meetings page. | High | Brief 4.4 |
| FR-32 | Upon acceptance, the post author shall be able to confirm one of the requester's proposed time slots as the confirmed meeting time. | High | Brief 4.4 |
| FR-33 | Either party (requester or post owner) shall be able to cancel a confirmed meeting. | Medium | Brief 4.4 |
| FR-34 | The system shall push in-app notifications to both parties whenever a meeting request status changes (requested, accepted, declined, cancelled). | High | Brief 4.4 |
| FR-35 | The system shall prevent a user from submitting duplicate meeting requests for the same post. | Medium | Brief 4.4 |

### 3.5 Administrative Dashboard

| ID | Requirement Description | Priority | Source |
|----|------------------------|----------|--------|
| FR-40 | The admin shall be able to view, search, and filter all registered users by name, email, role, and suspension status. | High | Brief 4.5 |
| FR-41 | The admin shall be able to view and filter all posts on the platform by status, domain, and author. | High | Brief 4.5 |
| FR-42 | The admin shall be able to suspend or unsuspend any user account, with the action recorded in the audit log. | High | Brief 4.5 |
| FR-43 | The admin shall be able to view the full audit log with filtering by user email, action type, result, and date range. | High | Brief 4.5 |
| FR-44 | The admin shall be able to export the filtered audit log as a CSV file. | Medium | Brief 4.5 |
| FR-45 | The admin panel shall display a profile completeness percentage for each user based on filled optional fields. | Low | Brief 4.5 |

### 3.6 Activity Logging & Audit Trail

| ID | Requirement Description | Priority | Source |
|----|------------------------|----------|--------|
| FR-50 | The system shall log every significant user action to the audit trail, including: registration, login (success/failure), logout, post creation, post publication, post deletion, meeting request, meeting acceptance, meeting decline, meeting cancellation, user suspension, account deletion, data export, and admin actions. | High | Brief 4.6 |
| FR-51 | Each audit log entry shall record: timestamp, user ID, user email, user role, action type code, target entity ID (post/meeting/user affected), result (success or failure), and requester IP address. | High | Brief 4.6 |
| FR-52 | Audit logs shall be retained indefinitely. They shall NOT be deleted when a user account is deleted, to preserve the integrity of the audit trail. | High | Brief 4.6 |
| FR-53 | The system shall support filtering audit logs by action type, result (success/failure), user email, and date range. | Medium | Brief 4.6 |

---

## 4. Non-Functional Requirements

| ID | Requirement | Metric / Target | Category |
|----|-------------|----------------|----------|
| NFR-01 | Search results shall be returned within an acceptable time. | < 1.5 seconds | Performance |
| NFR-02 | Page load time shall be limited. | < 3 seconds | Performance |
| NFR-03 | All passwords shall be stored using bcrypt with a minimum of 10 salt rounds. | bcrypt, 10 salt rounds | Security |
| NFR-04 | Authentication endpoints shall be rate-limited to prevent brute-force attacks. | Max 15 requests per 15 minutes per IP | Security |
| NFR-05 | The system shall comply with GDPR, providing mechanisms for data export and account deletion. | GDPR compliant | GDPR/Privacy |
| NFR-06 | Users shall be able to download all their personal data in machine-readable format. | JSON export available on Profile page | GDPR/Privacy |
| NFR-07 | Users shall be able to permanently delete their account and all associated content (posts, meetings). Audit logs are retained. | Account + posts deleted; logs retained | GDPR/Privacy |
| NFR-08 | The user interface shall comply with WCAG 2.1 Level AA accessibility standards. | WCAG 2.1 AA | Accessibility |
| NFR-09 | The API shall enforce CORS restrictions, only allowing requests from authorized frontend origins. | CORS allowlist enforced | Security |
| NFR-10 | All data in transit shall be encrypted using HTTPS in the production environment. | TLS/HTTPS enforced in production | Security |
| NFR-11 | The server shall set secure HTTP headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS) via Helmet middleware. | Helmet active | Security |
| NFR-12 | All user inputs shall be sanitized to prevent NoSQL injection attacks. | express-mongo-sanitize active | Security |
| NFR-13 | The user interface shall be intuitive enough for non-technical healthcare professionals without training. | System Usability Scale (SUS) score ≥ 70 | Usability |
| NFR-14 | The system shall warn users 5 minutes before their session expires, and automatically log them out after 30 minutes of inactivity. | 30-minute timeout with 5-min warning | Security/Usability |
| NFR-15 | The application shall be deployable on any machine using Docker Compose with a single command. | `docker-compose up` fully functional | Deployability |

---

## 5. Use Cases

### 5.1 UC-01: Engineer Creates a Post

| Field | Content |
|-------|---------|
| **Name** | UC-01: Engineer Creates a Post |
| **Actor(s)** | Engineer |
| **Precondition** | The engineer must be logged in with an active account. |
| **Main Flow** | 1. The engineer navigates to the "Create Post" page. 2. Fills in all required fields: title, domain, required expertise, description, project stage, collaboration type, confidentiality, city, country, and expiry date. 3. Clicks "Save as Draft" to save a draft. 4. Clicks "Publish" to publish the post. 5. The system changes the post status to "Active" and makes it visible to other users. |
| **Postcondition** | The post is saved with "Active" status and visible to all authenticated users in the post list. |
| **Alternative Flow** | 3a. If a required field is left blank, the system displays a validation error and prevents submission. 4a. The engineer can save the post as a draft and publish it later. |

---

### 5.2 UC-02: Healthcare Professional Requests a Meeting

| Field | Content |
|-------|---------|
| **Name** | UC-02: Healthcare Professional Requests a Meeting |
| **Actor(s)** | Healthcare Professional |
| **Precondition** | The user must be logged in. An active post must exist from another user. |
| **Main Flow** | 1. The healthcare professional browses the post list or uses the search/filter feature to find a relevant post. 2. Clicks on the post to view its detail page. 3. Clicks "Request Meeting." 4. Fills in a message describing their interest, checks the NDA acceptance checkbox, and proposes three time slots (date + time each). 5. Clicks "Send Request." 6. The system saves the meeting request with "Pending" status and sends an in-app notification to the post owner. |
| **Postcondition** | A meeting request is created with "Pending" status. The post owner receives an in-app notification. |
| **Alternative Flow** | 5a. If the user has already submitted a meeting request for this post, the system displays an error message and blocks the duplicate submission. 5b. If required fields (message, NDA, time slots) are incomplete, the system shows validation errors. |

---

### 5.3 UC-03: Post Owner Accepts a Meeting Request

| Field | Content |
|-------|---------|
| **Name** | UC-03: Post Owner Accepts a Meeting Request |
| **Actor(s)** | Engineer or Healthcare Professional (post author) |
| **Precondition** | The post author must be logged in. A meeting request in "Pending" status must exist for their post. |
| **Main Flow** | 1. The post owner navigates to the Meetings page. 2. Opens the "Incoming" tab and views the pending meeting request. 3. Reviews the requester's message and proposed time slots. 4. Clicks "Accept" and selects one of the proposed time slots as the confirmed slot. 5. The system changes the meeting status to "Confirmed." 6. The system changes the post status to "Meeting Scheduled." 7. The system notifies the requester via an in-app notification. |
| **Postcondition** | Meeting status is "Confirmed." Post status is "Meeting Scheduled." Both parties are notified. |
| **Alternative Flow** | 4a. If the post owner clicks "Decline" instead, the meeting status changes to "Declined" and the post status remains "Active." The requester is notified. |

---

### 5.4 UC-04: Admin Suspends a User

| Field | Content |
|-------|---------|
| **Name** | UC-04: Admin Suspends a User |
| **Actor(s)** | Admin |
| **Precondition** | The admin must be logged in. The target user must have an active (non-suspended) account. |
| **Main Flow** | 1. The admin navigates to the Admin Panel. 2. Opens the "Users" tab. 3. Searches for the target user by name or email. 4. Clicks the "Suspend" button next to the user. 5. The system sets the user's `isSuspended` flag to `true`. 6. The system records the action in the audit log (action: SUSPENSION_APPLIED). 7. The system displays a success confirmation. |
| **Postcondition** | The user's account is suspended; they cannot log in. The action is recorded in the audit log. |
| **Alternative Flow** | 4a. If the user is already suspended, the admin can click "Unsuspend" to restore access. The audit log records SUSPENSION_REMOVED. |

---

### 5.5 UC-05: User Exports Their Personal Data (GDPR)

| Field | Content |
|-------|---------|
| **Name** | UC-05: User Exports Personal Data |
| **Actor(s)** | Engineer, Healthcare Professional |
| **Precondition** | The user must be logged in with an active account. |
| **Main Flow** | 1. The user navigates to their Profile page. 2. Clicks "Export My Data." 3. The system collects all data associated with the user: profile information, posts, and meetings. 4. The system returns a JSON file download containing the user's complete personal data. |
| **Postcondition** | The user has downloaded a JSON file containing all their personal data. The action is recorded in the audit log. |
| **Alternative Flow** | None. |

---

## 6. Data Model

### Entity Table

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| **User** | _id, name, email, password (hashed), role, institution, city, country, bio, expertiseTags, isVerified, isSuspended, lastActive | Has many Posts (1:N); Has many Meetings as requester (1:N); Has many Meetings as owner (1:N); Has many Notifications (1:N); Has many Logs (1:N) |
| **Post** | _id, title, authorId, authorName, authorRole, domain, expertiseRequired, description, projectStage, collaborationType, confidentiality, city, country, expiryDate, status, interestCount, meetingCount | Belongs to User (N:1); Has many Meetings (1:N) |
| **Meeting (MeetingRequest)** | _id, postId, postTitle, requesterId, requesterName, requesterEmail, ownerId, ownerName, ownerEmail, status, message, ndaAccepted, proposedSlots, confirmedSlot | Belongs to Post (N:1); Belongs to User as requester (N:1); Belongs to User as owner (N:1) |
| **Notification** | _id, userId, type, title, body, isRead, linkTo | Belongs to User (N:1) |
| **ActivityLog** | _id, timestamp, userId, userEmail, role, action, targetEntityId, result, ipAddress | Belongs to User (N:1) |

> An ER diagram (visual) is included in the Appendices section.

**Post Status Values:** draft | active | meeting_scheduled | partner_found | expired

**Meeting Status Values:** pending | time_proposed | confirmed | completed | declined | cancelled

---

## 7. Interface Requirements

### 7.1 User Interface (UI)

The application consists of the following main screens:

| Screen | Description | Access |
|--------|-------------|--------|
| **Landing Page** | Marketing page with platform features, hero section, and call-to-action buttons | Public |
| **Login Page** | Email/password login form | Public |
| **Registration Page** | 3-step wizard: (1) personal info, (2) role + institution, (3) expertise tags | Public |
| **Email Verify Page** | Email verification confirmation screen | Public |
| **Dashboard** | Active post feed with AI-matched featured posts and user activity overview | Authenticated |
| **Post List Page** | Searchable, filterable grid of active posts with featured AI matches at the top | Authenticated |
| **Post Detail Page** | Full post information with interest button and meeting request modal | Authenticated |
| **Post Create Page** | Multi-field form for creating a new post | Authenticated |
| **Post Edit Page** | Pre-filled form for editing an existing post | Post author only |
| **Meetings Page** | Tabbed view: All / Incoming / Outgoing / Confirmed meetings with status management | Authenticated |
| **Profile Page** | Edit profile, change password, export personal data (GDPR), delete account (GDPR) | Authenticated |
| **Notifications Page** | Chronological list of all in-app notifications with read/unread status | Authenticated |
| **Admin Panel** | Tabbed interface: Users / Posts / Audit Logs, with CSV export | Admin only |
| **Privacy Policy Page** | GDPR-compliant privacy information | Public |
| **404 / 403 Pages** | Error pages for not found and unauthorized access | All |

> Wireframes/mockups are included in the Appendices.

### 7.2 External System Interfaces

| External System | Purpose | Interface Type |
|----------------|---------|---------------|
| **Google Gemini API** | AI-powered expertise matching between user profiles and posts | REST API (HTTPS), configured via `VITE_GEMINI_API_KEY` |
| **MongoDB** | Primary data store for all entities | Mongoose ODM over TCP, configured via `MONGO_URI` |
| **Nodemailer / Email Service** | Email verification and meeting notifications (configured, not yet fully integrated) | SMTP |
| **Nginx** | Production reverse proxy for the React SPA | HTTP/HTTPS reverse proxy |

---

## 8. Requirements Traceability Matrix

| Req. ID | Requirement Summary | Source (Brief) | Related Use Case |
|---------|---------------------|---------------|-----------------|
| FR-01 | User registration with email | Brief 4.1 | UC-01, UC-02 |
| FR-02 | Email verification on registration | Brief 4.1 | UC-01 |
| FR-03 | Role selection during registration | Brief 4.1 | UC-01, UC-02 |
| FR-04 | Institution/city/country required | Brief 4.1 | UC-01 |
| FR-05 | Password hashing (bcrypt) | Brief 4.1 | UC-01 |
| FR-06 | JWT issuance on login | Brief 4.1 | UC-01, UC-02, UC-03, UC-04 |
| FR-07 | Session timeout (30 min) | Brief 4.1 | — |
| FR-08 | Admin user suspension | Brief 4.5 | UC-04 |
| FR-09 | Profile update | Brief 4.1 | — |
| FR-10 | Post creation with required fields | Brief 4.2 | UC-01 |
| FR-11 | Draft post status on creation | Brief 4.2 | UC-01 |
| FR-12 | Publish post (draft → active) | Brief 4.2 | UC-01 |
| FR-13 | Post editing by author | Brief 4.2 | — |
| FR-14 | Post deletion by author | Brief 4.2 | — |
| FR-15 | Automatic post expiry | Brief 4.2 | — |
| FR-16 | Partner found status | Brief 4.2 | UC-03 |
| FR-17 | Meeting Scheduled post status | Brief 4.2 | UC-03 |
| FR-18 | Express interest in post | Brief 4.2 | UC-02 |
| FR-19 | Interest/meeting count tracking | Brief 4.2 | — |
| FR-20 | Keyword search for posts | Brief 4.3 | UC-02 |
| FR-21 | Filter posts by domain/city/etc. | Brief 4.3 | UC-02 |
| FR-22 | AI-powered matching (Gemini) | Brief 4.3 | UC-02 |
| FR-23 | Keyword fallback matching | Brief 4.3 | — |
| FR-24 | Featured match display | Brief 4.3 | — |
| FR-30 | Send meeting request (message + NDA + slots) | Brief 4.4 | UC-02 |
| FR-31 | Accept/decline meeting | Brief 4.4 | UC-03 |
| FR-32 | Confirm time slot | Brief 4.4 | UC-03 |
| FR-33 | Cancel meeting by either party | Brief 4.4 | — |
| FR-34 | In-app notifications for meeting events | Brief 4.4 | UC-02, UC-03 |
| FR-35 | Prevent duplicate meeting requests | Brief 4.4 | — |
| FR-40 | Admin view/search users | Brief 4.5 | UC-04 |
| FR-41 | Admin view/filter posts | Brief 4.5 | — |
| FR-42 | Admin suspend/unsuspend users | Brief 4.5 | UC-04 |
| FR-43 | Admin audit log with filters | Brief 4.5 | — |
| FR-44 | Admin CSV export of logs | Brief 4.5 | — |
| FR-45 | Profile completeness percentage | Brief 4.5 | — |
| FR-50 | Log all significant actions | Brief 4.6 | — |
| FR-51 | Log entry field structure | Brief 4.6 | — |
| FR-52 | Indefinite log retention | Brief 4.6 | — |
| FR-53 | Log filtering support | Brief 4.6 | — |

---

## 9. Appendices

- **Appendix A:** Use Case Diagram
- **Appendix B:** ER Diagram (visual)
- **Appendix C:** Wireframes / Mockup images (Landing Page, Registration, Post List, Post Detail + Meeting Request Modal, Admin Panel)
