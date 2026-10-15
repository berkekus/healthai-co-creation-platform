# HealthCoCreate Functional and Automation Test Report

**Test date:** 2 September 2026  
**Environment:** https://www.healthcocreate.com/  
**Test method:** Authenticated browser MCP automation and manual DOM/state verification  
**Data safety:** No post, meeting request, comment, draft, profile edit, or account deletion was submitted.

## Executive Summary

The main authenticated flows are reachable and the core validation logic works. The most important fix is the mismatch between the platform's institutional-email policy and the existing partner account domain. Several UX and data-quality issues should also be addressed before wider partner testing.

## Test Coverage

| ID | Area | Test | Result |
|---|---|---|---|
| T01 | Public site | Home page, navigation, public CTAs and footer links load | PASS |
| T02 | Registration | Empty required fields show validation messages | PASS |
| T03 | Registration | Password length and confirmation mismatch validation | PASS |
| T04 | Registration | Institutional email policy check with `@universum-ks.org` | FAIL / POLICY BLOCK |
| T05 | Authentication | Login with authorised existing account | PASS |
| T06 | Authentication | Logout returns to login page | PASS |
| T07 | Dashboard | Dashboard loads account, overview, and onboarding links | PASS |
| T08 | Profile | Profile view, edit mode, and cancel without saving | PASS |
| T09 | Directory | Opportunities load and pagination displays correctly | PASS |
| T10 | Directory | Keyword search for `cardiology` filters results | PASS |
| T11 | Directory | Domain, project-stage, and sort controls update results | PASS |
| T12 | Directory | Clear filters restores the default result set | PASS |
| T13 | Directory | Grid/list view toggle | PASS |
| T14 | Post creation | Empty form validation for title, domain, expertise, description, collaboration type, location, and expiry date | PASS |
| T15 | Post creation | Form opens through dashboard navigation | PASS |
| T16 | Opportunity detail | Detail page, Share/copy link, PDF action, and discussion state | PASS |
| T17 | Meeting request | Empty message validation at minimum 20 characters | PASS |
| T18 | Meeting request | Message step advances to NDA step | PASS |
| T19 | Meeting request | NDA checkbox blocks continuation until accepted | PASS |
| T20 | Meeting request | NDA step advances to three time-slot step | PASS, UX ISSUE |
| T21 | Meetings | Empty-state filters and calendar render | PASS |
| T22 | Notifications | Empty state and notification categories render | PASS |
| T23 | Chat | Empty conversation state and link to messages render | PASS |
| T24 | Language | Language menu opens and Turkish/English switching works | PASS |
| T25 | Protected routes | Authenticated navigation remains available for dashboard/profile/posts/meetings | PASS |
| T26 | Profile country list | Search for `Kosovo` in `Profile > Edit profile > Country` | FAIL |
| T27 | Post country list | Search for `Kosovo` in `Post an opportunity > Where & when > Country` | FAIL |
| T28 | Access control | Logged-out access to dashboard, profile, new post, meetings, and messages | PASS |
| T29 | Security UX | NDA checkbox blocks meeting workflow until consent is selected | PASS |
| T30 | Security copy | Privacy policy and authentication email-domain rules are consistent | FAIL |
| T31 | Security copy | Privacy policy data-transfer statement matches the deployed architecture | FAIL |

## Findings to Fix

### F01 - Institutional email policy blocks a partner domain

**Severity:** High  
**Reproduction:** Open `/register`, enter an institutional address ending in `@universum-ks.org`, and continue.  
**Observed:** The form states that only `.edu` or `.gov` addresses are accepted. The same existing partner account can log in with the `.org` domain.  
**Impact:** Partner institutions using legitimate `.org` domains cannot register new users. This conflicts with the platform's European-institution collaboration goal.  
**Recommendation:** Use a configurable allow-list for verified partner domains, or change the policy and copy consistently. Show a clear support path when a domain is not yet approved.

### F02 - Institution and email copy is inconsistent

**Severity:** Medium  
**Observed:** The homepage refers to institutional `.edu` verification, while registration and login refer to `.edu or .gov`. The profile displays an `.org` email but labels the field `.edu / .gov`.  
**Recommendation:** Define one policy and use the same wording on homepage, registration, login, profile, and privacy pages.

### F03 - Profile role and location require verification

**Severity:** Medium  
**Observed:** The tested profile shows `Engineer`, `Tirana, Albania`, no biography, and no expertise tags. The profile edit form does not expose a role field.  
**Impact:** Incorrect or incomplete data reduces matching quality and may misrepresent the user's institution or professional identity.  
**Recommendation:** Confirm imported/default values, allow role correction where appropriate, and make the first-login profile completion flow explicit.

### F04 - Meeting request send button appears active with no time slots

**Severity:** High  
**Reproduction:** Open an active opportunity, choose `Schedule a Meeting`, enter a valid message, accept the NDA, and reach `Propose times`.  
**Observed:** The screen displays `0 / 3 filled`, but `Send request` appears enabled. The test did not click it to avoid creating a real request.  
**Impact:** Users may submit an incomplete request, or the UI may allow an invalid payload.  
**Recommendation:** Disable `Send request` until all required slots are valid, and also enforce the same rule server-side. Show an inline message explaining the remaining required slots.

### F05 - Meeting validation copy is unclear

**Severity:** Low  
**Observed:** The first step displays `0 / 20 min characters`.  
**Recommendation:** Replace with `Minimum 20 characters` and a clear counter such as `0 / 500 characters`.

### F06 - Directory contains low-quality seed content

**Severity:** Medium  
**Observed:** One Turkish opportunity has spelling/grammar problems and appears mismatched with the selected cardiology domain.  
**Recommendation:** Review seed data, add moderation or preview checks, and validate the domain/content relationship before publishing.

### F07 - Matching status is difficult to interpret

**Severity:** Medium  
**Observed:** Directory results show `AI-ranked for your profile`, `AI fallback ranking active`, and repeated `Profile match · 22%` while the tested profile has no expertise tags.  
**Recommendation:** Explain when fallback ranking is used, avoid implying a personalised match when the profile is incomplete, and show the fields that contributed to the score.

### F08 - Some icon-only controls have no accessible name

**Severity:** Low  
**Observed:** The meetings calendar includes several buttons without accessible labels in the rendered accessibility tree.  
**Recommendation:** Add accessible names such as `Previous month`, `Next month`, and `Close calendar` and verify with an automated accessibility scan.

### F09 - Kosovo is missing from country selectors

**Severity:** High  
**Reproduction:** Open the profile country selector and search for `Kosovo`. Repeat in the new-post country selector.  
**Observed:** Both selectors return `No results for "Kosovo"`. The country list is shared or appears to use the same incomplete country dataset.  
**Impact:** Users and opportunities from Kosovo cannot be represented correctly. They may be forced to choose the wrong country, which affects identity, location filtering, matching, reporting, and institutional collaboration.  
**Recommendation:** Add Kosovo to the canonical country dataset using the product's agreed naming and code, for example `Kosovo` / ISO 3166-1 alpha-2 `XK` if the product uses that convention. Verify the complete list against an authoritative country dataset and retest both selectors.

### F10 - Privacy policy email-domain rule conflicts with the application

**Severity:** Medium  
**Observed:** The privacy policy says account data uses an institutional email `.edu only`, while login and registration text refer to `.edu or .gov`; the existing partner account uses `.org`.  
**Impact:** Users and administrators cannot determine which accounts are permitted, and the legal notice does not match the implemented validation.  
**Recommendation:** Align the policy, UI, backend allow-list, and partner-domain process. Include the approved partner-domain rule in one maintained configuration and one consistent user-facing explanation.

### F11 - Privacy policy deployment statement may be inaccurate

**Severity:** High  
**Observed:** The privacy page says the platform is a demo running locally and that no data is transferred outside the browser session, but the deployed site supports server-side authentication, profile storage, posts, meetings, notifications, and security logs including IP/login events.  
**Impact:** This can create an inaccurate privacy and data-transfer statement for real users and project reviewers.  
**Recommendation:** Confirm the actual hosting, processing locations, processors, retention, and transfer controls, then update the privacy policy and deployment banner to describe the live architecture. Obtain a legal/privacy review before production use.

## Recommended Fix Order

1. Resolve the domain allow-list and align all institutional-email copy.
2. Enforce three valid meeting slots in both UI and backend validation.
3. Verify profile defaults and add role/profile completion controls.
4. Improve fallback-ranking explanation and matching-state wording.
5. Clean seed content and add content moderation checks.
6. Add Kosovo and verify the complete country dataset in every selector.
7. Align privacy policy statements with the implemented authentication, email-domain, hosting, and logging behavior.
8. Correct meeting copy and unnamed calendar controls.

## Regression Test Checklist After Fixes

- Register successfully with each approved partner domain.
- Confirm an unapproved domain receives a clear, actionable message.
- Confirm profile email policy text is identical across all screens.
- Confirm `Send request` is disabled at 0/3 and 2/3 slots.
- Confirm invalid dates/times are rejected and past slots cannot be submitted.
- Confirm a completed request creates exactly one meeting and one notification.
- Confirm profile role, institution, country, city, bio, and expertise persist after refresh.
- Confirm incomplete profiles show fallback ranking with an explanatory label.
- Confirm Kosovo and every approved country can be selected in profile and post forms.
- Confirm privacy policy domain, hosting, logging, and retention statements match production behavior.
- Confirm all calendar and icon-only buttons have accessible names.
- Re-run search, filters, sort, pagination, language switching, logout, and protected-route tests.
