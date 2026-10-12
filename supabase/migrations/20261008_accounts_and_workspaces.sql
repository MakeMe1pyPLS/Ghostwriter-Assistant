-- Phase 2, part 1: accounts and workspaces.
-- Every row belongs to one signed-in user, and row-level security makes sure
-- a user can only ever read or change their own rows.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  -- Billing will set this (server side). Users cannot change it themselves.
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'professional', 'business', 'enterprise')),
  trial_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Only the name is editable from the app; plan and trial dates are not.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Create the profile when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- workspaces
-- One row per business a user works on: their own ('own') and, for
-- consultants, one per client. growth and dashboard hold the same JSON the
-- app keeps in the browser (plan, actions, sessions, datasets, dashboards).
create table public.workspaces (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  kind text not null check (kind in ('own', 'client')),
  name text not null default '' check (char_length(name) <= 120),
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) < 200000),
  growth jsonb check (growth is null or pg_column_size(growth) < 5000000),
  dashboard jsonb check (dashboard is null or pg_column_size(dashboard) < 20000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id),
  check ((kind = 'own') = (id = 'own'))
);

alter table public.workspaces enable row level security;

create policy "Users can read their own workspaces"
  on public.workspaces for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can add their own workspaces"
  on public.workspaces for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their own workspaces"
  on public.workspaces for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own workspaces"
  on public.workspaces for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.workspaces from anon;

-- Keep updated_at current and cap workspaces per account.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger workspaces_touch before update on public.workspaces
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create function public.limit_workspaces()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.workspaces w where w.owner_id = new.owner_id) >= 250 then
    raise exception 'Workspace limit reached (250 per account)';
  end if;
  return new;
end;
$$;

create trigger workspaces_limit before insert on public.workspaces
  for each row execute function public.limit_workspaces();
