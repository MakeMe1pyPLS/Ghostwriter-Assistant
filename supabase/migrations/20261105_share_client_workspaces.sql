-- Stage 6: share a client workspace with someone, read only, and keep a history on the server.
--
-- How it works
--   * Only the owner of a client workspace can share it. The other person gets the role "viewer".
--   * Viewers never read the workspaces table. They read through shared_workspace(), which returns
--     a trimmed copy: no private notes about the client, no webhook addresses, no action notes.
--   * Viewers can change nothing. The workspaces policies are unchanged (owner only), and viewers
--     have no policy on workspaces at all.
--   * Invites are matched by email when that person signs in with a confirmed email address.
--   * Every share, revoke, join, removal and first view each hour is written to audit_log.
--     The browser can read its own rows and can never insert, change or delete one.

-- ---------------------------------------------------------------- members and invites
create table public.workspace_members (
  owner_id uuid not null,
  workspace_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  role text not null default 'viewer' check (role in ('viewer')),
  created_at timestamptz not null default now(),
  primary key (owner_id, workspace_id, user_id),
  foreign key (owner_id, workspace_id) references public.workspaces (owner_id, id) on delete cascade
);
create index workspace_members_user_idx on public.workspace_members (user_id);
alter table public.workspace_members enable row level security;

create policy "Owners and members can see membership"
  on public.workspace_members for select to authenticated
  using ((select auth.uid()) = owner_id or (select auth.uid()) = user_id);

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  workspace_id text not null,
  email text not null check (email = lower(email) and char_length(email) between 3 and 254),
  role text not null default 'viewer' check (role in ('viewer')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  unique (owner_id, workspace_id, email),
  foreign key (owner_id, workspace_id) references public.workspaces (owner_id, id) on delete cascade
);
alter table public.workspace_invites enable row level security;

create policy "Owners can see their invites"
  on public.workspace_invites for select to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------- server-side history
create table public.audit_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id text,
  actor_id uuid,
  kind text not null check (kind in ('invite-sent', 'invite-revoked', 'member-joined', 'member-removed', 'shared-view')),
  summary text not null check (char_length(summary) <= 300),
  at timestamptz not null default now()
);
create index audit_log_owner_idx on public.audit_log (owner_id, at desc);
alter table public.audit_log enable row level security;

create policy "Owners can read their history"
  on public.audit_log for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Browsers can only read. All writes happen inside the functions below.
revoke all on public.workspace_members, public.workspace_invites, public.audit_log from anon, authenticated;
grant select on public.workspace_members, public.workspace_invites, public.audit_log to authenticated;

-- ---------------------------------------------------------------- functions
create function public.invite_to_workspace(p_workspace text, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  e text := lower(btrim(coalesce(p_email, '')));
begin
  if me is null then raise exception 'Sign in first.' using errcode = '28000'; end if;
  if char_length(e) > 254 or e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.';
  end if;
  if not exists (select 1 from public.workspaces w where w.owner_id = me and w.id = p_workspace and w.kind = 'client') then
    raise exception 'You can only share your own client workspaces.';
  end if;
  if e = (select lower(u.email) from auth.users u where u.id = me) then
    raise exception 'That is your own email address.';
  end if;
  if exists (select 1 from public.workspace_members m where m.owner_id = me and m.workspace_id = p_workspace and lower(m.email) = e) then
    raise exception 'That person already has access.';
  end if;
  if (select count(*) from public.workspace_members m where m.owner_id = me and m.workspace_id = p_workspace)
   + (select count(*) from public.workspace_invites i where i.owner_id = me and i.workspace_id = p_workspace) >= 10 then
    raise exception 'A client workspace can be shared with up to 10 people.';
  end if;
  insert into public.workspace_invites (owner_id, workspace_id, email)
  values (me, p_workspace, e)
  on conflict (owner_id, workspace_id, email) do update set expires_at = now() + interval '14 days';
  insert into public.audit_log (owner_id, workspace_id, actor_id, kind, summary)
  values (me, p_workspace, me, 'invite-sent', 'Invited ' || e || ' to view this client workspace (read only).');
end;
$$;

create function public.revoke_workspace_invite(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  inv public.workspace_invites;
begin
  select * into inv from public.workspace_invites i where i.id = p_invite and i.owner_id = me;
  if not found then return; end if;
  delete from public.workspace_invites where id = inv.id;
  insert into public.audit_log (owner_id, workspace_id, actor_id, kind, summary)
  values (me, inv.workspace_id, me, 'invite-revoked', 'Cancelled the invite for ' || inv.email || '.');
end;
$$;

-- Called when someone signs in or opens "Shared with you". Needs a confirmed email address,
-- so nobody can claim an invite by signing up with an address they do not own.
create function public.accept_my_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  em text;
  inv record;
  joined integer := 0;
begin
  if me is null then return 0; end if;
  select lower(u.email) into em from auth.users u where u.id = me and u.email_confirmed_at is not null;
  if em is null then return 0; end if;
  for inv in
    select * from public.workspace_invites i where i.email = em and i.expires_at > now() and i.owner_id <> me
  loop
    insert into public.workspace_members (owner_id, workspace_id, user_id, email, role)
    values (inv.owner_id, inv.workspace_id, me, em, inv.role)
    on conflict do nothing;
    delete from public.workspace_invites where id = inv.id;
    insert into public.audit_log (owner_id, workspace_id, actor_id, kind, summary)
    values (inv.owner_id, inv.workspace_id, me, 'member-joined', em || ' accepted the invite and can now view this client workspace.');
    joined := joined + 1;
  end loop;
  return joined;
end;
$$;

-- The owner can remove anyone; a member can remove themselves.
create function public.remove_workspace_member(p_owner uuid, p_workspace text, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  gone public.workspace_members;
begin
  if me is null or (me <> p_owner and me <> p_user) then return; end if;
  delete from public.workspace_members m
  where m.owner_id = p_owner and m.workspace_id = p_workspace and m.user_id = p_user
  returning * into gone;
  if gone.user_id is null then return; end if;
  insert into public.audit_log (owner_id, workspace_id, actor_id, kind, summary)
  values (p_owner, p_workspace, me, 'member-removed',
    case when me = p_user then gone.email || ' left this client workspace.' else 'Removed access for ' || gone.email || '.' end);
end;
$$;

create function public.shared_with_me()
returns table (owner_id uuid, workspace_id text, name text, role text, owner_name text, shared_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.owner_id, m.workspace_id, w.name, m.role,
         coalesce(nullif(p.full_name, ''), 'Your consultant'), m.created_at
  from public.workspace_members m
  join public.workspaces w on w.owner_id = m.owner_id and w.id = m.workspace_id
  left join public.profiles p on p.id = m.owner_id
  where m.user_id = (select auth.uid())
  order by m.created_at desc;
$$;

-- A trimmed, read-only copy. Left out on purpose: the owner's private notes about the client,
-- contact details, chat webhooks and notes written on individual actions.
create function public.shared_workspace(p_owner uuid, p_workspace text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  w public.workspaces;
  m public.workspace_members;
  actions jsonb;
begin
  select * into m from public.workspace_members x
   where x.owner_id = p_owner and x.workspace_id = p_workspace and x.user_id = me;
  if not found then return null; end if;
  select * into w from public.workspaces z where z.owner_id = p_owner and z.id = p_workspace;
  if not found then return null; end if;

  actions := case when jsonb_typeof(w.growth -> 'actions') = 'array'
    then coalesce((select jsonb_agg(a - 'notes') from jsonb_array_elements(w.growth -> 'actions') a), '[]'::jsonb)
    else '[]'::jsonb end;

  -- One history line per person per hour, so refreshing does not flood the log.
  if not exists (
    select 1 from public.audit_log l
    where l.owner_id = p_owner and l.workspace_id = p_workspace and l.actor_id = me
      and l.kind = 'shared-view' and l.at > now() - interval '1 hour'
  ) then
    insert into public.audit_log (owner_id, workspace_id, actor_id, kind, summary)
    values (p_owner, p_workspace, me, 'shared-view', m.email || ' viewed this client workspace.');
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'role', m.role,
    'owner_name', (select coalesce(nullif(p.full_name, ''), 'Your consultant') from public.profiles p where p.id = p_owner),
    'updated_at', w.updated_at,
    'meta', jsonb_build_object(
      'industryId', w.meta -> 'industryId', 'engagement', w.meta -> 'engagement',
      'status', w.meta -> 'status', 'nextReview', w.meta -> 'nextReview', 'createdAt', w.meta -> 'createdAt'),
    'growth', jsonb_build_object('profile', w.growth -> 'profile', 'plan', w.growth -> 'plan', 'actions', actions),
    'dashboard', jsonb_build_object(
      'datasetLibrary', w.dashboard -> 'datasetLibrary',
      'activeDatasetBySector', w.dashboard -> 'activeDatasetBySector',
      'selectedSector', w.dashboard -> 'selectedSector')
  ));
end;
$$;

revoke execute on function
  public.invite_to_workspace(text, text),
  public.revoke_workspace_invite(uuid),
  public.accept_my_invites(),
  public.remove_workspace_member(uuid, text, uuid),
  public.shared_with_me(),
  public.shared_workspace(uuid, text)
from public, anon;
grant execute on function
  public.invite_to_workspace(text, text),
  public.revoke_workspace_invite(uuid),
  public.accept_my_invites(),
  public.remove_workspace_member(uuid, text, uuid),
  public.shared_with_me(),
  public.shared_workspace(uuid, text)
to authenticated;
