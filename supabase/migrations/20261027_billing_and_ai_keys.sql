-- Phase 3: billing, customers' own AI keys, and AI usage.
-- Only the server (service role) writes any of this. Customers can read their
-- own usage; nobody can read stored keys from the browser.

-- ---------------------------------------------------------------- billing
alter table public.profiles
  add column stripe_customer_id text unique,
  add column subscription_status text,
  add column current_period_end timestamptz,
  add column billing_interval text check (billing_interval in ('monthly', 'yearly'));

-- The existing grant already limits app updates to full_name; restate it so
-- the new billing columns are never writable from the browser.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Stripe event ids we've handled, so a replayed webhook is ignored.
create table public.billing_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);
alter table public.billing_events enable row level security;
-- No policies: only the service role can touch it.

-- ---------------------------------------------------------------- AI keys
-- Keys customers connect for Claude, ChatGPT or Gemini. `secret` is
-- AES-256-GCM ciphertext made on the server; the browser only ever sees
-- the last four characters.
create table public.ai_keys (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('claude', 'openai', 'gemini')),
  secret text not null check (char_length(secret) < 2000),
  key_last4 text not null check (char_length(key_last4) <= 4),
  model text check (char_length(model) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.ai_keys enable row level security;
-- No policies on purpose: the browser can't read or write keys, even its own.

-- ---------------------------------------------------------------- AI usage
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  answers integer not null default 0 check (answers >= 0),
  primary key (user_id, month)
);
alter table public.ai_usage enable row level security;

create policy "Users can read their own AI usage"
  on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.ai_usage from anon, authenticated;

-- Atomic +1, called by the server after an AI answer on our keys.
create function public.increment_ai_usage(p_user uuid, p_month text)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage (user_id, month, answers)
  values (p_user, p_month, 1)
  on conflict (user_id, month) do update set answers = public.ai_usage.answers + 1
  returning answers;
$$;

revoke execute on function public.increment_ai_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_ai_usage(uuid, text) to service_role;
