create table if not exists public.pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  monitor_id uuid references public.monitors (id) on delete set null,
  report_id text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'dismissed', 'executed')),
  proposed_action text not null,
  proposed_event text not null default 'monitor_alert'
    check (proposed_event in ('crm_export', 'monitor_alert')),
  monitor_requirement text,
  report_snapshot jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_pending_actions_user_status
  on public.pending_actions (user_id, status, created_at desc);

alter table public.pending_actions enable row level security;

drop policy if exists pending_actions_all on public.pending_actions;
create policy pending_actions_all on public.pending_actions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
