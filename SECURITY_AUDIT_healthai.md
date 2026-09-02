# HealthAI — Security Audit Summary

**Scope:** source review, dependency audit and authenticated API integration tests. This is not a penetration test of the deployed Railway/Vercel environment.

## Verification performed

| Check | Result |
| --- | --- |
| Backend integration tests | 68 passed / 68 total |
| Backend TypeScript production build | Passed |
| Frontend production build | Passed (one existing CSS-minifier warning and a large-bundle warning) |
| `npm audit --omit=dev` (backend and frontend) | 0 known vulnerabilities |
| Current-source high-risk secret signature scan | No active key/connection-string match in tracked source; ignored local `.env` files were not disclosed |

## Fixed in this change

1. **Critical — public admin-role escalation:** public registration now accepts only engineer and healthcare-professional roles. Admin accounts must be created through a controlled workflow.
2. **High — direct-object access:** a user can no longer fetch another user's draft post or meeting by guessing its identifier. Post owners, meeting participants and admins retain access where appropriate.
3. **Medium — stale sessions after password change/reset:** HTTP and Socket.IO sessions carry a token version. A password change/reset increments that version and immediately invalidates earlier tokens.
4. **Low — credentials in development material:** public admin shortcut/password references were removed from user-facing demo/documentation areas.
5. **Maintenance:** obsolete `reset-admin-password` script and admin-migration package commands were removed; Vitest now ignores build output and dependency test files.

## Must be completed by the repository/domain owner

### 1. Rotate historic secrets — urgent

`backend/.env.atlas` was committed in repository history, even though it is not in the current working tree. Treat all values that appeared there as exposed: MongoDB/Atlas database credentials, JWT secret, mail provider credentials, Turnstile secret, Gemini/API keys and OAuth client secrets if present. Rotate them in their providers first, then update Railway/Vercel environment variables.

### 2. Remove the file from Git history — after rotation

Coordinate with every collaborator and branch-protection owner. In a **fresh clone**, use `git-filter-repo`:

```powershell
git filter-repo --path backend/.env.atlas --invert-paths
git push --force --all
git push --force --tags
```

Force-pushing rewrites history; collaborators must re-clone or carefully reset their local branches. Rotating secrets remains necessary even after this step.

### 3. Production configuration

In Railway, ensure `CLIENT_ORIGIN` and `APP_BASE_URL` are both `https://www.healthcocreate.com`. In Vercel, set the public API URL to the Railway API. Re-test registration, verification, password reset, login, posts, meetings and admin access after deployment.

### 4. Multi-instance rate limiting

The current `express-rate-limit` memory store is not durable across restarts/instances. Before scaling the backend, provision Redis and configure `rate-limit-redis`; this needs a Redis provider URL and deployment-environment access.

## Positive controls observed

- Password hashing uses bcrypt with 12 rounds.
- Helmet, Mongo query sanitization and route-level authentication are enabled.
- HTTP middleware re-reads role/suspension state from the database rather than trusting role information in a JWT.
- Most edit/delete handlers already check record ownership.

## Remaining test boundary

The deployed services, DNS/email delivery, database permissions, OAuth callback configuration, browser accessibility and active attack simulation require deployment access or human participants and were not represented as completed tests.
