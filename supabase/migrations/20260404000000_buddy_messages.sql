-- ============================================================
-- Migration: buddy_messages
-- Async 1-to-1 messaging between buddy pairs within a cohort.
-- ============================================================

create table if not exists public.buddy_messages (
  id           uuid        primary key default gen_random_uuid(),
  sender_id    uuid        not null references public.users(id)    on delete cascade,
  receiver_id  uuid        not null references public.users(id)    on delete cascade,
  cohort_id    uuid                    references public.cohorts(id) on delete cascade,
  content      text        not null check (char_length(content) between 1 and 500),
  is_read      boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- Fast thread lookups (bidirectional OR query hits both indexes)
create index if not exists idx_buddy_messages_sender
  on public.buddy_messages (sender_id, cohort_id, created_at desc);

create index if not exists idx_buddy_messages_receiver
  on public.buddy_messages (receiver_id, cohort_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.buddy_messages enable row level security;

-- Sender or receiver can read their thread
drop policy if exists "buddy_messages_select" on public.buddy_messages;
create policy "buddy_messages_select"
  on public.buddy_messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Only send as yourself
drop policy if exists "buddy_messages_insert" on public.buddy_messages;
create policy "buddy_messages_insert"
  on public.buddy_messages for insert
  with check (sender_id = auth.uid());

-- Only receiver can mark is_read = true
drop policy if exists "buddy_messages_update" on public.buddy_messages;
create policy "buddy_messages_update"
  on public.buddy_messages for update
  using  (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());
