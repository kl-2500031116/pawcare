create table if not exists public.email_notification_log (
  event_key text primary key,
  event_type text not null,
  record_id uuid not null,
  status text not null check (status in ('sending', 'sent', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.email_notification_log enable row level security;
revoke all on public.email_notification_log from anon, authenticated;
grant select, insert, update on public.email_notification_log to service_role;
