# Steadfast

Steadfast is a private, relationship-centered planner for living with purpose. It is inspired by useful planning habits of missionary service, but uses original branding and an adaptable life-planning model.

## Current prototype

- Responsive Steadfast app shell
- Month calendar with selectable days
- Day plan with seeded events and goals
- Add-to-plan modal with local persistence
- People view with notes and direct phone/email actions
- Goals view with progress indicators

This is intentionally a local-first UI prototype. Authentication, database persistence, synchronization, calendar integrations, and native packaging are planned but not yet implemented.

## Run locally

```bash
npm run dev
```

Then open `http://localhost:4173`. The current prototype has no package dependencies; this keeps the first demo easy to run while the product workflow is being validated.

See [`STEADFAST_IMPLEMENTATION_PLAN.md`](./STEADFAST_IMPLEMENTATION_PLAN.md) for the full roadmap.
