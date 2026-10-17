# STEADFAST-1.0 — Steadfast Purpose & Relationship Planner

> Implementation plan. Source: Preach My Gospel-inspired planning workflow, returned-missionary product concept, and the development approach referenced in the supplied X post: small, agent-assisted vertical slices with automated verification and human review.

## Metadata

| Field | Value |
|---|---|
| **Feature ID** | STEADFAST-1.0 |
| **Section** | Purpose, Planning, and Relationships |
| **Severity** | MAJOR |
| **Markets** | Returned missionaries first; higher education and young adults later |
| **Status (today)** | MISSING |
| **Estimated effort** | XL (>2 months) for a production MVP; M (2–4 weeks) for a local prototype |
| **Owner (proposed)** | Dallas Walker / Steadfast project |
| **Depends on** | Product validation, target repository, visual direction |
| **Unblocks** | Mobile packaging, paid plans, calendar integrations, AI assistant |

---

## 1. Problem Statement

Returned missionaries often lose the structured planning system they used during missionary service. General calendars organize time, but they do not preserve relationship context, follow-up commitments, or the connection between daily actions and personal goals. Existing returned-missionary products validate the need, but Steadfast should differentiate through a polished cross-platform experience, configurable life seasons, privacy, and a people-first calendar.

Steadfast is a private planning and relationship app that helps users plan meaningful activities, remember people, connect actions to goals, and follow through consistently.

The product may be inspired by the workflow of Preach My Gospel, but it MUST use original branding, copy, visual assets, and interaction details. It MUST NOT imply Church sponsorship or copy protected product assets.

## 2. Goals

- Ship a usable responsive web/PWA MVP for phone and computer.
- Make the calendar the primary planning surface.
- Let users connect events, people, notes, follow-ups, and goals.
- Support contact actions for phone, text, email, websites, and maps.
- Make goals configurable for returned missionaries, students, career building, dating, service, spiritual growth, and general intentional living.
- Establish a low-cost architecture that can later support Android and iOS packaging.
- Validate weekly retention and real user value before adding advanced AI or social features.

## 3. Non-Goals

- Reproducing the Preach My Gospel app pixel-for-pixel.
- Using Church logos, official data, or restricted Church systems.
- Building a full sales CRM.
- Building a social network or public directory of contacts.
- Automatically sending messages without explicit user approval.
- Replacing Google Calendar or Apple Calendar in the first release.
- Building advanced AI coaching before the core workflow is reliable.
- Supporting team, companion, or family collaboration in the MVP.

## 4. Personas & User Stories

- **As a returned missionary**, I want a familiar weekly planning rhythm so that I can retain the structure that helped me live intentionally.
- **As a college student**, I want to connect professors, classmates, projects, and deadlines so that important relationships and commitments do not disappear into separate apps.
- **As a person dating**, I want private notes and planned follow-ups so that I can be thoughtful without treating a relationship like a sales pipeline.
- **As a career builder**, I want to remember where I met professional contacts and what I promised to do so that networking becomes genuine follow-through.
- **As a user on Android, iPhone, Pixel, Windows, or Mac**, I want the same account and core workflow everywhere.
- **As a privacy-conscious user**, I want to export or delete my information and understand exactly what Steadfast stores.

## 5. Functional Requirements

### Foundation

- **FR-1.** The system MUST support account creation, sign-in, sign-out, password reset, and account deletion.
- **FR-2.** The system MUST associate all user-created data with an authenticated user.
- **FR-3.** The system MUST use the user’s timezone for calendar rendering, reminders, and date calculations.
- **FR-4.** The system MUST be responsive at phone, tablet, and desktop breakpoints.

### Calendar

- **FR-5.** The system MUST provide month, week, and day calendar views.
- **FR-6.** The system MUST allow users to create, edit, delete, duplicate, and reschedule events.
- **FR-7.** Events MUST support title, start time, end time, all-day state, category, description, location, completion state, and recurrence.
- **FR-8.** Events MUST support links to zero or more people and zero or more goals.
- **FR-9.** The system MUST support event states of planned, completed, missed, and canceled.
- **FR-10.** Recurring events MUST support editing one occurrence, the current and future occurrences, or the entire series.
- **FR-11.** Users MUST be able to create a follow-up task from an event.
- **FR-12.** Calendar interactions MUST be usable with keyboard navigation and touch gestures.

### People and contacts

- **FR-13.** Users MUST be able to create, edit, archive, restore, search, and delete people.
- **FR-14.** A person MUST support name, preferred name, photo, relationship type, phone numbers, email addresses, websites, organization, address, notes, how-met information, and important dates.
- **FR-15.** A person MUST have a timeline of linked events, notes, follow-ups, and memories.
- **FR-16.** The system MUST provide direct action buttons for available phone, text, email, website, and map actions.
- **FR-17.** The system MUST never expose a user’s contacts to another user without an explicit future sharing feature.
- **FR-18.** The system SHOULD support custom relationship types and labels.

### Goals and plans

- **FR-19.** Users MUST be able to create goals with title, reason, category, measurement type, target, deadline, and review cadence.
- **FR-20.** Goals MUST support linked events and manual progress updates.
- **FR-21.** The system MUST support weekly, monthly, semester, yearly, and custom goal periods.
- **FR-22.** Users MUST be able to mark goals as active, paused, completed, abandoned, or archived.
- **FR-23.** The system SHOULD provide configurable life-season templates without locking users into a religious or missionary framework.

### Follow-up

- **FR-24.** Users MUST be able to create a follow-up with person, description, due date, priority, and completion state.
- **FR-25.** The system MUST show due and overdue follow-ups in a focused queue.
- **FR-26.** The system SHOULD suggest a follow-up when a user completes an event linked to a person.
- **FR-27.** Suggestions MUST require user confirmation before creating data or sending communication.

### Notifications and integrations

- **FR-28.** Users MUST be able to configure reminder preferences by feature.
- **FR-29.** The MVP MAY use in-app reminders and browser notifications; push notifications can follow after the PWA workflow is validated.
- **FR-30.** Calendar import/export SHOULD be implemented after the core calendar is stable.
- **FR-31.** Google Calendar and Apple Calendar synchronization MUST be opt-in and MUST clearly distinguish external events from Steadfast-owned events.

### Data portability

- **FR-32.** Users MUST be able to export their data in a documented JSON format.
- **FR-33.** Users MUST be able to export contacts and events in common formats where technically and legally appropriate.
- **FR-34.** Account deletion MUST remove or anonymize user-owned data according to the published retention policy.

## 6. Non-Functional Requirements

- **Performance** — p95 authenticated page/API response under 500 ms for normal CRUD operations; initial usable calendar render under 2.5 seconds on a typical mobile connection.
- **Security** — server-side authorization on every user-owned query; never trust user IDs from the client; secure cookies or short-lived tokens; rate-limit authentication, exports, and AI endpoints.
- **Privacy & Compliance** — collect only necessary personal data; publish privacy policy and terms before public launch; provide deletion/export controls; conduct a legal review before paid launch. Do not make medical, therapeutic, or guaranteed relationship claims.
- **Accessibility** — target WCAG 2.1 AA; visible focus states; keyboard calendar navigation; screen-reader labels; sufficient color contrast; do not use color as the only event-state indicator.
- **Scalability** — design for 1,000 pilot users and a later path to 100,000 users without rewriting the domain model.
- **Reliability** — CRUD operations MUST be idempotent where practical; failed saves MUST preserve unsaved user input; reminders MUST tolerate duplicate delivery.
- **Observability** — capture request latency, error rate, sync failures, notification outcomes, and product events without logging contact notes or private journal content.
- **Maintainability** — feature modules MUST separate UI, domain logic, persistence, and integrations; shared types MUST be generated or centrally defined.
- **Internationalization** — externalize user-facing strings; store timestamps in UTC with an IANA timezone per user; support locale-aware dates and week starts.
- **Backward compatibility** — database migrations MUST be reversible or have a documented recovery path; API changes MUST be versioned or backward compatible.

## 7. Acceptance Criteria

- **AC-1.** *Given* an authenticated user on a phone, *when* they create an event in day view, *then* it appears in day, week, and month views without a page reload.
- **AC-2.** *Given* an event linked to a person, *when* the user opens the event, *then* they can open the person’s phone, text, email, website, or map action when that data exists.
- **AC-3.** *Given* a recurring event, *when* the user edits only one occurrence, *then* other occurrences remain unchanged.
- **AC-4.** *Given* a person with linked events and notes, *when* the user opens the person profile, *then* the timeline is ordered newest-first and each item links to its source.
- **AC-5.** *Given* a goal, *when* the user links and completes an event, *then* the goal progress reflects the configured measurement behavior.
- **AC-6.** *Given* an overdue follow-up, *when* the user opens the home screen, *then* it appears in the follow-up queue with a clear action to complete, snooze, or reschedule it.
- **AC-7.** *Given* a user with data on two devices, *when* they create or edit an item on one device, *then* the other device receives the change after synchronization.
- **AC-8.** *Given* a user attempts to access another user’s person ID or event ID, *when* the request reaches the server, *then* it is rejected and creates no data leak.
- **AC-9.** *Given* a user requests an export, *when* the export is ready, *then* it contains only that user’s data in the documented format.
- **AC-10.** *Given* a keyboard-only user, *when* they navigate the calendar and create an event, *then* all controls are reachable, labeled, and operable without a mouse.
- **AC-11.** *Given* a user on a narrow mobile viewport, *when* they use the calendar, *then* no critical action is hidden behind horizontal overflow or inaccessible hover behavior.
- **AC-12.** *Given* an AI suggestion in a future release, *when* it proposes a contact or follow-up, *then* no record or outbound communication is created until the user confirms it.

## 8. Data Model

Initial tables/entities:

- `users`: id, email, display_name, timezone, locale, created_at, updated_at.
- `user_preferences`: user_id, week_start, reminder_settings, default_view, theme, life_season.
- `events`: id, user_id, title, description, starts_at, ends_at, timezone, all_day, status, category_id, recurrence_rule, location_id, created_at, updated_at.
- `event_exceptions`: event_id, occurrence_at, overridden_fields, status.
- `people`: id, user_id, display_name, preferred_name, relationship_type, organization, how_met, notes, archived_at, created_at, updated_at.
- `person_methods`: id, person_id, type, label, value, is_primary.
- `person_dates`: id, person_id, type, date, reminder_offset.
- `person_timeline_items`: id, person_id, event_id, type, body, occurred_at, created_at.
- `goals`: id, user_id, title, reason, category, measurement_type, target_value, current_value, period, starts_on, due_on, status, created_at, updated_at.
- `event_people`: event_id, person_id.
- `event_goals`: event_id, goal_id.
- `follow_ups`: id, user_id, person_id, event_id, goal_id, description, due_at, priority, status, completed_at, snoozed_until.
- `categories`: id, user_id, name, color, icon, archived_at.
- `audit_events`: id, user_id, action, entity_type, entity_id, created_at; no private note body.

Constraints:

- Every user-owned entity MUST have a user ID and server-enforced ownership.
- Phone/email values MUST be treated as sensitive user data.
- Add indexes for `(user_id, starts_at)`, `(user_id, due_at, status)`, `(user_id, archived_at)`, and foreign-key joins.
- Use soft deletion only where it supports recovery; permanently delete data on account deletion according to policy.

## 9. API Surface

Suggested REST routes or equivalent typed RPC procedures:

- `POST /api/auth/*`
- `GET|POST /api/events`
- `GET|PATCH|DELETE /api/events/:id`
- `POST /api/events/:id/complete`
- `GET|POST /api/people`
- `GET|PATCH|DELETE /api/people/:id`
- `POST /api/people/:id/timeline`
- `GET|POST /api/goals`
- `GET|PATCH|DELETE /api/goals/:id`
- `GET|POST /api/follow-ups`
- `PATCH|DELETE /api/follow-ups/:id`
- `GET|POST /api/categories`
- `POST /api/exports`
- `GET /api/exports/:id`

Requirements:

- Every route MUST authorize against the authenticated user.
- Request bodies MUST be schema-validated.
- Errors MUST return stable machine-readable codes and user-safe messages.
- Mutating requests SHOULD support idempotency keys where retries could duplicate events or follow-ups.
- OpenAPI or generated API documentation MUST be updated with each public route.

## 10. UI / UX

### Primary navigation

- Home / Today
- Planner
- People
- Goals
- Follow-ups
- Settings

### Core flows

1. Onboarding: choose life season, timezone, week start, reminder defaults, and optional starter goals.
2. Planner: swipe or navigate between dates; create an event; attach people/goals; mark result.
3. Person: add a contact; choose relationship type; save how-met context; add a future follow-up.
4. Goal: define desired outcome; connect calendar actions; review progress.
5. Follow-up: review due items; call, text, email, complete, snooze, or reschedule.
6. Weekly review: inspect completed/missed plans, people contacted, goal progress, and next-week priorities.

### Required states

- Empty calendar with a useful first-event prompt.
- Empty people list with import/manual-add choices.
- Loading skeletons for calendar and profiles.
- Offline/read-only or offline-queue state when connectivity is lost.
- Conflict state when the same record changes on two devices.
- Error state with retry and preservation of entered form data.
- Confirmation before destructive deletion.

### Visual direction

- Create an original Steadfast design system rather than copying Preach My Gospel screens.
- Preserve the useful concepts: weekly planning, clear categories, people attached to activities, and visible goals.
- Use a calm, purposeful visual identity; avoid overly corporate CRM styling and avoid implying official Church affiliation.
- Design touch targets at least 44×44 CSS pixels and provide text labels for icon-only actions.

## 11. AI / ML Considerations

AI is post-MVP. Potential later capabilities:

- Convert a user’s note into a proposed person, event, and follow-up.
- Summarize a person’s timeline before a meeting.
- Suggest a realistic weekly plan from active goals and fixed calendar events.
- Detect duplicate people locally or through a privacy-preserving workflow.

AI requirements:

- No autonomous messages, calls, or calendar changes.
- Display proposed actions before execution.
- Redact or minimize PII where possible.
- Make AI optional and provide a non-AI fallback.
- Track cost per active user and enforce a monthly budget.
- Evaluate extraction accuracy, false suggestions, latency, and user approval rate.

## 12. Integration Points

- Authentication provider.
- PostgreSQL-compatible database.
- Email service for authentication and optional reminders.
- Browser/mobile notification services.
- Google Calendar and Apple Calendar after MVP validation.
- Operating-system URL schemes for phone, SMS, email, browser, and maps.
- Optional analytics that exclude private note content.

The initial implementation SHOULD use a responsive Next.js/TypeScript app with a PostgreSQL backend and a shared domain model. A PWA-first approach minimizes cost and validates the product before native app-store work.

## 13. Dependencies & Sequencing

### Phase 0 — Validation and product definition

- Confirm the name is legally and commercially usable; “Steadfast” is already used by multiple apps and websites, so perform trademark, domain, and app-store checks.
- Interview at least 15 target users.
- Test a clickable calendar/contact prototype.
- Choose the target repository and deployment environment.

### Phase 1 — Foundation

- Repository, CI, environment configuration, database, migrations, authentication, error handling, design tokens, and test harness.

### Phase 2 — Vertical slice: person to follow-up

- Create person → save how-met note → create follow-up → open contact action → complete follow-up.

### Phase 3 — Vertical slice: calendar to goal

- Create event → attach person and goal → complete event → update goal progress → show in weekly review.

### Phase 4 — MVP completion

- Month/week/day views, recurrence, search, categories, exports, responsive polish, accessibility, offline/error states, and pilot onboarding.

### Phase 5 — Pilot and validation

- Invite 20–50 users; measure activation, weekly retention, completed follow-ups, and calendar usage.

### Phase 6 — Post-MVP

- Calendar synchronization, push notifications, native packaging, AI capture, maps, journaling, and paid plans.

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Product is too similar to existing RM apps | H | H | Focus differentiation on cross-platform quality, people-first workflow, privacy, and adaptable life seasons. |
| Exact visual copying creates IP/brand problems | M | H | Use original design system, copy, assets, naming, and legal review. |
| Users do not maintain contact notes | H | H | Minimize entry friction; allow quick capture; add AI suggestions only after consent. |
| Feature scope becomes too large | H | H | Enforce MVP gates and build vertical slices. |
| Users already rely on Apple/Google Calendar | H | M | Integrate with existing calendars instead of replacing them. |
| Sensitive relationship data is exposed | M | H | Strong authorization tests, encryption in transit/at rest, minimal logs, export/delete controls, and security review. |
| App-store packaging consumes too much time | M | M | Launch PWA first; use native packaging after retention is proven. |
| Subscription price is not justified | M | M | Keep a useful free tier and validate willingness to pay with pilot users before building premium-only features. |
| Name conflict or trademark issue | M | H | Check USPTO, app stores, domains, and social handles before public branding. |

## 15. Rollout Plan

- **Feature flag:** `steadfast_mvp_enabled`.
- **Development:** local-only seed data and test accounts.
- **Alpha:** Dallas plus 3–5 trusted returned missionaries.
- **Pilot:** 20–50 users across returned missionaries and BYU–Idaho students.
- **Beta criteria:** no critical authorization issues; core flows pass end-to-end tests; calendar and contact data survive refresh and device changes; users can export/delete data.
- **GA criteria:** at least four weeks of pilot feedback, stable error rates, documented privacy policy, support process, and confirmed product name.
- **Rollback:** disable new feature flag, preserve database migrations, and retain exportable user data. Never roll back by destructive database reset.

## 16. Test Plan

- **Unit** — recurrence calculations, timezone conversion, goal progress, contact-action URL generation, validation, and permission helpers.
- **Integration** — database ownership filters, event/person/goal linking, recurring-event exceptions, exports, and account deletion.
- **End-to-end** — onboarding, create/edit/complete event, create person, attach person to event, create follow-up, goal progress, responsive mobile flow, and keyboard navigation using Playwright.
- **Security** — cross-user IDOR tests, authentication abuse, rate limits, export authorization, sensitive logging checks, and OWASP-relevant API tests.
- **Accessibility** — axe checks, keyboard-only calendar flow, focus restoration after dialogs, screen-reader labels, contrast, and reduced-motion behavior.
- **Performance / load** — seeded users with 1,000 events and 500 people; p95 calendar queries under 500 ms; test concurrent pilot traffic.
- **Manual exploratory** — timezone changes, DST transitions, offline edits, duplicate contacts, recurring-event edits, narrow screens, large text, and interrupted saves.

### Agent-assisted development workflow

Each implementation slice SHOULD follow this loop:

1. Write or update the acceptance criteria.
2. Ask an agent to inspect only the relevant files and propose a small change.
3. Implement one vertical slice with tests.
4. Run type checks, lint, unit tests, integration tests, and targeted Playwright tests.
5. Review the diff manually for security, data ownership, UX, and scope.
6. Commit one coherent change with a clear message.
7. Deploy to a preview environment and manually use the flow on phone and desktop.
8. Record discovered defects as separate tasks instead of expanding the current slice.

High PR volume is not itself a quality metric. Steadfast should optimize for small reversible changes, working software, verified behavior, and user feedback.

## 17. Documentation & Training

- Product README with setup and architecture.
- `docs/PRODUCT_SPEC.md` for user-facing behavior.
- `docs/DESIGN_SYSTEM.md` for original Steadfast UI rules.
- `docs/SECURITY.md` for authorization and privacy decisions.
- `docs/TEST_STRATEGY.md` for automated and manual QA.
- `docs/ROADMAP.md` for phase gates.
- End-user help for calendar, contacts, goals, follow-ups, exports, and deletion.
- Pilot feedback form and changelog.

## 18. Open Questions

1. Is the first public audience returned missionaries only, or returned missionaries plus BYU–Idaho students?
2. Should the product include optional spiritual goals at launch, or add them through a configurable life-season template?
3. Which database/auth/hosting stack will be used for the first repository?
4. Should Steadfast own calendar events, import external events, or sync bidirectionally?
5. What is the minimum free contact and event limit?
6. Is the final brand “Steadfast,” “Steadfast Planner,” or another available variation?
7. Will the app support offline editing in the MVP or only offline read access?
8. Which reminder channels are acceptable for sensitive relationship information?
9. What does the first 20-user pilot consider a successful week?
10. Which features are valuable enough for a paid plan?

## 19. References

- Plan template: `https://github.com/StudyDrift/lextures/blob/main/docs/plan/_TEMPLATE.md`
- Preach My Gospel app context: `https://play.google.com/store/apps/details?id=org.churchofjesuschrist.areabook`
- Live My Gospel: `https://www.livemygospel.com/`
- Strive Planner: `https://striveplanner.app/`
- Currant: `https://mycurrant.app/`
- Post-Mission Planner: `https://postmissionplanner.com/`
- Supplied development reference: `https://x.com/poteto/status/2102050467505430555?s=20`
- Related planning principles: `https://www.churchofjesuschrist.org/study/manual/preach-my-gospel-2023/16-chapter-8?lang=eng`

