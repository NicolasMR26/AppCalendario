-- DayGridK&N — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- Assumes Supabase Auth is enabled; every row is scoped to auth.uid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------------
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  professor text,
  color text not null default '#5B8DEF',
  day smallint not null check (day between 1 and 7),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subjects_user_id_idx on subjects(user_id);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  text text not null,
  date date,
  sort_order integer not null default 0,
  alert_email boolean not null default false,
  alert_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_subject_id_idx on notes(subject_id);
create index if not exists notes_due_alert_idx on notes(date) where alert_email and alert_sent_at is null;

-- ---------------------------------------------------------------------------
-- user_settings (one row per user: alert email override, theme, lead time)
-- ---------------------------------------------------------------------------
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alert_email text,
  theme_mode text not null default 'system' check (theme_mode in ('system', 'light', 'dark')),
  reminder_lead_days smallint not null default 2,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- alert_queue — schedule-change notifications land here via trigger below;
-- due-date reminders are computed on the fly by the scheduled function instead
-- of being queued, so this table only ever holds 'schedule_change' events.
-- ---------------------------------------------------------------------------
create table if not exists alert_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('schedule_change')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists alert_queue_pending_idx on alert_queue(user_id) where sent_at is null;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subjects_set_updated_at on subjects;
create trigger subjects_set_updated_at before update on subjects
  for each row execute function set_updated_at();

drop trigger if exists notes_set_updated_at on notes;
create trigger notes_set_updated_at before update on notes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- schedule-change queueing: when a subject's day/time actually changes,
-- enqueue an alert_queue row the scheduled function will email out.
-- ---------------------------------------------------------------------------
create or replace function enqueue_schedule_change()
returns trigger language plpgsql as $$
begin
  if (new.day, new.start_time, new.end_time) is distinct from (old.day, old.start_time, old.end_time) then
    insert into alert_queue (user_id, kind, payload)
    values (
      new.user_id,
      'schedule_change',
      jsonb_build_object(
        'subject_id', new.id,
        'subject_name', new.name,
        'old_day', old.day, 'old_start_time', old.start_time, 'old_end_time', old.end_time,
        'new_day', new.day, 'new_start_time', new.start_time, 'new_end_time', new.end_time
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists subjects_enqueue_schedule_change on subjects;
create trigger subjects_enqueue_schedule_change after update on subjects
  for each row execute function enqueue_schedule_change();

-- ---------------------------------------------------------------------------
-- Row Level Security — every table is scoped to the owning user
-- ---------------------------------------------------------------------------
alter table subjects enable row level security;
alter table notes enable row level security;
alter table user_settings enable row level security;
alter table alert_queue enable row level security;

create policy "subjects_owner_all" on subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes_owner_all" on notes
  for all using (
    exists (select 1 from subjects s where s.id = notes.subject_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from subjects s where s.id = notes.subject_id and s.user_id = auth.uid())
  );

create policy "user_settings_owner_all" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "alert_queue_owner_read" on alert_queue
  for select using (auth.uid() = user_id);
-- Inserts/updates to alert_queue happen via the trigger (security definer context)
-- and the scheduled Edge Function using the service_role key, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Scheduling the reminder sweep with pg_cron + pg_net (Supabase-managed extensions).
-- Run once after deploying the `schedule-alerts` Edge Function; replace the
-- project ref and service role key with your own (Settings -> API).
-- ---------------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'daygridkn-daily-alerts',
--   '0 8 * * *', -- every day at 08:00 UTC
--   $$
--   select net.http_post(
--     url := 'https://YOUR_PROJECT_REF.functions.supabase.co/schedule-alerts',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
