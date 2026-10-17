# Steadfast — Current Status

_Last updated for commit `f3d98e3` (`test: polish and verify calendar MVP`). App build marker: `APP_VERSION = 1.0.0`._

Steadfast is a relationship-centered weekly planner. It is a single-file, dependency-free vanilla-JS app (`app.js`) rendered into `#root`, served statically. All data lives in the browser's `localStorage`. There is no backend, authentication, or network layer.

---

## Completed Calendar MVP features

- **Three calendar views** — Month, Week, and Day, switchable via tabs.
- **Navigation** — Previous/Next controls (labels adapt to the active view: month/week/day), plus a **Today** button. Selected date carries across navigation.
- **Create activities** from three entry points: the calendar header **+ Add activity**, the day-panel empty state (**Add your first intention**), and the mobile **floating action button**. New activities default to the selected date.
- **Activity form** with progressive disclosure (a **More details** section for location, notes, people, goals, follow-up, status, recurrence).
- **Form validation** — requires a title and date; for timed activities, requires start/end and enforces **end after start** (inline `role="alert"` message, submission blocked).
- **Full CRUD** — create, edit (form pre-fills all fields), and delete (with a confirmation dialog).
- **Status model** — `planned` / `completed` / `skipped`, changeable via day-card quick actions and the detail modal. Legacy `missed`/`canceled` statuses migrate to `skipped`.
- **Recurrence** — `none` / `daily` / `weekly` / `monthly` occurrences rendered across views.
- **Overlapping-event layout** in Week/Day timed views.
- **Day panel** acts as a planning companion (activities, linked people, goals, follow-ups for the selected day).
- **Weekly review** flow that records a per-week carry-over note.
- **Goal progress coupling** — completing a goal-linked activity increments the goal; un-completing or **deleting** a completed linked activity decrements it (kept consistent).
- **Persistence** — all changes saved to `localStorage`; survives reload. Seed data is used only when no stored data exists.
- **Responsive + accessible** — collapses to a mobile hamburger drawer and FAB, no horizontal overflow at 375px; aria-labels on controls, `role="alert"` validation, `role="progressbar"` on progress.

## Current People features

- People tab lists contact cards (name, type, detail/note).
- **Add person** form.
- **Contact actions** rendered as links: `tel:` (when a phone exists) and `mailto:` (when an email exists). No website field exists in the model.
- People can be **linked to activities**; linked people appear in the day panel for days with their activities.

## Current Goals features

- Goals tab lists goal cards with a **progress bar** (`progress / target`), reason, and period.
- **Add goal** form.
- Goals can be **linked to activities**; progress is driven by completing linked activities (see goal progress coupling above).
- Weekly review surfaces which goals progressed during the week.

---

## Current localStorage data model

All keys are versioned with the `-v2` suffix. Legacy unversioned keys are migrated on load without overwriting existing v2 data.

| Key | Holds |
| --- | --- |
| `steadfast-events-v2` | Event[] |
| `steadfast-people-v2` | Person[] |
| `steadfast-goals-v2` | Goal[] |
| `steadfast-followups-v2` | FollowUp[] |
| `steadfast-reviews-v2` | Review[] |
| `steadfast-prefs-v2` | Prefs object |

**Event**
```
id, title, date (YYYY-MM-DD), startTime (HH:MM|null), endTime (HH:MM|null),
allDay (bool), category, color, description, location,
personIds: string[], goalIds: string[], followUp,
status ('planned'|'completed'|'skipped'), recurrence ('none'|'daily'|'weekly'|'monthly'),
createdAt, updatedAt, isSeed (bool)
```

**Person**
```
id, name, type, detail, phone, email, note, isSeed
```

**Goal**
```
id, title, reason, progress (number), target (number), period, color,
status ('active'), isSeed
```

**FollowUp**
```
id, description, dueDate, personId|null, eventId|null, goalId|null,
priority, status ('open'), isSeed
```

**Review**
```
id, weekStart (YYYY-MM-DD), carry (string), savedAt
```

**Prefs**
```
{ view: 'month'|'week'|'day' }
```

Notes:
- IDs are client-generated strings (prefix + random), e.g. `evt-…`, `per-…`, `goal-…`.
- Relationships are modeled by storing arrays of IDs on the event (`personIds`, `goalIds`) and single ID references on follow-ups.
- Dates are plain ISO date strings; times are local `HH:MM` with **no timezone** information.

---

## Known limitations

- **Single user, single device.** Data is stored only in one browser profile's `localStorage`; nothing syncs across devices or people.
- **No backend, accounts, or authentication.**
- **No sharing.** Two people cannot see or edit the same plan.
- **Data durability risk.** Clearing browser storage, using a different browser/profile, or private browsing loses all data. No export/import or backup.
- **No concurrency handling.** No conflict resolution, versioning, or real-time updates.
- **Goal periods don't auto-reset.** `progress` is a running counter; "This week" is a label, not an enforced window.
- **Recurrence is unbounded.** No end date, count, or per-occurrence exceptions/edits.
- **No timezone support.** Times are naive local strings — unsafe for participants in different zones.
- **Delete is permanent** (confirm dialog only; no undo/trash).

---

## What must change to support multiple users and shared roommate data

1. **Backend + database.** Replace `localStorage` as the source of truth with a server and persistent store; keep a local cache for offline/optimistic UX.
2. **Authentication & accounts.** Add sign-up/sign-in and a stable `userId` per person.
3. **Household / group entity.** Introduce a `household` (roommate group) with a membership list and invite flow.
4. **Schema changes for ownership & scope.** Add `ownerId` (creator) and `householdId` to Event/Goal/FollowUp/Person records, plus a visibility field (e.g. `private` vs `shared`) so roommates can keep some items private and share others (shared calendar, chores, shared goals).
5. **Permissions model.** Define who can view/edit/delete shared vs private records.
6. **Server-generated IDs.** Switch to UUIDs issued by the server (or collision-safe client UUIDs) to avoid clashes when multiple clients create records.
7. **Data-access abstraction.** Introduce a repository/API layer in the client so the UI no longer calls `localStorage` directly — this makes the backend swap non-breaking.
8. **Sync & real-time.** Add fetch/mutate APIs with optimistic updates and conflict resolution, plus push/polling so a roommate's change appears for everyone.
9. **Timezone awareness.** Store timestamps in UTC with explicit timezones for correct shared scheduling.
10. **Migration path.** Provide a one-time import of existing single-user `localStorage` data into the account/household on first sign-in.

---

## Recommended next milestone

**Refactor to a storage/data-access layer and add ownership + household scoping to the schema — without introducing a backend yet.**

This is the highest-leverage non-breaking step toward roommate sharing:

- Extract all direct `localStorage` reads/writes behind a small repository module (e.g. `get/list/create/update/remove` per collection), keeping current behavior identical.
- Add optional `ownerId`, `householdId`, and `visibility` fields to the normalizers (defaulting to a local single-user identity) so records are shaped for multi-user from now on.
- Move toward collision-safe UUIDs for new records.

Doing this first means the subsequent backend/auth milestone becomes a localized change (swap the repository implementation) instead of a rewrite, and it keeps the app fully functional as a single-user tool in the meantime.
