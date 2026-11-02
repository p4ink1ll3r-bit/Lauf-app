-- Meldungen aus der App ("Fehler melden", "Lauf fehlt?")
-- Im Supabase-Fenster "SQL Editor" einfügen und auf "Run" klicken.
-- Die App darf nur NEUE Meldungen senden (insert), aber keine lesen, ändern oder löschen.

create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type       text not null check (type in ('fehler', 'fehlt')),
  status     text not null default 'neu' check (status = 'neu'),
  race       text check (char_length(race) <= 120),
  race_name  text check (char_length(race_name) <= 200),
  kind       text check (char_length(kind) <= 80),
  name       text check (char_length(name) <= 200),
  place      text check (char_length(place) <= 200),
  date       text check (char_length(date) <= 20),
  link       text check (char_length(link) <= 500),
  text       text check (char_length(text) <= 2000),
  created    text check (char_length(created) <= 40)
);

alter table public.reports enable row level security;

drop policy if exists "App darf melden" on public.reports;
create policy "App darf melden"
  on public.reports
  for insert
  to anon
  with check (true);

-- Lesen, Ändern, Löschen: für anon keine Regel = nicht erlaubt.
