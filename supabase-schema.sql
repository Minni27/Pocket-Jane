-- Run this in: Supabase Dashboard → SQL Editor → New query

create table if not exists analyses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
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
create policy "Allow all for now"
  on analyses for all
  using (true)
  with check (true);

-- ─── Library tables ───────────────────────────────────────────────────────────
-- Retrieval uses Postgres full-text search (no embedding API, no quota limits).

create table if not exists book_chunks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  book_title  text not null,
  author      text not null,
  chunk_index integer not null,
  chunk_text  text not null
);

alter table book_chunks enable row level security;
create policy "Allow all for now"
  on book_chunks for all
  using (true)
  with check (true);

-- GIN index powering the full-text search at analysis time
create index if not exists book_chunks_fts_idx
  on book_chunks
  using gin (to_tsvector('english', chunk_text));

-- One row per book. The Library page reads this instead of raw chunks,
-- which would otherwise hit PostgREST's 1000-row response cap.
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
