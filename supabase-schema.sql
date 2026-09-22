-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Safe to re-run. If you are upgrading an existing database that predates
-- auth, see migrations/001-add-auth.sql instead — this file assumes a fresh
-- project and will not backfill user_id on existing rows.

-- ─── Analyses ─────────────────────────────────────────────────────────────────

create table if not exists analyses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  user_id         uuid not null references auth.users(id) on delete cascade
                    default auth.uid(),
  input_type      text not null check (input_type in ('camera', 'text')),
  input_text      text,
  archetype       text not null,
  confidence      integer not null,
  summary         text not null default '',
  dominant_traits jsonb not null default '[]',
  methodology     jsonb not null default '[]',
  persuasion_angles jsonb not null default '[]',
  outcome         text check (outcome in ('success', 'partial', 'miss')),
  outcome_note    text,
  -- Provenance: which model and prompt produced this reading, so a change
  -- in output quality can be traced to the change that caused it.
  model           text,
  prompt_version  integer,
  updated_at      timestamptz default now(),
  -- These values arrive from an LLM. The app validates them first, but the
  -- database is the only layer that cannot be bypassed.
  constraint analyses_confidence_range check (confidence between 0 and 100),
  constraint analyses_archetype_len    check (char_length(archetype) between 1 and 120),
  constraint analyses_summary_len      check (char_length(summary) <= 4000),
  constraint analyses_note_len         check (outcome_note is null or char_length(outcome_note) <= 2000),
  constraint analyses_input_len        check (input_text is null or char_length(input_text) <= 4000),
  constraint analyses_jsonb_arrays     check (
    jsonb_typeof(dominant_traits)   = 'array' and
    jsonb_typeof(methodology)       = 'array' and
    jsonb_typeof(persuasion_angles) = 'array'
  )
);

alter table analyses enable row level security;

drop policy if exists "Allow all for now" on analyses;
drop policy if exists "Users manage own analyses" on analyses;
create policy "Users manage own analyses"
  on analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists analyses_user_idx on analyses (user_id, created_at desc);

-- ─── Library ──────────────────────────────────────────────────────────────────
-- Retrieval uses Postgres full-text search (no embedding API, no quota limits).

create table if not exists book_chunks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  user_id     uuid not null references auth.users(id) on delete cascade
                default auth.uid(),
  book_title  text not null,
  author      text not null,
  chunk_index integer not null,
  chunk_text  text not null,
  constraint book_chunks_title_len    check (char_length(book_title) between 1 and 200 and char_length(author) <= 200),
  constraint book_chunks_text_len     check (char_length(chunk_text) between 1 and 4000),
  constraint book_chunks_index_nonneg check (chunk_index >= 0 and chunk_index <= 100000)
);

alter table book_chunks enable row level security;

drop policy if exists "Allow all for now" on book_chunks;
drop policy if exists "Users manage own book chunks" on book_chunks;
create policy "Users manage own book chunks"
  on book_chunks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- GIN index powering the full-text search at analysis time
create index if not exists book_chunks_fts_idx
  on book_chunks
  using gin (to_tsvector('english', chunk_text));

create index if not exists book_chunks_user_idx on book_chunks (user_id);

-- One row per passage position per book per user. A retried upload batch
-- would otherwise insert duplicates, inflating storage and letting the same
-- passage be cited twice in one reading.
--
-- On a database that already holds such duplicates this fails with
-- "could not create unique index". That is pre-existing data, not a problem
-- with the index: run migrations/002-hardening.sql, which removes the extra
-- rows first.
create unique index if not exists book_chunks_unique_position
  on book_chunks (user_id, book_title, chunk_index);

-- Keeps updated_at honest on analyses
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists analyses_touch on analyses;
create trigger analyses_touch before update on analyses
  for each row execute function touch_updated_at();

-- Per-user storage cap, enforced in the database. The API enforces it too,
-- but anyone holding the anon key can insert directly from a browser, and
-- on the free tier storage is the resource that actually runs out.
create or replace function enforce_chunk_quota() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n bigint;
begin
  select count(*) into n from book_chunks where user_id = new.user_id;
  if n >= 30000 then
    raise exception 'Storage quota reached for this account (30000 passages).';
  end if;
  return new;
end $$;

drop trigger if exists book_chunks_quota on book_chunks;
create trigger book_chunks_quota before insert on book_chunks
  for each row execute function enforce_chunk_quota();

-- One row per book. The Library page reads this instead of raw chunks,
-- which would otherwise hit PostgREST's 1000-row response cap.
-- security_invoker makes RLS apply, so each user only sees their own books.
create or replace view library_books
with (security_invoker = true) as
select book_title, author, count(*)::int as chunk_count
from book_chunks
group by book_title, author;

-- Relevance-ranked passage lookup used by /api/analyze.
--
-- Terms are OR'd together. plainto_tsquery/websearch_to_tsquery AND their
-- terms, which requires every keyword to appear in one ~1200-char chunk —
-- that matches nothing once you pass two or three words.
--
-- Left as SECURITY INVOKER (the default) so the caller's RLS policy applies
-- and one user's search can never reach another user's books.
create or replace function search_book_chunks(
  query_text  text,
  match_count int default 5
)
returns table (
  book_title text,
  author     text,
  chunk_text text,
  rank       real
)
language sql stable
as $$
  with terms as (
    select array_to_string(
      array(
        select distinct w
        from unnest(
          string_to_array(
            regexp_replace(lower(query_text), '[^a-z0-9 ]', ' ', 'g'),
            ' '
          )
        ) as w
        where length(w) > 3
      ),
      ' | '
    ) as joined
  ),
  q as (
    select case when joined = '' then null
                else to_tsquery('english', joined) end as tsq
    from terms
  )
  select c.book_title, c.author, c.chunk_text,
         ts_rank(to_tsvector('english', c.chunk_text), q.tsq) as rank
  from book_chunks c, q
  where q.tsq is not null
    -- RLS already restricts this to the caller's rows; the explicit
    -- predicate lets the planner use book_chunks_user_idx and keeps the
    -- function correct if it is ever made SECURITY DEFINER by mistake.
    and c.user_id = auth.uid()
    and to_tsvector('english', c.chunk_text) @@ q.tsq
  order by rank desc
  limit least(match_count, 25);
$$;
