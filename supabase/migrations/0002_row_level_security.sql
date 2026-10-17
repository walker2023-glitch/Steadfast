-- Steadfast — Supabase foundation: Row Level Security.
--
-- Enforces household data isolation at the database layer (defense against IDOR):
-- a user can only reach their own rows or rows explicitly shared with a household
-- they belong to. See docs/SHARED_APP_ARCHITECTURE.md (§8).
--
-- The membership checks use SECURITY DEFINER helper functions so that policies do
-- not re-trigger RLS on household_members (which would otherwise recurse).

-- ─── Membership helper functions ─────────────────────────────────────────────

-- Is the current user a member of the given household?
create or replace function public.is_household_member(hh uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = hh
      and m.user_id = auth.uid()
  );
$$;

-- Does the current user hold one of the given roles in the household?
create or replace function public.has_household_role(hh uuid, roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = hh
      and m.user_id = auth.uid()
      and m.role = any (roles)
  );
$$;

-- Who created the household? (Used to bootstrap the first owner membership.)
create or replace function public.household_creator(hh uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select created_by from public.households where id = hh;
$$;

-- Do the current user and the target user share any household?
create or replace function public.shares_household(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members a
    join public.household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid()
      and b.user_id = target
  );
$$;

-- Can the current user SEE this activity (owner or shared-with-household)?
create or replace function public.can_see_activity(act uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.activities a
    where a.id = act
      and (
        a.owner_id = auth.uid()
        or (
          a.visibility = 'household'
          and a.household_id is not null
          and public.is_household_member(a.household_id)
        )
      )
  );
$$;

-- Does the current user OWN this activity? (Used to manage its link rows.)
create or replace function public.owns_activity(act uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.activities a
    where a.id = act and a.owner_id = auth.uid()
  );
$$;

-- ─── Enable RLS ──────────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.households         enable row level security;
alter table public.household_members  enable row level security;
alter table public.people             enable row level security;
alter table public.goals              enable row level security;
alter table public.activities         enable row level security;
alter table public.follow_ups         enable row level security;
alter table public.reviews            enable row level security;
alter table public.activity_people    enable row level security;
alter table public.activity_goals     enable row level security;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- A user sees their own profile and the profiles of people in their households.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_household(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── households ──────────────────────────────────────────────────────────────
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (created_by = auth.uid() or public.is_household_member(id));

drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update to authenticated
  using (public.has_household_role(id, array['owner', 'admin']))
  with check (public.has_household_role(id, array['owner', 'admin']));

drop policy if exists households_delete on public.households;
create policy households_delete on public.households
  for delete to authenticated
  using (public.has_household_role(id, array['owner']));

-- ─── household_members ───────────────────────────────────────────────────────
drop policy if exists household_members_select on public.household_members;
create policy household_members_select on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id));

-- A user may add THEMSELVES to a household they created (bootstrapping the first
-- owner), or an owner/admin may add members (future invite flow).
drop policy if exists household_members_insert on public.household_members;
create policy household_members_insert on public.household_members
  for insert to authenticated
  with check (
    public.has_household_role(household_id, array['owner', 'admin'])
    or (user_id = auth.uid() and public.household_creator(household_id) = auth.uid())
  );

drop policy if exists household_members_update on public.household_members;
create policy household_members_update on public.household_members
  for update to authenticated
  using (public.has_household_role(household_id, array['owner', 'admin']))
  with check (public.has_household_role(household_id, array['owner', 'admin']));

-- Owners/admins can remove members; a member may remove (leave) themselves.
drop policy if exists household_members_delete on public.household_members;
create policy household_members_delete on public.household_members
  for delete to authenticated
  using (
    public.has_household_role(household_id, array['owner', 'admin'])
    or user_id = auth.uid()
  );

-- ─── Content tables: people / goals / activities / follow_ups / reviews ───────
-- Uniform pattern:
--   SELECT: owner, or household-visible to a member
--   INSERT: must own the row; if it has a household, must be a member
--   UPDATE/DELETE: owner, or an owner/admin for household-visible rows

-- people
drop policy if exists people_select on public.people;
create policy people_select on public.people
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists people_insert on public.people;
create policy people_insert on public.people
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (household_id is null or public.is_household_member(household_id))
  );

drop policy if exists people_update on public.people;
create policy people_update on public.people
  for update to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  )
  with check (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

drop policy if exists people_delete on public.people;
create policy people_delete on public.people
  for delete to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

-- goals
drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists goals_insert on public.goals;
create policy goals_insert on public.goals
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (household_id is null or public.is_household_member(household_id))
  );

drop policy if exists goals_update on public.goals;
create policy goals_update on public.goals
  for update to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  )
  with check (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

drop policy if exists goals_delete on public.goals;
create policy goals_delete on public.goals
  for delete to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

-- activities
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (household_id is null or public.is_household_member(household_id))
  );

drop policy if exists activities_update on public.activities;
create policy activities_update on public.activities
  for update to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  )
  with check (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

drop policy if exists activities_delete on public.activities;
create policy activities_delete on public.activities
  for delete to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

-- follow_ups
drop policy if exists follow_ups_select on public.follow_ups;
create policy follow_ups_select on public.follow_ups
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists follow_ups_insert on public.follow_ups;
create policy follow_ups_insert on public.follow_ups
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (household_id is null or public.is_household_member(household_id))
  );

drop policy if exists follow_ups_update on public.follow_ups;
create policy follow_ups_update on public.follow_ups
  for update to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  )
  with check (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

drop policy if exists follow_ups_delete on public.follow_ups;
create policy follow_ups_delete on public.follow_ups
  for delete to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.has_household_role(household_id, array['owner', 'admin']))
  );

-- reviews (private reflection; owner-scoped in practice)
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'household' and household_id is not null and public.is_household_member(household_id))
  );

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (household_id is null or public.is_household_member(household_id))
  );

drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete to authenticated
  using (owner_id = auth.uid());

-- ─── Join tables: access derived from the parent activity ─────────────────────
-- activity_people
drop policy if exists activity_people_select on public.activity_people;
create policy activity_people_select on public.activity_people
  for select to authenticated
  using (public.can_see_activity(activity_id));

drop policy if exists activity_people_insert on public.activity_people;
create policy activity_people_insert on public.activity_people
  for insert to authenticated
  with check (public.owns_activity(activity_id));

drop policy if exists activity_people_delete on public.activity_people;
create policy activity_people_delete on public.activity_people
  for delete to authenticated
  using (public.owns_activity(activity_id));

-- activity_goals
drop policy if exists activity_goals_select on public.activity_goals;
create policy activity_goals_select on public.activity_goals
  for select to authenticated
  using (public.can_see_activity(activity_id));

drop policy if exists activity_goals_insert on public.activity_goals;
create policy activity_goals_insert on public.activity_goals
  for insert to authenticated
  with check (public.owns_activity(activity_id));

drop policy if exists activity_goals_delete on public.activity_goals;
create policy activity_goals_delete on public.activity_goals
  for delete to authenticated
  using (public.owns_activity(activity_id));
