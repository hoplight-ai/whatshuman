-- What's Human? / Human or AI? — schema migration for FUN APPS project (jltgyxhuebhcoohttrwd)
-- Reverse-engineered from the Lovable app's data layer (src/lib/game.ts, profiles.ts,
-- auth.ts, routes/leaderboard.tsx, components/signup-modal.tsx).
--
-- Base tables phrases / sessions / votes already exist in this project. This migration:
--   1. adds sessions.user_id (auth linkage)
--   2. ensures the votes dedup constraint
--   3. creates the three missing tables/views: vote_explanations, user_profiles, leaderboard
--   4. (re)applies the RLS policies + grants the app relies on
--
-- Idempotent: safe to run more than once.
--
-- MANUAL STEP (not SQL) required for magic-link signup to work — do this in the
-- Supabase dashboard, Authentication > URL Configuration:
--   - Site URL: the production URL (e.g. https://whatshuman.vercel.app)
--   - Additional Redirect URLs: add the staging Vercel URL and
--     https://whatshuman.vercel.app/?postauth=1 (and the staging equivalent).
--   Email provider is on by default; that's enough for OTP magic links.

begin;

-- 1. sessions.user_id — backfilled best-effort by profiles.attachSessionToUser() ----------
alter table public.sessions
  add column if not exists user_id uuid references auth.users (id) on delete set null;

-- 2. votes dedup — recordVote() treats 23505 as "already voted" success --------------------
-- One vote per (session, phrase). If this fails on existing duplicate rows, dedup them first.
create unique index if not exists votes_session_phrase_uniq
  on public.votes (session_id, phrase_id);

-- 3a. vote_explanations — word-tap + free-text reasoning attached to a vote ----------------
create table if not exists public.vote_explanations (
  id                   uuid primary key default gen_random_uuid(),
  vote_id              uuid not null references public.votes (id) on delete cascade,
  clicked_word_indices integer[] not null default '{}',
  qualitative_text     text,
  created_at           timestamptz not null default now()
);
create index if not exists vote_explanations_vote_id_idx
  on public.vote_explanations (vote_id);

-- 3b. user_profiles — created post magic-link, one row per auth user -----------------------
create table if not exists public.user_profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  username         text not null,
  marketing_opt_in boolean not null default false,
  total_correct    integer not null default 0,
  total_played     integer not null default 0,
  best_streak      integer not null default 0,
  created_at       timestamptz not null default now()
);
-- Case-insensitive uniqueness: profiles.isUsernameAvailable() checks via ilike.
create unique index if not exists user_profiles_username_lower_uniq
  on public.user_profiles (lower(username));

-- 3c. leaderboard view — qualified players (>= 50 plays), ranked by accuracy then volume ---
-- Standard (security-definer) view: exposes only username + aggregate stats publicly,
-- which is the intended public standings, bypassing user_profiles row RLS by design.
create or replace view public.leaderboard as
select
  row_number() over (
    order by (p.total_correct::numeric / nullif(p.total_played, 0)) desc,
             p.total_played desc
  )                                                                      as rank,
  p.user_id,
  p.username,
  round((p.total_correct::numeric / nullif(p.total_played, 0)) * 100, 2) as accuracy,
  p.total_played,
  p.total_correct,
  p.best_streak
from public.user_profiles p
where p.total_played >= 50;

-- 4. RLS + grants -------------------------------------------------------------------------

-- sessions: anon/auth may create (upsert) and update their own session rows.
alter table public.sessions enable row level security;
drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions
  for insert to anon, authenticated with check (true);
drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions
  for update to anon, authenticated using (true) with check (true);
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions
  for select to anon, authenticated using (true);

-- votes: anon/auth may cast and read (community split + top-clicked aggregation).
alter table public.votes enable row level security;
drop policy if exists votes_insert on public.votes;
create policy votes_insert on public.votes
  for insert to anon, authenticated with check (true);
drop policy if exists votes_select on public.votes;
create policy votes_select on public.votes
  for select to anon, authenticated using (true);

-- vote_explanations: anon/auth may attach and read aggregated word-tap data.
alter table public.vote_explanations enable row level security;
drop policy if exists ve_insert on public.vote_explanations;
create policy ve_insert on public.vote_explanations
  for insert to anon, authenticated with check (true);
drop policy if exists ve_select on public.vote_explanations;
create policy ve_select on public.vote_explanations
  for select to anon, authenticated using (true);

-- user_profiles: public read (username availability check runs pre-auth, as anon);
-- a signed-in user may create and update only their own row.
alter table public.user_profiles enable row level security;
drop policy if exists up_select on public.user_profiles;
create policy up_select on public.user_profiles
  for select to anon, authenticated using (true);
drop policy if exists up_insert_own on public.user_profiles;
create policy up_insert_own on public.user_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists up_update_own on public.user_profiles;
create policy up_update_own on public.user_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table/view privileges (RLS gates rows; these gate the operation).
grant select, insert        on public.vote_explanations to anon, authenticated;
grant select, insert, update on public.user_profiles    to anon, authenticated;
grant select                on public.leaderboard       to anon, authenticated;

commit;
