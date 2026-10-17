-- Steadfast — Supabase foundation: core schema for the private roommate beta.
--
-- Mirrors the local (localStorage) data model with cloud-ready ownership and
-- household scoping. See docs/SHARED_APP_ARCHITECTURE.md (§4–§5).
--
-- Naming: the app's "event"/calendar item is stored here as "activities"
-- (with join tables activity_people / activity_goals).
--
-- Row Level Security is enabled separately in 0002_row_level_security.sql.

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- ─── Shared helpers ──────────────────────────────────────────────────────────

-- Keep updated_at fresh on any UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per authenticated user (id == auth.users.id).
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null default 'Steadfast user',
  timezone     text        not null default 'UTC',
  locale       text        not null default 'en',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Steadfast user'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── households ──────────────────────────────────────────────────────────────
-- The roommate group; the sharing boundary.
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null default 'My household',
  created_by uuid        not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists households_created_by_idx on public.households (created_by);

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

-- ─── household_members ───────────────────────────────────────────────────────
-- Membership + role. A user may belong to multiple households.
create table if not exists public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid        not null references public.households (id) on delete cascade,
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  role         text        not null default 'member'
                 check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);
create index if not exists household_members_user_idx on public.household_members (user_id);
create index if not exists household_members_household_idx on public.household_members (household_id);

-- ─── people ──────────────────────────────────────────────────────────────────
create table if not exists public.people (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid        not null references public.profiles (id) on delete cascade,
  household_id uuid        references public.households (id) on delete set null,
  visibility   text        not null default 'private'
                 check (visibility in ('private', 'household')),
  name         text        not null default 'Unnamed',
  type         text        not null default 'Friend',
  detail       text        not null default '',
  phone        text        not null default '',
  email        text        not null default '',
  note         text        not null default '',
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint people_shared_requires_household
    check (visibility = 'private' or household_id is not null)
);
create index if not exists people_owner_idx on public.people (owner_id);
create index if not exists people_household_idx on public.people (household_id);
create index if not exists people_owner_visibility_idx on public.people (owner_id, visibility);

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- ─── goals ───────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid        not null references public.profiles (id) on delete cascade,
  household_id uuid        references public.households (id) on delete set null,
  visibility   text        not null default 'private'
                 check (visibility in ('private', 'household')),
  title        text        not null default 'Untitled goal',
  reason       text        not null default '',
  progress     integer     not null default 0 check (progress >= 0),
  target       integer     not null default 1 check (target >= 1),
  period       text        not null default 'This week',
  color        text        not null default 'blue',
  status       text        not null default 'active'
                 check (status in ('active', 'paused', 'completed', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint goals_shared_requires_household
    check (visibility = 'private' or household_id is not null)
);
create index if not exists goals_owner_idx on public.goals (owner_id);
create index if not exists goals_household_idx on public.goals (household_id);
create index if not exists goals_owner_visibility_idx on public.goals (owner_id, visibility);

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ─── activities (calendar items / "events") ──────────────────────────────────
create table if not exists public.activities (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      uuid        not null references public.profiles (id) on delete cascade,
  household_id  uuid        references public.households (id) on delete set null,
  visibility    text        not null default 'private'
                  check (visibility in ('private', 'household')),
  title         text        not null default 'Untitled',
  description   text        not null default '',
  location      text        not null default '',
  activity_date date        not null default current_date,
  start_time    time,
  end_time      time,
  all_day       boolean     not null default false,
  category      text        not null default 'Personal',
  color         text        not null default 'blue',
  status        text        not null default 'planned'
                  check (status in ('planned', 'completed', 'skipped')),
  recurrence    text        not null default 'none'
                  check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  follow_up     text        not null default '',
  timezone      text        not null default 'UTC',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint activities_time_order
    check (all_day or start_time is null or end_time is null or end_time > start_time),
  constraint activities_shared_requires_household
    check (visibility = 'private' or household_id is not null)
);
create index if not exists activities_owner_idx on public.activities (owner_id);
create index if not exists activities_household_idx on public.activities (household_id);
create index if not exists activities_household_date_idx on public.activities (household_id, activity_date);
create index if not exists activities_owner_date_idx on public.activities (owner_id, activity_date);

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ─── follow_ups ──────────────────────────────────────────────────────────────
create table if not exists public.follow_ups (
  id           uuid        primary key default gen_random_uuid(),
  owner_id     uuid        not null references public.profiles (id) on delete cascade,
  household_id uuid        references public.households (id) on delete set null,
  visibility   text        not null default 'private'
                 check (visibility in ('private', 'household')),
  description  text        not null default '',
  due_date     date        not null default current_date,
  priority     text        not null default 'normal'
                 check (priority in ('low', 'normal', 'high')),
  status       text        not null default 'open'
                 check (status in ('open', 'done')),
  person_id    uuid        references public.people (id) on delete set null,
  activity_id  uuid        references public.activities (id) on delete set null,
  goal_id      uuid        references public.goals (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint follow_ups_shared_requires_household
    check (visibility = 'private' or household_id is not null)
);
create index if not exists follow_ups_owner_idx on public.follow_ups (owner_id);
create index if not exists follow_ups_household_idx on public.follow_ups (household_id);
create index if not exists follow_ups_household_due_status_idx
  on public.follow_ups (household_id, due_date, status);
create index if not exists follow_ups_person_idx on public.follow_ups (person_id);
create index if not exists follow_ups_activity_idx on public.follow_ups (activity_id);
create index if not exists follow_ups_goal_idx on public.follow_ups (goal_id);

drop trigger if exists follow_ups_set_updated_at on public.follow_ups;
create trigger follow_ups_set_updated_at
  before update on public.follow_ups
  for each row execute function public.set_updated_at();

-- ─── reviews ─────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid        primary key default gen_random_uuid(),
  owner_id     uuid        not null references public.profiles (id) on delete cascade,
  household_id uuid        references public.households (id) on delete set null,
  visibility   text        not null default 'private'
                 check (visibility in ('private', 'household')),
  week_start   date        not null,
  carry        text        not null default '',
  saved_at     timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (owner_id, week_start)
);
create index if not exists reviews_owner_idx on public.reviews (owner_id);
create index if not exists reviews_household_idx on public.reviews (household_id);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ─── activity_people (activity <-> person, many-to-many) ──────────────────────
create table if not exists public.activity_people (
  activity_id uuid not null references public.activities (id) on delete cascade,
  person_id   uuid not null references public.people (id) on delete cascade,
  primary key (activity_id, person_id)
);
create index if not exists activity_people_person_idx on public.activity_people (person_id);

-- ─── activity_goals (activity <-> goal, many-to-many) ─────────────────────────
create table if not exists public.activity_goals (
  activity_id uuid not null references public.activities (id) on delete cascade,
  goal_id     uuid not null references public.goals (id) on delete cascade,
  primary key (activity_id, goal_id)
);
create index if not exists activity_goals_goal_idx on public.activity_goals (goal_id);
