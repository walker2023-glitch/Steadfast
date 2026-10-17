# Steadfast

Steadfast is a private, relationship-centered planner for living with purpose. It is inspired by useful planning habits of missionary service, but uses original branding and an adaptable life-planning model.

## Current prototype

- Responsive Steadfast app shell (navy / teal design system)
- Month, week, and day calendar views with navigation and Today
- Missionary-inspired planning workflow: what, who, why, goals, outcome, next
- Event create/edit with people, goals, status, recurrence, and follow-ups
- Day panel companion: plans, people, goals, follow-ups, weekly review
- Weekly review for completed/missed plans and next-week carryover
- People and goals views with local persistence (localStorage)

This is intentionally a local-first UI prototype. Authentication, database persistence, synchronization, calendar integrations, and native packaging are planned but not yet implemented.

## Run locally

```bash
npm run dev
```

Then open `http://localhost:4173`. The current prototype has no package dependencies; this keeps the first demo easy to run while the product workflow is being validated.

See [`STEADFAST_IMPLEMENTATION_PLAN.md`](./STEADFAST_IMPLEMENTATION_PLAN.md) for the full roadmap.
