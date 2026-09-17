-- Migration: open tables → per-user ownership
--
-- Only needed if your database predates auth (tables with the
-- "Allow all for now" policy). Fresh projects should just run
-- supabase-schema.sql instead.
--
-- Run STEP 1, then create your account in the app, then run STEP 2.
-- Splitting it matters: existing rows have no owner, and you cannot
-- assign one until a user exists to assign them to.


-- ═══ STEP 1 — run this first ═══════════════════════════════════════
-- Adds the column as nullable and leaves the open policy in place, so
-- the app keeps working while you go and sign up.

alter table analyses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table book_chunks
  add column if not exists user_id uuid references auth.users(id) on delete cascade;


-- ═══ Now go to /login in the app and create your account. ══════════
-- Then come back and run STEP 2.


-- ═══ STEP 2 — run after signing up ═════════════════════════════════
-- Claims all pre-auth rows for your account, then locks the tables down.
--
-- Replace the email below with the one you signed up with.
-- If more than one account exists, only rows with a NULL user_id are
-- touched, so this is safe to run once per account.

do $$
declare
  target_user uuid;
begin
  select id into target_user
  from auth.users
  where email = 'you@example.com'   -- ← CHANGE THIS
  limit 1;

  if target_user is null then
    raise exception 'No user found with that email — sign up in the app first.';
  end if;

  update analyses    set user_id = target_user where user_id is null;
  update book_chunks set user_id = target_user where user_id is null;

  raise notice 'Claimed % analyses and % book chunks',
    (select count(*) from analyses    where user_id = target_user),
    (select count(*) from book_chunks where user_id = target_user);
end $$;

-- Lock the columns down now that every row has an owner
alter table analyses    alter column user_id set not null;
alter table analyses    alter column user_id set default auth.uid();
alter table book_chunks alter column user_id set not null;
alter table book_chunks alter column user_id set default auth.uid();

-- Swap the open policies for per-user ones
drop policy if exists "Allow all for now" on analyses;
drop policy if exists "Users manage own analyses" on analyses;
create policy "Users manage own analyses"
  on analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Allow all for now" on book_chunks;
drop policy if exists "Users manage own book chunks" on book_chunks;
create policy "Users manage own book chunks"
  on book_chunks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists analyses_user_idx    on analyses (user_id, created_at desc);
create index if not exists book_chunks_user_idx on book_chunks (user_id);

-- Rebuild the view so RLS applies to it
create or replace view library_books
with (security_invoker = true) as
select book_title, author, count(*)::int as chunk_count
from book_chunks
group by book_title, author;
