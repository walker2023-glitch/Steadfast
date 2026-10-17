# Steadfast

Steadfast is a private, relationship-centered planner for living with purpose. It is inspired by useful planning habits of missionary service, but uses original branding and an adaptable life-planning model.

## Current prototype

- Responsive Steadfast app shell (navy / teal design system)
- Month, week, and day calendar views with navigation and Today
- Missionary-inspired planning workflow: what, who, why, goals, outcome, next
- Event create/edit/delete with people, goals, recurrence, and follow-ups
- Activity statuses: planned, completed, skipped (with form validation)
- Day panel companion: plans, people, goals, follow-ups, weekly review
- Weekly review for completed/missed plans and next-week carryover
- People and goals views with local persistence (localStorage)

This is intentionally a local-first UI prototype. Authentication, database persistence, synchronization, calendar integrations, and native packaging are planned but not yet implemented.

## Run locally

```bash
npm run dev
```

Then open `http://localhost:4173`. The dev server (`server.js`) is a tiny, dependency-free Node static server that sends `Cache-Control: no-store`, so JavaScript and CSS edits are never served stale during development. Only Node is required.

`index.html` also loads `app.js`/`styles.css` with a fixed `?v=` version string; bump it when shipping changes so production caches update without disabling caching entirely.

See [`STEADFAST_IMPLEMENTATION_PLAN.md`](./STEADFAST_IMPLEMENTATION_PLAN.md) for the full roadmap.
