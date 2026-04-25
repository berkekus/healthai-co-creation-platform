# Testing

*Last updated: 2026-04-25*

## Current State

**There are no tests in this codebase.**

| Signal | Value |
|---|---|
| Test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`) | 0 |
| Test framework configured (`jest.config`, `vitest.config`) | None |
| `test` script in `package.json` | Not present (front or back) |
| Test runner in `devDependencies` | Not present |
| Frontend source files (`.ts` / `.tsx`) | ~52 |
| Backend source files (`.ts`) | ~26 |
| **Coverage** | **0%** |

## Framework

None.

## Structure

N/A — no test directories (no `__tests__/`, `tests/`, or co-located test files).

## Mocking / Fixtures

N/A.

## Coverage Tooling

N/A.

## How Tests Are Run

N/A.

## Recommended Approach (when introducing tests)

If/when this project adds tests, the lowest-friction stack given the current code is:

- **Runner:** [Vitest](https://vitest.dev) — modern, TypeScript-native, fast, works for both sides of the repo.
- **Frontend:**
  - `@testing-library/react` + `jsdom` environment.
  - Co-locate tests next to components (`Foo.tsx` ↔ `Foo.test.tsx`).
  - Test Zod schemas in `frontend/src/utils/validators.ts` directly.
  - Test Zustand stores by hydrating state and asserting on selectors.
- **Backend:**
  - Vitest with `node` environment.
  - Mirror `src/` structure under `tests/` (e.g. `tests/services/postService.test.ts`).
  - Unit-test services with the model layer mocked; integration-test controllers with an in-memory MongoDB (`mongodb-memory-server`).
  - Cover the `errorHandler.ts` middleware paths (ValidationError, CastError, duplicate key, JWT).

## Risks of Current State

- Any refactor is high-risk — no regression net.
- Auth, validation, and error-handler middleware all run in production with no automated coverage.
- Onboarding a contributor means trusting manual smoke testing.

Adding even a thin smoke-test layer over auth + one critical CRUD path would change the risk profile substantially.
