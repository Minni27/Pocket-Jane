-- Migration 002 — constraints, provenance, and per-user storage caps
--
-- Run this in: Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run. Assumes 001 (or a fresh supabase-schema.sql) has run.
--
-- Everything here is free: constraints and indexes, no extensions, no
-- scheduled jobs, no external services.


-- ═══ 1. Constrain the columns the model writes ═════════════════════
-- These values come from an LLM response. The app now validates them
-- before the insert, but the database is the only place that cannot be
-- bypassed, and a bad row poisons the calibration loop for that account.

alter table analyses drop constraint if exists analyses_confidence_range;
alter table analyses add constraint analyses_confidence_range
  check (confidence between 0 and 100);

alter table analyses drop constraint if exists analyses_archetype_len;
alter table analyses add constraint analyses_archetype_len
  check (char_length(archetype) between 1 and 120);

alter table analyses drop constraint if exists analyses_summary_len;
alter table analyses add constraint analyses_summary_len
  check (char_length(summary) <= 4000);

-- Free text the user types. Unbounded, it is a cheap way to fill the
-- 500MB free tier, and it is injected into later prompts.
alter table analyses drop constraint if exists analyses_note_len;
alter table analyses add constraint analyses_note_len
  check (outcome_note is null or char_length(outcome_note) <= 2000);

alter table analyses drop constraint if exists analyses_input_len;
alter table analyses add constraint analyses_input_len
  check (input_text is null or char_length(input_text) <= 4000);

-- The jsonb columns must be arrays, not an object or a bare string
alter table analyses drop constraint if exists analyses_jsonb_arrays;
alter table analyses add constraint analyses_jsonb_arrays check (
  jsonb_typeof(dominant_traits)   = 'array' and
  jsonb_typeof(methodology)       = 'array' and
  jsonb_typeof(persuasion_angles) = 'array'
);


-- ═══ 2. Provenance ═════════════════════════════════════════════════
-- Which model and which prompt produced a reading. Without these, a drop
-- in quality cannot be traced to the change that caused it.

alter table analyses add column if not exists model          text;
alter table analyses add column if not exists prompt_version integer;
alter table analyses add column if not exists updated_at     timestamptz default now();

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists analyses_touch on analyses;
create trigger analyses_touch before update on analyses
  for each row execute function touch_updated_at();


-- ═══ 3. Book chunk constraints ═════════════════════════════════════

alter table book_chunks drop constraint if exists book_chunks_title_len;
alter table book_chunks add constraint book_chunks_title_len
  check (char_length(book_title) between 1 and 200 and char_length(author) <= 200);

alter table book_chunks drop constraint if exists book_chunks_text_len;
alter table book_chunks add constraint book_chunks_text_len
  check (char_length(chunk_text) between 1 and 4000);

alter table book_chunks drop constraint if exists book_chunks_index_nonneg;
alter table book_chunks add constraint book_chunks_index_nonneg
  check (chunk_index >= 0 and chunk_index <= 100000);

-- One row per passage position per book per user. A retried upload batch
-- used to insert duplicates, which inflated storage and let the same
-- passage be cited twice in one reading.
create unique index if not exists book_chunks_unique_position
  on book_chunks (user_id, book_title, chunk_index);


-- ═══ 4. Per-user storage cap, enforced in the database ═════════════
-- The API enforces this too, but the API can be bypassed by anyone
-- holding the anon key — the browser client talks to Postgres directly.
-- On the free tier, storage is the resource that actually runs out.

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


-- ═══ 5. Explicit tenant scoping in the search function ═════════════
-- RLS already restricts this to the caller's rows. Adding the predicate
-- means the planner can use book_chunks_user_idx, and the function is
-- still correct if it is ever made SECURITY DEFINER by mistake.

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
    and c.user_id = auth.uid()
    and to_tsvector('english', c.chunk_text) @@ q.tsq
  order by rank desc
  limit least(match_count, 25);
$$;


-- ═══ 6. Composite index for the rate-limit count ═══════════════════
-- The hourly limit counts rows by (user_id, created_at). analyses_user_idx
-- already covers it; this is here only if that index is missing.
create index if not exists analyses_user_created_idx
  on analyses (user_id, created_at desc);
