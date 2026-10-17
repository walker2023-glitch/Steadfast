# Shared Steadfast for Roommates — Architecture Plan

_Planning document only. No backend, authentication, database code, payments, or new UI are introduced by this document. It describes the recommended path from the current local-first prototype (commit `63da050`, `APP_VERSION 1.0.0`) to a multi-user app where roommates share a household._

**Related docs:** [`docs/CURRENT_STATUS.md`](./CURRENT_STATUS.md) · [`STEADFAST_IMPLEMENTATION_PLAN.md`](../STEADFAST_IMPLEMENTATION_PLAN.md)

---

## 0. Starting point (what exists today)

- **Frontend:** one vanilla-JS IIFE (`app.js`, ~2,080 lines) that renders templates into `#root` and re-binds events after each `render()`. No framework, no build step, no dependencies.
- **Assets:** `index.html` loads `app.js`/`styles.css` with a fixed `?v=1.0.0` cache-busting query. `styles.css` holds the Steadfast design system (navy `#173f5f`, teal `#2b8a88`, category accents).
- **"Server":** `server.js` is a dev-only, dependency-free static file server that sends `Cache-Control: no-store`. It is **not** an application/API server.
- **Data:** everything lives in `localStorage` under `steadfast-*-v2` keys (`events`, `people`, `goals`, `followups`, `reviews`, `prefs`), loaded through normalizers with legacy-key migration. All data is per-browser-profile and single-user.

The key architectural gap for roommate sharing: there is no server, no identity, and no authorization — three things sharing fundamentally requires.

---

## 1. Recommended architecture

Adopt a **thin-backend, Backend-as-a-Service (BaaS)** model rather than building a custom server from scratch:

```
┌─────────────────────────┐       HTTPS / WebSocket
│  Steadfast web client    │  ◄──────────────────────────►  ┌────────────────────────┐
│  (static SPA/PWA)        │                                 │  Supabase project       │
│                          │   - Auth (JWT in client)        │  - Postgres + RLS       │
│  UI render layer         │   - PostgREST data API          │  - Auth (GoTrue)        │
│  domain logic            │   - Realtime subscriptions      │  - Realtime             │
│  ▼                       │   - Storage (future: photos)    │  - Row Level Security   │
│  data-access layer ──────┼────────────────────────────────┤  - Scheduled backups    │
│  (repository interface)  │                                 └────────────────────────┘
│   ├─ LocalStore (now)    │
│   └─ CloudStore (later)  │
└─────────────────────────┘
```

Core principles:

1. **Insert a data-access layer (repository pattern) between the UI and storage.** The UI should call `store.events.list()` / `store.events.create()` etc., never `localStorage` directly. This single seam makes the eventual cloud swap a localized change instead of a rewrite.
2. **Keep the client authoritative for rendering, make the server authoritative for truth and permissions.** Never trust IDs or ownership claims from the client.
3. **Enforce access control in the database (Row Level Security), not just in the UI.** The UI hides what you can't do; RLS guarantees it.
4. **Offline-tolerant, optimistic UI.** Local cache stays as a read cache and offline queue; the cloud is the source of truth.
5. **No custom auth or crypto.** Use the BaaS's audited auth.

---

## 2. Keep vanilla JS, or migrate to React/Next.js?

**Recommendation: a *gradual*, two-stage path — do not rewrite up front.**

- **Stage 1 (this and the next 1–2 milestones): stay on vanilla JS.** Introduce the data-access layer and swap `LocalStore` → `CloudStore` behind it. The current app already cleanly separates render/domain/storage enough that adding auth + cloud reads does **not** require React. Rewriting now would throw away a working, tested MVP and stall product progress.
- **Stage 2 (once auth + shared data are proven): migrate the frontend to React + Next.js/TypeScript**, module by module (People tab first, then Goals, then Planner), reusing the same repository interface. The existing [`STEADFAST_IMPLEMENTATION_PLAN.md`](../STEADFAST_IMPLEMENTATION_PLAN.md) §12 already targets Next.js/TypeScript, so this is the intended destination.

Why gradual rather than immediate:

| | Stay vanilla (now) | Rewrite to Next.js (now) |
|---|---|---|
| Time to shared beta | Fast | Slow (re-implement calendar, forms, views) |
| Risk | Low | High (regress tested MVP) |
| Realtime / optimistic UI | Workable with Supabase JS client | Nicer, but not required yet |
| Type safety, testing, routing | Weaker | Stronger |
| Component reuse / scale | Weaker long-term | Better long-term |

**Trigger to start Stage 2:** when the calendar interactions, recurrence editing, and shared-state reconciliation become painful to maintain in template strings — realistically right after the shared-data beta validates the product. At that point Next.js also unlocks server-side auth helpers, typed Supabase clients, and easier PWA/push work.

---

## 3. Authentication and account creation

Use **Supabase Auth (GoTrue)**:

- **Email + password** and **magic-link (passwordless email)** for the beta. Add OAuth (Google/Apple) later for convenience.
- **Account creation flow:** sign up → verify email → create `profiles` row (display name, timezone, locale) → land in onboarding (create or join a household).
- **Sessions:** Supabase issues a JWT + refresh token stored by the client SDK. The JWT carries `sub` (the user id) and is sent on every data request; RLS policies read `auth.uid()` from it.
- **Password reset / email verification / rate limiting** are provided by the service — do not hand-roll.
- **Timezone:** capture at signup (default from the browser) and store on the profile, satisfying implementation-plan FR-3 for correct shared scheduling.

No auth code is written in this milestone — this section defines the target.

---

## 4. Domain entities (users, households, memberships, roles, people, goals, activities, follow-ups)

- **User / Profile** — one per person. Identity comes from Supabase Auth; `profiles` holds app fields (display name, timezone, locale).
- **Household (a.k.a. workspace)** — the roommate group. The sharing boundary. A user can belong to one or more households (roommates now, maybe family later).
- **Membership** — join row linking a user to a household, carrying a **role**.
- **Roles (per household):**
  - `owner` — created the household; can manage members, delete the household.
  - `admin` — can invite/remove members, edit shared settings.
  - `member` — standard roommate; can create and edit shared content.
  - (optional later) `viewer` — read-only guest.
- **Person** — a contact. **Owned by a user**, optionally associated to a household. Default **private** (implementation-plan FR-17: contacts must not be exposed without explicit sharing).
- **Goal** — personal or shared ("keep the apartment clean"). Has owner + household + visibility.
- **Calendar activity (event)** — the planning unit. Personal ("study block") or shared ("rent due", "roommate dinner"). Owner + household + visibility + the existing links to people/goals.
- **Follow-up** — a task, often tied to a person/event/goal. Owner + household + visibility.
- **Review** — weekly review note. Personal by default.

Every shared-capable record carries three control columns: `owner_id`, `household_id` (nullable for purely personal items), and `visibility` (`'private' | 'household'`).

---

## 5. Database tables and relationships

PostgreSQL (Supabase). Names mirror current app concepts; UUID primary keys are server-generated.

```
profiles
  id            uuid  PK  (= auth.users.id)
  display_name  text
  timezone      text
  locale        text
  created_at    timestamptz
  updated_at    timestamptz

households
  id            uuid  PK
  name          text
  created_by    uuid  FK → profiles.id
  created_at    timestamptz

household_members
  id            uuid  PK
  household_id  uuid  FK → households.id
  user_id       uuid  FK → profiles.id
  role          text  CHECK (role in ('owner','admin','member','viewer'))
  joined_at     timestamptz
  UNIQUE (household_id, user_id)

household_invites
  id            uuid  PK
  household_id  uuid  FK → households.id
  email         text          -- optional: targeted invite
  token         text  UNIQUE   -- for link/code invites
  role          text
  invited_by    uuid  FK → profiles.id
  status        text  CHECK (status in ('pending','accepted','revoked','expired'))
  expires_at    timestamptz
  created_at    timestamptz

people
  id            uuid  PK
  owner_id      uuid  FK → profiles.id
  household_id  uuid  FK → households.id   NULL = purely personal
  visibility    text  CHECK (visibility in ('private','household'))  DEFAULT 'private'
  name, type, detail, phone, email, note    -- mirror current model
  archived_at   timestamptz NULL
  created_at, updated_at timestamptz

goals
  id, owner_id, household_id, visibility
  title, reason, progress int, target int, period, color, status
  created_at, updated_at

events                       -- "calendar activities"
  id, owner_id, household_id, visibility
  title, description, location
  date date, start_time time NULL, end_time time NULL, all_day bool
  category, color, status CHECK (status in ('planned','completed','skipped'))
  recurrence text, timezone text
  created_at, updated_at

event_people                 -- many-to-many
  event_id uuid FK → events.id
  person_id uuid FK → people.id
  PRIMARY KEY (event_id, person_id)

event_goals                  -- many-to-many
  event_id uuid FK → events.id
  goal_id  uuid FK → goals.id
  PRIMARY KEY (event_id, goal_id)

follow_ups
  id, owner_id, household_id, visibility
  description, due_date date, priority, status
  person_id uuid NULL FK → people.id
  event_id  uuid NULL FK → events.id
  goal_id   uuid NULL FK → goals.id
  created_at, updated_at

reviews
  id, owner_id, household_id NULL, visibility DEFAULT 'private'
  week_start date, carry text, saved_at timestamptz
```

Relationships:

- `profiles 1—* household_members *—1 households` (many-to-many membership with role).
- `events *—* people` via `event_people`; `events *—* goals` via `event_goals` (preserves current `personIds` / `goalIds` arrays as proper join tables).
- `follow_ups` reference at most one person/event/goal each (matches current model).
- Indexes: `(household_id, date)` on events, `(owner_id, visibility)` on people, `(household_id, due_date, status)` on follow_ups, plus all FK columns.

> Note: the current app uses statuses `planned/completed/skipped`. The older implementation plan (FR-9) lists `planned/completed/missed/canceled`. The schema above follows the **current app** (`skipped`); reconcile intentionally if the richer status set is reintroduced.

---

## 6. Migrating localStorage data into the cloud

One-time, user-initiated, non-destructive migration on first sign-in:

1. **Detect** existing `steadfast-*-v2` data in the browser.
2. **Prompt** the user: "Import your existing Steadfast data into your account?" (never silent).
3. **Read & normalize** each collection through the existing normalizers.
4. **Assign ownership:** set `owner_id = auth.uid()`; set `household_id`/`visibility` based on the user's choice (default everything to `private` so nothing is accidentally shared with roommates).
5. **Generate server IDs:** map old client IDs → new UUIDs, rewriting `event_people` / `event_goals` links with the new IDs (keep a client-side id-map during import).
6. **Bulk insert** via the data API inside a transaction / batch; make it **idempotent** (skip records already imported, e.g. via an `imported_from_local` marker) so a retry can't duplicate.
7. **Verify** counts, then **keep the local data as a backup** and offer a **JSON export** before clearing. Only mark `localStorage` migrated after success.
8. After migration, the client reads/writes through `CloudStore`; `LocalStore` becomes an offline cache.

This is the practical payoff of the data-access layer: migration is "read from `LocalStore`, write to `CloudStore`."

---

## 7. Inviting roommates

Two complementary flows, both backed by `household_invites`:

- **Invite link / code (primary for beta):** an owner/admin generates an invite (random `token`, chosen `role`, `expires_at`). Share the link/code out-of-band (text/Signal/in person). The invitee signs in, the app validates the token, and on accept creates a `household_members` row. Simple, no email deliverability dependency.
- **Email invite (later):** enter a roommate's email; Supabase sends a magic link; on first sign-in the pending invite for that email is auto-accepted.

Rules:

- Only `owner`/`admin` can create or revoke invites.
- Invites are single-household, role-scoped, and expiring.
- Accepting an invite grants access to **household-visible** data only — never to other members' private items.
- Owners can remove members; removal revokes access immediately (RLS re-evaluates per request).

---

## 8. Authorization rules (household data isolation)

Enforced primarily by **Postgres Row Level Security**, so even a crafted client request cannot reach another household's data (defense against IDOR; implementation-plan AC-8).

Guiding policies (conceptual, not code):

- A helper predicate **`is_member(household_id)`** = "there exists a `household_members` row for `auth.uid()` in that household."
- **SELECT** on a shared-capable table is allowed when:
  `owner_id = auth.uid()`  **OR**  (`visibility = 'household'` **AND** `is_member(household_id)`).
- **INSERT** allowed when `owner_id = auth.uid()` and (if `household_id` set) `is_member(household_id)`.
- **UPDATE/DELETE** allowed when `owner_id = auth.uid()`, **or** for `visibility = 'household'` items when the actor is `admin`/`owner` of that household (decide per entity how much editing roommates may do to each other's shared items; default: creator edits, admins can remove).
- **households / household_members / invites** have their own policies (only members can read their household; only owner/admin can mutate membership).
- The client **never sends** `owner_id`; the server derives it from `auth.uid()`.

RLS is the backstop; the UI also hides unavailable actions for good UX.

---

## 9. Private vs shared data

Default to **private**; sharing is an explicit, per-item (or per-type-default) choice.

| Data | Default | Typical roommate use |
|---|---|---|
| **People / contacts** | **Private** | Rarely shared (FR-17). Allow sharing a specific contact (e.g. landlord) explicitly. |
| Contact notes / how-met | **Private** | Not shared. |
| **Calendar activities** | Private, but easy **"share with household"** toggle | Shared: rent due, chores, roommate dinner, guests over. |
| **Goals** | Private | Shared: "keep kitchen clean", "split groceries". |
| **Follow-ups / tasks** | Private | Shared chores/tasks tied to shared events. |
| **Weekly reviews** | **Private** | Personal reflection — not shared. |
| Profile (display name, avatar) | Visible to household members | Needed to attribute shared items. |

UX guardrails: show a clear badge on shared items, confirm when first sharing something, and make "who can see this?" obvious. Never auto-share on import (see §6).

---

## 10. Hosting and database options (Supabase primary)

**Primary recommendation: Supabase (managed).**

- Bundles Postgres + Auth + RLS + Realtime + Storage + scheduled backups in one free/low-cost project — exactly the pieces roommate sharing needs.
- RLS gives per-household isolation at the data layer.
- Generous free tier is enough for a private roommate beta; Pro (~$25/mo) when needed.
- Frontend stays static → host on **Cloudflare Pages / Netlify / Vercel free tier** (or keep serving the static files from the current simple host).

**Comparison:**

| Option | Pros | Cons | Fit |
|---|---|---|---|
| **Supabase (managed)** ⭐ | Auth+DB+RLS+Realtime+backups together; Postgres; low/no cost; least code | Vendor-shaped conventions; cold-start on free tier | **Best for the beta** |
| **Homelab (self-host Supabase or plain Postgres on your own hardware)** | Full control; no per-seat cost; data stays on your box; good learning | You own uptime, TLS certs, backups, security patching, remote access, dynamic DNS; roommates need reliable external reachability | Good **later** or as a mirror; risky as the *only* host for a beta others depend on |
| **Neon/Supabase-less Postgres + separate auth (Clerk/Auth0)** | Best-in-class auth UX; serverless Postgres | More moving parts to wire; more cost at scale | Consider if auth UX becomes a priority |
| **Firebase** | Mature realtime, easy auth | NoSQL document model fits this relational data poorly; RLS-equivalent rules are clunky for households | Weak fit |
| **PocketBase (self-host single binary)** | Dead-simple, SQLite, auth + rules built in, tiny | Single-node, scaling/HA limits; smaller ecosystem | Great for a homelab beta if you want minimal ops |
| **Railway / Render / Fly (Postgres + small API)** | Flexible, cheap to start | You still build auth + authorization yourself | Fit once you outgrow BaaS |

**Decision:** start on **managed Supabase** for the beta; optionally replicate/back up to the **homelab** for ownership and cost control. Because access goes through the repository layer, moving to self-hosted Supabase or Postgres later is low-friction.

---

## 11. Deployment plan for a private roommate beta

1. **Provision** a Supabase project (free tier); apply the schema (§5) and RLS policies (§8) via migrations kept in `supabase/migrations/` (version-controlled, reversible).
2. **Config:** store the Supabase URL + anon key as build-time env/config (anon key is public by design; RLS is what protects data). Keep service-role keys server-side only (never shipped to the client).
3. **Frontend hosting:** deploy the static client to Cloudflare Pages/Netlify/Vercel with the `?v=` versioning already in place; production can cache fingerprinted assets normally (the no-store `server.js` stays dev-only).
4. **Gate the beta:** invite-only via household invite codes (§7); cap membership; no public signup link advertised.
5. **Seed/import:** each roommate signs in and runs the one-time localStorage import (§6).
6. **Smoke test with real roommates:** create a household, invite 1–3 people, create a shared event and a private contact, verify each person sees shared items and **cannot** see others' private items.
7. **Observe:** basic error logging (no private note bodies), watch RLS denials, auth failures, and sync errors.
8. **Rollback:** disable new signups/invites; the static frontend can be reverted independently; never destructively reset the database — migrations are reversible and backups exist.

---

## 12. Security, privacy, backup, and account deletion

- **Authorization on every query** via RLS; the server derives identity from the JWT (`auth.uid()`), never from client-supplied IDs. Cross-household/IDOR tests are mandatory before beta (implementation-plan AC-8, §16 security tests).
- **Transport & at-rest:** HTTPS everywhere; Supabase encrypts data at rest. Treat phone/email/notes as sensitive PII.
- **Secrets:** only the anon key ships to the client; service-role keys and any future server functions keep secrets server-side. Rate-limit auth and (future) export endpoints.
- **Least-privilege data:** collect only what's needed; shared items expose only necessary fields to roommates (e.g. a shared event need not reveal private linked-contact notes).
- **Privacy controls:** clear per-item sharing state; a visible privacy explanation of what Steadfast stores; publish a privacy policy before any non-friend users.
- **Logging/observability:** capture latency, error rates, RLS denials, sync failures — **never** log contact notes or review bodies.
- **Backups:** rely on Supabase automated backups; additionally offer **user-facing JSON export** (implementation-plan FR-32) and periodic project backups (optionally mirrored to the homelab).
- **Account deletion (implementation-plan FR-34):** a user can delete their account; this removes/anonymizes their owned data per policy. Define cascade rules: deleting a user removes their private items; for shared items either transfer ownership to the household owner or delete, per household policy. Deleting a household removes its shared items and memberships. Keep only minimal, note-free audit records.
- **Member removal:** revoking membership immediately cuts access (RLS), without deleting that member's own private data.

---

## 13. Small first implementation milestone (no rewrite)

**Milestone: "Storage seam + cloud-ready schema fields, still 100% local."** Ships value as refactor-only, unlocks everything above, changes **no** user-visible behavior.

Scope (future work — not done in this doc):

1. **Introduce a data-access module** (e.g. `store.js`) exposing a small, stable interface per collection:
   `list / get / create / update / remove` for `events`, `people`, `goals`, `followUps`, `reviews`, `prefs`.
   Implement it as **`LocalStore`** wrapping the existing `localStorage` + normalizers. **No behavior change.**
2. **Route all current `localStorage`/`persistAll` access in `app.js` through `store`** so the UI no longer touches storage directly. (This is the single most important, most mechanical step.)
3. **Add cloud-ready fields to the normalizers** — `ownerId`, `householdId`, `visibility` (default `local`/`null`/`'private'`) — so records are already shaped for multi-user. Bump storage keys to `-v3` with a `-v2 → -v3` migration that backfills defaults.
4. **Move new-record IDs to collision-safe UUIDs** (`crypto.randomUUID()`), keeping old IDs valid.
5. **Add JSON export/import** (download all collections; import merges) — immediately useful, and it's the backbone of the §6 cloud migration and §12 backups.

Acceptance criteria:

- App behaves identically to `63da050` (all QA flows still pass; `node --check app.js` and `node --check server.js` pass).
- No direct `localStorage.*` calls remain in the render/UI code (only inside `store`/`LocalStore`).
- Export → clear storage → import round-trips with no data loss.
- New records use UUIDs and carry `ownerId/householdId/visibility` defaults.

**Next milestone after that** (separate plan): add Supabase Auth + a `CloudStore` implementation of the same interface behind a feature flag, starting read-only, then writes, then households and sharing.

---

## Appendix — mapping current model → target schema

| Current (localStorage) | Target (Postgres) | Notes |
|---|---|---|
| `steadfast-events-v2[]` | `events` + `event_people` + `event_goals` | arrays `personIds`/`goalIds` become join tables |
| `steadfast-people-v2[]` | `people` | default `visibility='private'` |
| `steadfast-goals-v2[]` | `goals` | add owner/household/visibility |
| `steadfast-followups-v2[]` | `follow_ups` | single person/event/goal refs preserved |
| `steadfast-reviews-v2[]` | `reviews` | private by default |
| `steadfast-prefs-v2{}` | `profiles` (+ prefs columns) | view/timezone/locale |
| client string IDs (`evt-…`) | UUID PKs | id-map during migration |
