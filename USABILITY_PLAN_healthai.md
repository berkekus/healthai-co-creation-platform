# HealthAI — Usability Test Plan

## 1. Test objectives

1. Measure whether clinicians and engineers can register and complete email verification without assistance.
2. Measure whether users can find a relevant collaboration post and understand its status and confidentiality.
3. Measure whether a user can submit and progress a meeting request with the NDA and three time slots.
4. Measure whether participants can locate messages, notifications and account/security actions.
5. Identify language, navigation, accessibility and recovery problems in the administrator flow.

## 2. Method

Use a moderated, remote **task-based user test** with think-aloud observation, followed by the questionnaire below. Perform the expert walkthrough in `HEURISTIC_EVAL_healthai.md` first to focus the sessions on high-risk tasks.

## 3. Participants

Recruit **5 participants**: two healthcare professionals, two engineers and one administrator/moderator-equivalent. Include a mix of first-time, occasional and frequent users; vary age, education and computer/internet confidence. Five participants are the first target because the course guidance cites Virzi (1990/1992) and Nielsen (1993): a small diverse sample can reveal most recurring usability issues. Recruit more if severe issues still appear after five sessions.

## 4. Demographic information form

1. Education level:
2. Age:
3. Computer-use level: ☐ Insufficient ☐ Partially sufficient ☐ Sufficient
4. Internet-use level: ☐ Insufficient ☐ Partially sufficient ☐ Sufficient
5. Do you know the current software/product? ☐ Yes ☐ No

## 5. Pre-test questions

1. Which role best describes you in a research collaboration?
2. Have you used an online professional directory or meeting-request system before?
3. On which device and browser do you normally perform this kind of work?
4. Do you use a keyboard, screen reader, zoom or other assistive technology?

## 6. Task scenarios

Do not reveal the route, button name or solution to participants.

1. You have been invited to collaborate on a clinical AI project. Create an account that matches your professional role and determine what is required before you can use the platform.
2. Find a collaboration opportunity relevant to your expertise in a chosen city/country and decide whether its status permits a response.
3. Send a collaboration request for an eligible post. Make sure the request satisfies the platform's confidentiality and scheduling expectations.
4. As a post owner, review an incoming request and progress it to a confirmed meeting time.
5. Find the conversation created after a confirmed meeting and send a short follow-up message.
6. Change a notification preference and locate the place to change account security information.
7. As an administrator, find a pending verification and remove a post that violates policy. Explain what you expect to happen before confirming the removal.

## 7. Test environment

- Prefer each participant's natural work setting and usual device; record device, browser, connection quality, background noise, lighting and interruptions.
- Run one pilot in a quiet remote call and one in a realistic workplace/home environment before the main sessions.
- Use a separate test database and non-production accounts. Never collect patient data or real credentials.
- Record screen and audio only with explicit consent; redact e-mail addresses and delete recordings after analysis.

## 8. Pilot test checklist

Run two consecutive pilots and redesign the test if either exposes a problem.

- [ ] Are pre-test questions clear?
- [ ] Are tasks well defined but free of solution hints?
- [ ] How long is the short introduction?
- [ ] Is there any technical blocker?
- [ ] Are final survey questions clear?
- [ ] Is the question order appropriate?

## 9. Facilitation procedure

1. Explain the purpose, obtain volunteer participation consent and state that the product—not the participant—is being tested.
2. Collect the demographic form.
3. Give a two-minute basic orientation only; do not demonstrate the task solutions.
4. Present tasks one at a time. Ask the participant to think aloud; do not rescue them until they abandon a task.
5. Record completion, elapsed time, errors, assistance requests, quotes and observed recovery behaviour.
6. Conduct the post-test questionnaire and a short open-ended interview.

## 10. Metrics and success criteria

| Metric | Calculation | Target |
| --- | --- | --- |
| Task completion rate | completed tasks / attempted tasks | ≥ 80% |
| Task time | seconds per task | establish baseline in pilot, then reduce outliers |
| Error count | errors / participant | < 2 per core task |
| SUS score (optional) | standard 0–100 calculation | ≥ 68 |
| Subjective satisfaction | mean of post-test 1–3 ratings | > 2.0 / 3 |

## 11. Post-test questionnaire

1. Finding the information you needed: ☐ Difficult ☐ Normal ☐ Easy
2. Help and documentation: ☐ Insufficient ☐ Partially sufficient ☐ Sufficient
3. Aesthetic features (icons, colour, font): ☐ Bad ☐ Normal ☐ Good
4. System language: ☐ Incomprehensible ☐ Partially understandable ☐ Understandable
5. System speed: ☐ Slow ☐ Normal ☐ Fast
6. Learning and use: ☐ Difficult ☐ Normal ☐ Easy
7. Memorability of use: ☐ Easy ☐ Partially ☐ Not easy
8. Error-prevention guidance: ☐ Available ☐ Partially available ☐ Not available
9. Feeling lost in the system: ☐ Experienced ☐ Partly experienced ☐ Not experienced
10. Information messages / transaction status: ☐ Sufficient ☐ Partially ☐ Not sufficient
11. Error messages / recovery guidance: ☐ Sufficient ☐ Partially ☐ Not sufficient
12. Which tasks were most difficult? Why?
13. What did you find missing or incorrect?

## 12. Reporting format

For each finding, record task, participant count, completion/time/error evidence, severity (0–4), representative quote, recommended fix and owner. Prioritize severity 3–4 items before a new release, then retest affected tasks with at least two participants.

## 13. Known gaps

This plan does not replace security, performance, penetration or accessibility testing. It also cannot claim real-user results until the five sessions are completed.
