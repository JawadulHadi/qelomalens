-- QelomaLens initial schema: user profiles + persisted input envelopes.
-- Safe to re-run on a fresh project via `supabase db push`.

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row, auto-created on signup. Holds display data
-- that's safe to read back to the client (never store authorization data
-- here — see raw_app_meta_data guidance in project docs if that's ever needed).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-create a profile row whenever a new auth user signs up.
-- SECURITY DEFINER is required here to bypass RLS for the insert; Postgres
-- only allows this function to run in trigger context (it returns `trigger`),
-- so it cannot be invoked directly by anon/authenticated roles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- input_envelopes
-- Persists ingested documents so the upload -> run-capabilities -> chat flow
-- survives across separate (stateless) serverless function invocations.
-- Only the backend's service_role key touches this table — RLS is enabled
-- with NO anon/authenticated policies, so it is fully inaccessible via the
-- public Data API even if the table is ever exposed. Access control for
-- per-user isolation is enforced in application code (see
-- src/ingestion/ingestion.service.ts), which checks user_id before
-- returning a row.
-- ---------------------------------------------------------------------------
create table if not exists public.input_envelopes (
  id text primary key,
  tenant_id text not null,
  user_id uuid references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists input_envelopes_user_id_idx on public.input_envelopes (user_id);

alter table public.input_envelopes enable row level security;
-- Intentionally no policies: locked to service_role only.
