create table public.overtime_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  overtime_date date not null,
  start_time time not null,
  end_time time not null,
  reason text not null check (char_length(reason) >= 5),
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index overtime_requests_employee_idx on public.overtime_requests(employee_id, overtime_date desc);
create index overtime_requests_status_idx on public.overtime_requests(status);

create trigger overtime_requests_updated before update on public.overtime_requests for each row execute function public.set_updated_at();

alter table public.overtime_requests enable row level security;

create policy "overtime own read" on public.overtime_requests for select using (employee_id = auth.uid());
create policy "overtime manager/admin read" on public.overtime_requests for select using (public.is_manager_of(employee_id) or public.is_admin());
create policy "overtime create" on public.overtime_requests for insert with check (employee_id = auth.uid());
create policy "overtime review" on public.overtime_requests for update using (public.is_manager_of(employee_id) or public.is_admin()) with check (public.is_manager_of(employee_id) or public.is_admin());
