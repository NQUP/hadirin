create extension if not exists "pgcrypto";

create type public.app_role as enum ('employee', 'manager', 'admin');
create type public.attendance_status as enum ('present', 'late', 'early_leave', 'absent');
create type public.leave_type as enum ('permission', 'sick', 'leave');
create type public.request_status as enum ('pending', 'approved', 'rejected');

create table public.departments (
  id uuid primary key default gen_random_uuid(), name text not null unique, code text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.positions (
  id uuid primary key default gen_random_uuid(), department_id uuid references public.departments(id) on delete set null,
  title text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(department_id, title)
);
create table public.shifts (
  id uuid primary key default gen_random_uuid(), name text not null unique, start_time time not null, end_time time not null,
  late_tolerance_minutes integer not null default 15 check (late_tolerance_minutes >= 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.office_locations (
  id uuid primary key default gen_random_uuid(), name text not null, address text, latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180), radius_meters integer not null default 100 check (radius_meters > 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, employee_number text not null unique, full_name text not null, email text not null unique,
  phone text, avatar_url text, role public.app_role not null default 'employee', department_id uuid references public.departments(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null, manager_id uuid references public.profiles(id) on delete set null,
  office_location_id uuid references public.office_locations(id) on delete set null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.work_schedules (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.profiles(id) on delete cascade,
  shift_id uuid not null references public.shifts(id), weekday smallint not null check (weekday between 0 and 6), created_at timestamptz not null default now(), unique(employee_id, weekday)
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null, clock_in_at timestamptz, clock_out_at timestamptz, clock_in_latitude double precision, clock_in_longitude double precision,
  clock_out_latitude double precision, clock_out_longitude double precision, clock_in_distance_meters integer, clock_out_distance_meters integer,
  clock_in_selfie_url text, clock_out_selfie_url text, office_location_id uuid references public.office_locations(id) on delete set null,
  status public.attendance_status not null default 'present', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(employee_id, attendance_date),
  check (clock_out_at is null or clock_in_at is not null), check (clock_out_at is null or clock_out_at >= clock_in_at)
);
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type public.leave_type not null, start_date date not null, end_date date not null, reason text not null check (char_length(reason) >= 5),
  attachment_url text, status public.request_status not null default 'pending', reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz, review_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_date >= start_date)
);
create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(), attendance_id uuid not null references public.attendance(id) on delete cascade,
  requested_by uuid not null references public.profiles(id), reason text not null, requested_clock_in timestamptz, requested_clock_out timestamptz,
  status public.request_status not null default 'pending', reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, review_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text not null, href text, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.approval_logs (
  id uuid primary key default gen_random_uuid(), leave_request_id uuid references public.leave_requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id), action public.request_status not null, note text, created_at timestamptz not null default now()
);

create index attendance_employee_date_idx on public.attendance(employee_id, attendance_date desc);
create index profiles_manager_idx on public.profiles(manager_id);
create index profiles_office_location_idx on public.profiles(office_location_id);
create index attendance_office_location_idx on public.attendance(office_location_id);
create index leave_requests_employee_idx on public.leave_requests(employee_id, created_at desc);
create index leave_requests_status_idx on public.leave_requests(status);
create index notifications_recipient_idx on public.notifications(recipient_id, read_at);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger departments_updated before update on public.departments for each row execute function public.set_updated_at();
create trigger positions_updated before update on public.positions for each row execute function public.set_updated_at();
create trigger shifts_updated before update on public.shifts for each row execute function public.set_updated_at();
create trigger offices_updated before update on public.office_locations for each row execute function public.set_updated_at();
create trigger attendance_updated before update on public.attendance for each row execute function public.set_updated_at();
create trigger leave_requests_updated before update on public.leave_requests for each row execute function public.set_updated_at();
create trigger corrections_updated before update on public.attendance_corrections for each row execute function public.set_updated_at();

create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path = public as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select public.current_role() = 'admin' $$;
create or replace function public.is_manager_of(target uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where id = target and manager_id = auth.uid()) $$;

alter table public.departments enable row level security; alter table public.positions enable row level security; alter table public.shifts enable row level security;
alter table public.office_locations enable row level security; alter table public.profiles enable row level security; alter table public.work_schedules enable row level security;
alter table public.attendance enable row level security; alter table public.leave_requests enable row level security; alter table public.attendance_corrections enable row level security;
alter table public.notifications enable row level security; alter table public.approval_logs enable row level security;

create policy "directory view" on public.profiles for select using (id = auth.uid() or manager_id = auth.uid() or public.is_admin());
create policy "admin manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "employee attendance access" on public.attendance for select using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin());
create policy "employee attendance insert" on public.attendance for insert with check (employee_id = auth.uid() or public.is_admin());
create policy "employee attendance update" on public.attendance for update using (employee_id = auth.uid() or public.is_admin()) with check (employee_id = auth.uid() or public.is_admin());
create policy "leave request view" on public.leave_requests for select using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin());
create policy "leave request create" on public.leave_requests for insert with check (employee_id = auth.uid());
create policy "leave request review" on public.leave_requests for update using (public.is_manager_of(employee_id) or public.is_admin()) with check (public.is_manager_of(employee_id) or public.is_admin());
create policy "notification own" on public.notifications for select using (recipient_id = auth.uid());
create policy "admin reference data" on public.departments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin positions" on public.positions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin shifts" on public.shifts for all using (public.is_admin()) with check (public.is_admin());
create policy "office readable" on public.office_locations for select using (auth.uid() is not null);
create policy "admin offices" on public.office_locations for all using (public.is_admin()) with check (public.is_admin());
create policy "schedule readable" on public.work_schedules for select using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin());
create policy "admin schedules" on public.work_schedules for all using (public.is_admin()) with check (public.is_admin());
create policy "correction access" on public.attendance_corrections for select using (requested_by = auth.uid() or public.is_manager_of(requested_by) or public.is_admin());
create policy "correction create" on public.attendance_corrections for insert with check (requested_by = auth.uid());
create policy "approval logs view" on public.approval_logs for select using (public.is_admin() or exists(select 1 from public.leave_requests l where l.id = leave_request_id and (l.employee_id = auth.uid() or public.is_manager_of(l.employee_id))));

-- Seed reference data only. Create Auth users in Supabase Dashboard, then add their profile rows using their auth.users UUIDs.
insert into public.departments(name, code) values ('Human Resources', 'HR'), ('Engineering', 'ENG'), ('Finance', 'FIN') on conflict do nothing;
insert into public.shifts(name, start_time, end_time, late_tolerance_minutes) values ('Reguler', '09:00', '17:00', 15) on conflict do nothing;
insert into public.office_locations(name, address, latitude, longitude, radius_meters) values ('Kantor Pusat', 'Atur alamat kantor di Supabase', -6.200000, 106.816666, 150) on conflict do nothing;
