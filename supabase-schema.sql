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
  outcome_note    text
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
  chunk_text  text not null
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
    and to_tsvector('english', c.chunk_text) @@ q.tsq
  order by rank desc
  limit match_count;
$$;
