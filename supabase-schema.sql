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

-- Enable Row Level Security (open for now — add auth later)
alter table analyses enable row level security;

create policy "Allow all for now"
  on analyses for all
  using (true)
  with check (true);
