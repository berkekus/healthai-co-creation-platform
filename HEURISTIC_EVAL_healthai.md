# HealthAI — Expert Usability Evaluation

**Method:** source-based heuristic walkthrough of the public landing page, authentication, post/meeting flows, navigation and admin area. This is an expert review, not a substitute for sessions with real clinicians and engineers.

## Scope and severity

Severity uses Nielsen's 0–4 scale. WCAG observations require browser-based contrast and keyboard checks before release.

| Severity | Count |
| --- | ---: |
| 4 — Catastrophic | 0 |
| 3 — Major | 2 |
| 2 — Minor | 12 |
| 1 — Cosmetic | 2 |

## Findings

| # | Heuristic | Finding | Location | Severity | Recommended fix | Evidence |
| --- | --- | --- | ---: | --- | --- | --- |
| H1 | H1 — Visibility of system status | The pending-verification fetch has a loading state, but its failure path has no visible retry/action state in the admin view. A user may see an empty area after a network failure. | `frontend/src/pages/admin/AdminPage.tsx` | 2 | Keep an error state next to loading and offer **Retry**. | Nielsen H1; Alan Dix observability/responsiveness |
| H2 | H1 — Visibility of system status | The resend confirmation on email verification is only a small, low-emphasis inline message; it can be missed after a long wait. | `frontend/src/pages/auth/VerifyEmailPage.tsx` | 1 | Use a status region with the destination address and expected delivery time. | Nielsen H1 |
| H3 | H2 — Match with the real world | Public footer labels are hard-coded in English while the product has Turkish and other locales. | `frontend/src/components/layout/Footer.tsx` | 2 | Move footer copy into the locale files and use `t(...)`. | Nielsen H2; Alan Dix familiarity |
| H4 | H2 — Match with the real world | The access-denied screen presents technical shorthand (`Err · 403`) before the user-oriented explanation. | `frontend/src/pages/errors/UnauthorizedPage.tsx` | 2 | Make the plain-language reason primary; keep the code as secondary support information. | Nielsen H2 |
| H5 | H3 — User control and freedom | Successful email verification automatically moves the user to Dashboard after 1.8 seconds, before they necessarily finish reading the confirmation. | `frontend/src/pages/auth/VerifyEmailPage.tsx` | 2 | Do not auto-redirect, or add a visible **Stay on this page** control and longer countdown. | Nielsen H3; Alan Dix recoverability |
| H6 | H3 — User control and freedom | “Go back” on the 403 page uses browser history. It can return the user to the same protected route and create a loop. | `frontend/src/pages/errors/UnauthorizedPage.tsx` | 2 | If the prior route is unavailable, route directly to Dashboard/Login and label the action accordingly. | Nielsen H3 |
| H7 | H4 — Consistency and standards | Admin registration dates force the `en-US` locale even when the application language is Turkish or another supported locale. | `frontend/src/pages/admin/AdminPage.tsx` | 2 | Format dates with the active i18n locale. | Nielsen H4; Alan Dix consistency |
| H8 | H4 — Consistency and standards | The landing page mixes localized copy with several literal English strings, creating inconsistent language switching. | `frontend/src/pages/LandingPage.tsx` | 2 | Move all visible literal copy into locale keys; add an automated missing-key check. | Nielsen H4 |
| H9 | H5 — Error prevention | Removing a post from the admin view calls the destructive action directly; unlike deleting a user, it has no confirmation. | `frontend/src/pages/admin/AdminPage.tsx` | 3 | Add a confirmation dialog that identifies the post and explains that the action cannot be undone. | Nielsen H5 |
| H10 | H5 — Error prevention | Password reset only states the eight-character minimum after submission; it does not show requirements while choosing a password. | `frontend/src/pages/auth/ResetPasswordPage.tsx` | 2 | Show password rules and live match/strength feedback before submit. | Nielsen H5 |
| H11 | H6 — Recognition rather than recall | The desktop admin sidebar hides its text labels until pointer hover. Keyboard and touch users must infer icon meaning. | `frontend/src/pages/admin/AdminPage.tsx` | 3 | Keep labels visible, or expand on keyboard focus (`:focus-within`) and include accessible names. | Nielsen H6; WCAG 2.4.7 focus visible |
| H12 | H7 — Flexibility and efficiency | The mobile admin section switcher is a horizontally scrolling row of buttons without tab semantics or a selected-state announcement. | `frontend/src/pages/admin/AdminPage.tsx` | 2 | Use `role="tablist"`, `role="tab"`, `aria-selected`, and keyboard arrow navigation. | Nielsen H7; WCAG 4.1.2 |
| H13 | H7 — Flexibility and efficiency | Admin lists are fixed-size and client-side filtered; there is no explicit “results per page” control for frequent moderation work. | `frontend/src/pages/admin/AdminPage.tsx` | 1 | Add a compact page-size selector and preserve filter state in the URL. | Nielsen H7; Alan Dix customizability |
| H14 | H8 — Aesthetic and minimalist design | The landing page contains multiple dense promotional/feature sections before users reach task-oriented actions. | `frontend/src/pages/LandingPage.tsx` | 2 | Prioritize one primary action and collapse secondary narrative content on smaller viewports. Validate with task time. | Nielsen H8 |
| H15 | H9 — Error recovery | Admin request failures are surfaced through blocking browser `alert()` messages, which do not retain context or provide recovery actions. | `frontend/src/pages/admin/AdminPage.tsx` | 2 | Replace with inline/toast errors that name the failed action and offer Retry. | Nielsen H9; Alan Dix recoverability |
| H16 | H10 — Help and documentation | There is no general user-facing help/FAQ entry point in the shared footer/navigation; only the admin area exposes support contact. | `frontend/src/components/layout/Footer.tsx` | 2 | Add Help/FAQ and Contact links covering verification, posts, NDA and meetings. | Nielsen H10 |

## Positive observations

- Authentication, post and password-reset screens expose loading, success and error states in the main flow.
- Form fields use visible labels and inline validation messages; post cards support keyboard activation.
- Destructive user deletion already uses an explicit confirmation dialog.

## Priority backlog

1. Add confirmation before admin post removal and make the desktop sidebar usable without hover.
2. Localize all footer/landing/admin date content.
3. Remove automatic redirects after verification/reset success and replace browser alerts with recoverable inline feedback.
4. Run the participant test plan in `USABILITY_PLAN_healthai.md`; verify keyboard navigation and WCAG AA contrast in a browser.

## Limitations

No production account, real participant, assistive-technology session, mobile-device matrix or live network latency was available. Findings marked WCAG-related are source-informed hypotheses and require manual browser validation.
