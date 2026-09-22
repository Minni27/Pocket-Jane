-- Migration 002 — constraints, provenance, and per-user storage caps
--
-- Run this in: Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run. Assumes 001 (or a fresh supabase-schema.sql) has run.
--
-- The editor runs the whole file in one transaction, so a failure part way
-- through leaves the database exactly as it was. Re-run it after fixing the
-- cause; every statement here is idempotent.
--
-- Everything here is free: constraints and indexes, no extensions, no
-- scheduled jobs, no external services.
--
-- STEP 0 normalises data that predates these rules. Without it the
-- constraints fail on rows written before they existed, which is not a
-- problem with the constraint — it is the old rows being out of bounds.


-- ═══ 0. Normalise existing rows to the new bounds ══════════════════
-- Run before any constraint is added. Each statement touches only rows
-- that are already out of bounds; a database with none is unaffected.
--
-- To see what this will change before running it, use the INSPECT queries
-- in the comments beside each statement.

-- Confidence arrives from an LLM. Anything outside 0–100 is clamped rather
-- than deleted: the archetype and reasoning in that row are still the
-- user's reading, and the calibration loop needs its outcome.
--   INSPECT: select count(*) from analyses where confidence not between 0 and 100;
update analyses set confidence = least(100, greatest(0, confidence))
  where confidence not between 0 and 100;

-- Over-long text, truncated to the new ceiling.
--   INSPECT: select count(*) from analyses where char_length(archetype) > 120;
update analyses set archetype = left(archetype, 120) where char_length(archetype) > 120;
update analyses set summary = left(summary, 4000) where char_length(summary) > 4000;
update analyses set outcome_note = left(outcome_note, 2000) where char_length(outcome_note) > 2000;
update analyses set input_text = left(input_text, 4000) where char_length(input_text) > 4000;

-- An empty archetype cannot satisfy the length check and carries no meaning.
update analyses set archetype = 'Unnamed' where coalesce(trim(archetype), '') = '';

-- The jsonb columns must be arrays. A row holding an object or a string
-- there predates validation and would break the history page anyway.
update analyses set dominant_traits = '[]'::jsonb   where jsonb_typeof(dominant_traits) <> 'array';
update analyses set methodology = '[]'::jsonb       where jsonb_typeof(methodology) <> 'array';
update analyses set persuasion_angles = '[]'::jsonb where jsonb_typeof(persuasion_angles) <> 'array';

-- Book titles and authors. The old filename parser did not truncate, so a
-- long filename could produce a title past 200 characters.
--
-- This runs BEFORE the de-duplication below, deliberately: truncating two
-- titles that differ only past character 200 makes them the same book, and
-- that collision has to be resolved by the dedup, not left for the unique
-- index to trip over.
--   INSPECT: select distinct book_title from book_chunks where char_length(book_title) > 200;
update book_chunks set book_title = left(book_title, 200) where char_length(book_title) > 200;
update book_chunks set author = left(author, 200) where char_length(author) > 200;
update book_chunks set author = 'Unknown' where coalesce(trim(author), '') = '';

-- Passages. Old chunking produced ~1200 characters, so this is normally a
-- no-op; an empty passage is deleted because it cannot be cited.
update book_chunks set chunk_text = left(chunk_text, 4000) where char_length(chunk_text) > 4000;
delete from book_chunks where coalesce(trim(chunk_text), '') = '';

-- A negative or absurd position cannot be ordered against the others.
delete from book_chunks where chunk_index < 0 or chunk_index > 100000;


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
-- inserted duplicates, which inflated storage and let the same passage be
-- cited twice in one reading — the citation then looked like two independent
-- pieces of evidence for the same claim.
--
-- Existing databases already hold those duplicates, so they are removed
-- first. The newest row per position is kept: if a book was re-uploaded and
-- the delete-first did not complete, the newest rows are the ones from the
-- most recent parse.
--
-- This deletes rows. It only ever removes extras that share a position with
-- a row it keeps, never the last row at any position, so no passage is lost.
-- Run the INSPECT query below first if you want to see what it will touch.

-- INSPECT (optional, read-only):
--   select book_title, count(*) as positions_affected, sum(extras) as rows_to_remove
--   from (
--     select user_id, book_title, chunk_index, count(*) - 1 as extras
--     from book_chunks
--     group by user_id, book_title, chunk_index
--     having count(*) > 1
--   ) d
--   group by book_title
--   order by rows_to_remove desc;

with ranked as (
  select id,
         row_number() over (
           partition by user_id, book_title, chunk_index
           order by created_at desc nulls last, id desc
         ) as rn
  from book_chunks
)
delete from book_chunks
where id in (select id from ranked where rn > 1);

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


-- ═══ 7. Verify ═════════════════════════════════════════════════════
-- Read-only. Run this after the migration to confirm the result.
--
--   -- Should return no rows: every position is now unique.
--   select user_id, book_title, chunk_index, count(*)
--   from book_chunks group by 1,2,3 having count(*) > 1;
--
--   -- Passage count per book, to compare against what you uploaded.
--   select book_title, author, count(*) as passages
--   from book_chunks group by 1,2 order by 1;
--
--   -- Confirms the new columns exist.
--   select column_name from information_schema.columns
--   where table_name = 'analyses'
--     and column_name in ('model','prompt_version','updated_at');
--
-- If a book's passage count dropped noticeably, it had been uploaded more
-- than once and the two copies were chunked differently, so the kept rows
-- may interleave two parses. Re-upload that book from the Library page: the
-- upload deletes the existing copy by title first, so you get one clean
-- parse. Nothing else needs to be done.
