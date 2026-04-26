# Conventions

*Last updated: 2026-04-25*

## Formatter / Linter

- **No ESLint or Prettier config** present in either `frontend/` or `backend/`.
- **TypeScript strict mode** is the only enforced layer:
  - `frontend/tsconfig.json` — `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
  - `backend/tsconfig.json` — `strict: true`
- Style is consistent across the codebase by convention only.

## Code Style

- **Indentation:** 2 spaces.
- **Quotes:** single quotes.
- **Semicolons:** always.
- **Trailing commas:** present in multi-line objects/arrays.
- **Line length:** loose (~120 chars typical, no enforced limit).

## Naming

| Element | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `frontend/src/pages/CreatePost.tsx` |
| Type/interface files | `*.types.ts` | `frontend/src/types/post.types.ts` |
| Backend services | `[domain]Service.ts` | `backend/src/services/postService.ts` |
| Backend controllers | `[domain]Controller.ts` | `backend/src/controllers/postController.ts` |
| Zustand stores | `[domain]Store.ts` | `frontend/src/store/authStore.ts` |
| Variables / functions | camelCase | `getUserById`, `isAuthenticated` |
| Booleans | `is*` / `has*` / `can*` / `should*` prefix | `isAuthenticated`, `hasExpired` |
| Type union values | snake_case strings | `'concept_validation'`, `'co_founder'`, `'meeting_only'` |
| Constants | UPPER_SNAKE_CASE | `CRITICAL_LOG_ACTIONS` |

## Validation

- **Frontend:** [Zod](https://zod.dev) v4.3.6 with React Hook Form integration. Centralized in `frontend/src/utils/validators.ts`.
- **Backend:** Manual guard-clause validation inside controllers + Mongoose schema-level validation on the model.

## Error Handling

**Backend:**
- Custom `Error` objects with a `statusCode` property attached.
- Centralized middleware: `backend/src/middlewares/errorHandler.ts`.
- Handles:
  - Mongoose `ValidationError` → 400
  - Mongoose `CastError` → 400
  - Duplicate-key errors → 409
  - JWT errors → 401

**Frontend:**
- Error state lives in Zustand stores (per domain).
- Global Axios interceptor: on 401, clears token and redirects to login.

## Logging

- **Application logs:** `console.log` / `console.error` only — no winston/pino.
- **Activity / audit logs:** dedicated `LogService` + Mongoose `Log` model.
- **Action catalog:** `backend/src/constants/logActions.ts` — defines action codes and a `CRITICAL_LOG_ACTIONS` Set tracked separately.

## Imports

- **No path aliases** — relative paths everywhere (`../../components/Foo`).
- **Order convention** (observed, not enforced):
  1. React / framework
  2. External packages
  3. Internal types
  4. Internal modules (services, utils, components)

## Patterns

- **Service / Controller split** on backend: controllers handle HTTP, services hold logic, models talk to MongoDB.
- **Zustand stores** on frontend for global state; React Hook Form for form state; Zod for validation.
- **JWT** stored client-side; auth state hydrated from token via Zustand.

## Notes

- Strict TypeScript is the de facto quality gate — no linter, no formatter, no commit hooks.
- Adding ESLint + Prettier + a pre-commit hook would catch drift cheaply (none currently in place).
