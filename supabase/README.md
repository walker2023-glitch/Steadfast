# Steadfast — Supabase foundation

This folder is the **cloud foundation** for the private roommate beta. It is not
wired into the running app yet: Steadfast still uses `localStorage` (via the
`Store` layer in `app.js`). This milestone only provisions the database schema,
Row Level Security, and client scaffolding so the next milestone can add auth and
a `CloudStore`.

See [`docs/SHARED_APP_ARCHITECTURE.md`](../docs/SHARED_APP_ARCHITECTURE.md) for
the full design.

## Contents

- `migrations/0001_init_schema.sql` — tables, keys, indexes, constraints, triggers.
- `migrations/0002_row_level_security.sql` — RLS helpers and per-table policies.

Tables: `profiles`, `households`, `household_members`, `people`, `goals`,
`activities`, `follow_ups`, `reviews`, `activity_people`, `activity_goals`.
(The app's calendar "event" is stored as an `activities` row.)

## Secrets & environment

Never commit real keys. `.gitignore` already excludes `.env`, `.env.*` (except
`.env.example`), and `config.local.js`.

- `.env.example` — template for CLI/build tooling (URL, anon key, and a
  **server-only** service role key).
- `config.example.js` — template for the browser prototype; copy to
  `config.local.js` and fill in the URL + **public anon key** only.

The anon key is safe in the browser because RLS protects the data. The
`service_role` key bypasses RLS and must stay server-side only.

## Applying the migrations

Pick one:

### Option A — Supabase SQL Editor (no local tooling)
1. Open your project → **SQL Editor**.
2. Paste and run `migrations/0001_init_schema.sql`.
3. Paste and run `migrations/0002_row_level_security.sql`.

### Option B — Supabase CLI
```bash
# one-time
npm install
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"

# apply everything in migrations/ in order
npx supabase db push
```

Both migrations are written to be re-runnable (tables use `if not exists`;
policies are dropped and recreated).

## Create one test household (seed/test)

RLS blocks cross-user access, but the **SQL Editor runs as the service role and
bypasses RLS**, so you can seed directly there. The app (anon key) will still be
governed by RLS.

1. Create a user: project → **Authentication → Users → Add user** (email +
   password). The `on_auth_user_created` trigger auto-creates a `profiles` row.
2. Copy that user's **UUID** from the Users list.
3. In the SQL Editor, run the block below, replacing the placeholder UUID:

```sql
-- === EDIT THIS: the auth user UUID from Authentication → Users ===
\set owner_uuid '00000000-0000-0000-0000-000000000000'

-- If your client doesn't support \set (e.g. the web SQL editor), replace every
-- :'owner_uuid' below with '<that-uuid>' directly.

-- Ensure a profile exists (the signup trigger normally does this).
insert into public.profiles (id, display_name)
values (:'owner_uuid', 'Test Owner')
on conflict (id) do nothing;

-- Create a household and capture its id, then add the owner as a member and
-- seed one private + one shared activity.
with new_household as (
  insert into public.households (name, created_by)
  values ('Apartment 4B', :'owner_uuid')
  returning id
),
membership as (
  insert into public.household_members (household_id, user_id, role)
  select id, :'owner_uuid', 'owner' from new_household
  returning household_id
)
insert into public.activities (owner_id, household_id, visibility, title, activity_date, all_day, category)
select :'owner_uuid', household_id, 'household', 'Rent due', current_date, true, 'Personal'
from membership
union all
select :'owner_uuid', null, 'private', 'Personal study block', current_date, true, 'Spiritual';
```

4. To test a second roommate, create another auth user, then (as the owner,
   through the app in a later milestone, or via the SQL editor) insert a
   `household_members` row with `role = 'member'` for that user and the same
   `household_id`.

### What to verify
- The owner can read the household, its members, and both activities.
- A non-member cannot read any of those rows (RLS returns zero rows).
- A member can read the `household`-visibility activity but not the `private` one.

> Only `household_members`, `households`, and `profiles` are needed to establish a
> household. Invitations, email, and the join flow are intentionally out of scope
> for this foundation.
