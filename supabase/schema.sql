-- Run in Supabase SQL Editor. Anonymous clients have no direct table access.
create table if not exists public.sessions (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 host_token text not null,
 round integer not null default 0 check (round between 0 and 5),
 finished boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.teams (
 session_id uuid not null references public.sessions(id) on delete cascade,
 team_id integer not null check (team_id between 0 and 3),
 token text not null,
 state jsonb not null,
 pending jsonb,
 primary key (session_id,team_id)
);
alter table public.sessions enable row level security;
alter table public.teams enable row level security;
revoke all on public.sessions, public.teams from anon, authenticated;
-- The Edge Function uses a service-role client; never put the service key in a browser.
