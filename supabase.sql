-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.entries (
  person text not null check (person in ('braden', 'kat')),
  day int not null check (day between 1 and 30),
  avoided_alcohol boolean not null default false,
  avoided_drugs boolean not null default false,
  avoided_sugar boolean not null default false,
  exercised boolean not null default false,
  exercise_text text not null default '',
  note_to_other text not null default '',
  updated_at timestamptz not null default now(),
  primary key (person, day)
);

alter table public.entries enable row level security;

-- No logins by design: anyone with the site link can read and write.
-- Only these two operations are allowed; there is no delete policy.
create policy "anyone can read" on public.entries
  for select to anon using (true);
create policy "anyone can insert" on public.entries
  for insert to anon with check (true);
create policy "anyone can update" on public.entries
  for update to anon using (true) with check (true);

-- Live sync between your two devices.
alter publication supabase_realtime add table public.entries;
