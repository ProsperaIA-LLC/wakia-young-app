-- ============================================================
-- Migration: Initial schema — Prospera Young AI Platform
-- Run this FIRST in Supabase SQL Editor (or via CLI).
-- Idempotent: uses IF NOT EXISTS everywhere.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── users ────────────────────────────────────────────────────
-- Mirrors auth.users with app-specific profile data.
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text not null,
  nickname        text,
  country         text,
  role            text not null default 'student'
                    check (role in ('student', 'mentor', 'admin')),
  avatar_url      text,
  timezone        text,
  age             integer,
  parent_consent  boolean not null default false,
  market          text check (market in ('LATAM', 'USA')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- ── cohorts ──────────────────────────────────────────────────
create table if not exists public.cohorts (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  market           text not null check (market in ('LATAM', 'USA')),
  start_date       date not null,
  end_date         date not null,  -- start_date + 42 days
  status           text not null default 'upcoming'
                     check (status in ('upcoming', 'active', 'completed')),
  price_full_usd   numeric(10,2),
  price_early_usd  numeric(10,2),
  max_students     integer not null default 30,
  current_week     integer not null default 1,
  created_at       timestamptz not null default now()
);

-- ── pods ─────────────────────────────────────────────────────
create table if not exists public.pods (
  id                  uuid primary key default gen_random_uuid(),
  cohort_id           uuid not null references public.cohorts(id) on delete cascade,
  name                text not null,
  timezone_region     text,
  discord_channel_url text,
  created_at          timestamptz not null default now()
);

-- ── pod_members ──────────────────────────────────────────────
create table if not exists public.pod_members (
  id                       uuid primary key default gen_random_uuid(),
  pod_id                   uuid not null references public.pods(id) on delete cascade,
  user_id                  uuid not null references public.users(id) on delete cascade,
  cohort_id                uuid not null references public.cohorts(id) on delete cascade,
  buddy_id                 uuid references public.users(id),
  is_pod_leader_this_week  boolean not null default false,
  pod_leader_week_number   integer,
  joined_at                timestamptz not null default now(),
  unique (pod_id, user_id)
);

-- ── weeks ────────────────────────────────────────────────────
create table if not exists public.weeks (
  id                       uuid primary key default gen_random_uuid(),
  cohort_id                uuid not null references public.cohorts(id) on delete cascade,
  week_number              integer not null,    -- 1-6
  phase                    text not null check (phase in ('Despertar', 'Construir', 'Lanzar')),
  title                    text not null,
  opening_question         text not null,
  deliverable_description  text not null,
  success_signal           text not null,
  reflection_q1            text not null default '',
  reflection_q2            text not null default '',
  tools                    text[],
  mentor_video_url         text,
  notion_guide_url         text,
  unlock_date              date not null,
  due_date                 date not null,
  created_at               timestamptz not null default now(),
  unique (cohort_id, week_number)
);

-- ── enrollments ──────────────────────────────────────────────
create table if not exists public.enrollments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  cohort_id           uuid not null references public.cohorts(id) on delete cascade,
  market              text not null check (market in ('LATAM', 'USA')),
  price_paid_usd      numeric(10,2) not null default 0,
  is_scholarship      boolean not null default false,
  stripe_payment_id   text,
  stripe_customer_id  text,
  status              text not null default 'active'
                        check (status in ('active', 'completed', 'dropped')),
  enrolled_at         timestamptz not null default now(),
  completed_at        timestamptz,
  unique (user_id, cohort_id)
);

-- ── deliverables ─────────────────────────────────────────────
create table if not exists public.deliverables (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  week_id          uuid not null references public.weeks(id) on delete cascade,
  cohort_id        uuid not null references public.cohorts(id) on delete cascade,
  content          text,
  status           text not null default 'not_started'
                     check (status in ('not_started', 'draft', 'pending', 'submitted', 'reviewed')),
  mentor_feedback  text,
  buddy_feedback   text,
  submitted_at     timestamptz,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, week_id)
);

drop trigger if exists deliverables_updated_at on public.deliverables;
create trigger deliverables_updated_at
  before update on public.deliverables
  for each row execute procedure public.set_updated_at();

-- ── reflections ──────────────────────────────────────────────
-- Only available Sundays, only after deliverable is submitted.
create table if not exists public.reflections (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  cohort_id        uuid references public.cohorts(id),
  week_id          uuid not null references public.weeks(id) on delete cascade,
  deliverable_id   uuid references public.deliverables(id),
  q1               text,
  q2               text,
  q3               text,
  status           text check (status in ('draft', 'submitted')),
  mentor_feedback  text,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (user_id, week_id)
);

-- ── chat_messages ────────────────────────────────────────────
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  cohort_id   uuid references public.cohorts(id),
  week_id     uuid references public.weeks(id),
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  tokens_used integer,
  created_at  timestamptz not null default now()
);

-- ── activity_log ─────────────────────────────────────────────
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  cohort_id  uuid references public.cohorts(id),
  action     text not null check (action in (
               'login', 'deliverable_submitted', 'chat_message',
               'reflection_submitted', 'pod_checkin', 'video_viewed',
               'buddy_message_sent')),
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- ── mentor_alerts ────────────────────────────────────────────
create table if not exists public.mentor_alerts (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.users(id) on delete cascade,
  cohort_id   uuid not null references public.cohorts(id) on delete cascade,
  alert_type  text not null check (alert_type in (
                'inactive_48h', 'inactive_72h',
                'no_deliverable', 'buddy_no_response')),
  severity    text not null check (severity in ('yellow', 'red')),
  message     text,
  is_resolved boolean not null default false,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ── mentor_notes ─────────────────────────────────────────────
create table if not exists public.mentor_notes (
  id          uuid primary key default gen_random_uuid(),
  mentor_id   uuid not null references public.users(id),
  student_id  uuid not null references public.users(id),
  cohort_id   uuid not null references public.cohorts(id),
  note        text not null,
  created_at  timestamptz not null default now()
);

-- ── pod_summaries ────────────────────────────────────────────
create table if not exists public.pod_summaries (
  id            uuid primary key default gen_random_uuid(),
  pod_id        uuid not null references public.pods(id) on delete cascade,
  cohort_id     uuid not null references public.cohorts(id) on delete cascade,
  week_number   integer not null,
  pod_leader_id uuid not null references public.users(id),
  summary_text  text not null,
  submitted_at  timestamptz not null default now()
);

-- ── scholarship_applications ─────────────────────────────────
create table if not exists public.scholarship_applications (
  id                uuid primary key default gen_random_uuid(),
  cohort_id         uuid references public.cohorts(id),
  applicant_name    text not null,
  applicant_email   text not null,
  applicant_age     integer not null,
  applicant_country text not null,
  motivation_letter text not null,
  video_url         text,
  reference_name    text,
  reference_contact text,
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  reviewed_by       uuid references public.users(id),
  reviewed_at       timestamptz,
  notes             text,
  created_at        timestamptz not null default now()
);

-- ── competency_scores ────────────────────────────────────────
create table if not exists public.competency_scores (
  id                      uuid primary key default gen_random_uuid(),
  student_id              uuid not null references public.users(id) on delete cascade,
  cohort_id               uuid not null references public.cohorts(id) on delete cascade,
  validation_score        numeric(3,1) not null default 0 check (validation_score between 0 and 4),
  creation_score          numeric(3,1) not null default 0 check (creation_score between 0 and 4),
  communication_score     numeric(3,1) not null default 0 check (communication_score between 0 and 4),
  growth_score            numeric(3,1) not null default 0 check (growth_score between 0 and 4),
  attendance_percent      integer not null default 0,
  presented_at_demo_day   boolean not null default false,
  scored_by               uuid references public.users(id),
  scored_at               timestamptz,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (student_id, cohort_id)
);

drop trigger if exists competency_scores_updated_at on public.competency_scores;
create trigger competency_scores_updated_at
  before update on public.competency_scores
  for each row execute procedure public.set_updated_at();

-- ── Views ────────────────────────────────────────────────────

create or replace view public.cohort_overview as
select
  c.id                                                          as cohort_id,
  c.name                                                        as cohort_name,
  c.market,
  c.status,
  c.current_week,
  count(e.id) filter (where e.status != 'dropped')              as total_students,
  count(e.id) filter (where e.status = 'active')                as active_students,
  count(e.id) filter (where e.status = 'dropped')               as dropped_students,
  count(a.id) filter (where a.severity = 'red'  and not a.is_resolved) as red_alerts,
  count(a.id) filter (where a.severity = 'yellow' and not a.is_resolved) as yellow_alerts
from public.cohorts c
left join public.enrollments e on e.cohort_id = c.id
left join public.mentor_alerts a on a.cohort_id = c.id
group by c.id;

create or replace view public.student_progress as
select
  u.id                                                         as user_id,
  u.full_name,
  u.nickname,
  u.country,
  e.cohort_id,
  e.status                                                     as enrollment_status,
  pm.pod_id,
  p.name                                                       as pod_name,
  pm.buddy_id,
  coalesce(pm.is_pod_leader_this_week, false)                  as is_pod_leader_this_week,
  count(distinct d.id) filter (where d.status in ('submitted','reviewed')) as deliverables_submitted,
  count(distinct r.id) filter (where r.status = 'submitted')  as reflections_submitted,
  max(al.created_at)                                           as last_activity_at,
  extract(epoch from (now() - max(al.created_at))) / 3600      as hours_since_activity,
  count(distinct ma.id) filter (where not ma.is_resolved)      as open_alerts
from public.users u
join public.enrollments e on e.user_id = u.id
left join public.pod_members pm on pm.user_id = u.id and pm.cohort_id = e.cohort_id
left join public.pods p on p.id = pm.pod_id
left join public.deliverables d on d.user_id = u.id and d.cohort_id = e.cohort_id
left join public.reflections r on r.user_id = u.id and r.cohort_id = e.cohort_id
left join public.activity_log al on al.user_id = u.id and al.cohort_id = e.cohort_id
left join public.mentor_alerts ma on ma.student_id = u.id and ma.cohort_id = e.cohort_id
where u.role = 'student'
group by u.id, e.cohort_id, e.status, pm.pod_id, p.name, pm.buddy_id, pm.is_pod_leader_this_week;

-- ── Functions ────────────────────────────────────────────────

-- Count total chat messages sent today by a user (for the 15-msg daily limit)
create or replace function public.get_daily_message_count(p_user_id uuid)
returns integer language sql stable as $$
  select count(*)::integer
  from public.chat_messages
  where user_id = p_user_id
    and role = 'user'
    and created_at >= current_date
    and created_at <  current_date + interval '1 day';
$$;

-- Hours since last activity_log entry for a user
create or replace function public.hours_since_last_activity(p_user_id uuid)
returns numeric language sql stable as $$
  select extract(epoch from (now() - max(created_at))) / 3600
  from public.activity_log
  where user_id = p_user_id;
$$;

-- ── Row-Level Security ───────────────────────────────────────

alter table public.users                  enable row level security;
alter table public.cohorts                enable row level security;
alter table public.pods                   enable row level security;
alter table public.pod_members            enable row level security;
alter table public.weeks                  enable row level security;
alter table public.enrollments            enable row level security;
alter table public.deliverables           enable row level security;
alter table public.reflections            enable row level security;
alter table public.chat_messages          enable row level security;
alter table public.activity_log           enable row level security;
alter table public.mentor_alerts          enable row level security;
alter table public.mentor_notes           enable row level security;
alter table public.pod_summaries          enable row level security;
alter table public.scholarship_applications enable row level security;
alter table public.competency_scores      enable row level security;

-- users: read own row; mentors/admins can read all students
create policy "users_select_own" on public.users for select
  using (auth.uid() = id);
create policy "users_select_mentor" on public.users for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));
create policy "users_insert_own" on public.users for insert
  with check (auth.uid() = id);
create policy "users_update_own" on public.users for update
  using (auth.uid() = id);

-- cohorts: all authenticated users can read
create policy "cohorts_select" on public.cohorts for select
  using (auth.role() = 'authenticated');
create policy "cohorts_write_admin" on public.cohorts for all
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- pods: readable by cohort members
create policy "pods_select" on public.pods for select
  using (exists (
    select 1 from public.enrollments e
    where e.cohort_id = pods.cohort_id and e.user_id = auth.uid()
  ));

-- pod_members: readable by cohort members
create policy "pod_members_select" on public.pod_members for select
  using (exists (
    select 1 from public.enrollments e
    where e.cohort_id = pod_members.cohort_id and e.user_id = auth.uid()
  ));

-- weeks: readable by enrolled students and mentors
create policy "weeks_select" on public.weeks for select
  using (exists (
    select 1 from public.enrollments e
    where e.cohort_id = weeks.cohort_id and e.user_id = auth.uid()
  ) or exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));

-- enrollments: read own
create policy "enrollments_select_own" on public.enrollments for select
  using (user_id = auth.uid());
create policy "enrollments_select_mentor" on public.enrollments for select
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));

-- deliverables: read/write own; mentors read all
create policy "deliverables_select_own" on public.deliverables for select
  using (user_id = auth.uid());
create policy "deliverables_select_mentor" on public.deliverables for select
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));
create policy "deliverables_insert_own" on public.deliverables for insert
  with check (user_id = auth.uid());
create policy "deliverables_update_own" on public.deliverables for update
  using (user_id = auth.uid());

-- reflections: read/write own; mentors read all
create policy "reflections_select_own" on public.reflections for select
  using (user_id = auth.uid());
create policy "reflections_select_mentor" on public.reflections for select
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));
create policy "reflections_insert_own" on public.reflections for insert
  with check (user_id = auth.uid());
create policy "reflections_update_own" on public.reflections for update
  using (user_id = auth.uid());

-- chat_messages: own only
create policy "chat_messages_own" on public.chat_messages for all
  using (user_id = auth.uid());

-- activity_log: own read; insert open to authenticated (API writes on behalf of user)
create policy "activity_log_select_own" on public.activity_log for select
  using (user_id = auth.uid());
create policy "activity_log_select_mentor" on public.activity_log for select
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));
create policy "activity_log_insert" on public.activity_log for insert
  with check (user_id = auth.uid());

-- mentor_alerts: mentors read/write; students read own
create policy "mentor_alerts_select_own" on public.mentor_alerts for select
  using (student_id = auth.uid());
create policy "mentor_alerts_mentor" on public.mentor_alerts for all
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));

-- mentor_notes: mentors only
create policy "mentor_notes_mentor" on public.mentor_notes for all
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));

-- pod_summaries: pod members can read; pod leader can insert
create policy "pod_summaries_select" on public.pod_summaries for select
  using (exists (
    select 1 from public.pod_members pm
    where pm.pod_id = pod_summaries.pod_id and pm.user_id = auth.uid()
  ));
create policy "pod_summaries_insert" on public.pod_summaries for insert
  with check (pod_leader_id = auth.uid());

-- scholarship_applications: insert by anyone; read by admins
create policy "scholarship_insert" on public.scholarship_applications for insert
  with check (true);
create policy "scholarship_select_admin" on public.scholarship_applications for select
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- competency_scores: students read own; mentors read/write
create policy "competency_select_own" on public.competency_scores for select
  using (student_id = auth.uid());
create policy "competency_mentor" on public.competency_scores for all
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('mentor', 'admin')
  ));
