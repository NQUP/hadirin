alter table public.notifications
  add column if not exists type text not null default 'system',
  add column if not exists message text not null default '',
  add column if not exists link text,
  add column if not exists event_key text;

update public.notifications
set message = body
where message = '';

update public.notifications
set link = href
where link is null;

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

create unique index if not exists notifications_recipient_event_key_idx
  on public.notifications(recipient_id, event_key)
  where event_key is not null;

create policy "notification own update" on public.notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());