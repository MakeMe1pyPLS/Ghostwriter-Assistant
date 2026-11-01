-- Least-privilege table grants for browser roles. RLS still decides which rows;
-- these grants decide which commands are possible at all.

-- Server-only tables: no browser access at all.
revoke all on public.ai_keys from anon, authenticated;
revoke all on public.billing_events from anon, authenticated;
-- Usage: signed-in users may read their own rows (RLS policy); nothing else.
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
-- Profiles: signed-in users read their own and may edit only full_name.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
-- Workspaces: full CRUD on own rows via RLS, but never TRUNCATE/TRIGGER/REFERENCES.
revoke all on public.workspaces from anon, authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
-- New tables created later start with no browser access unless granted on purpose.
alter default privileges in schema public revoke all on tables from anon, authenticated;
