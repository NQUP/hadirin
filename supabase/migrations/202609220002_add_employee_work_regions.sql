-- Jalankan setelah 202609220001_initial_schema.sql.
-- Setiap karyawan dapat ditetapkan ke satu wilayah kerja (office location) yang berbeda.
alter table public.profiles
  add column if not exists office_location_id uuid references public.office_locations(id) on delete set null;

alter table public.attendance
  add column if not exists office_location_id uuid references public.office_locations(id) on delete set null;

create index if not exists profiles_office_location_idx on public.profiles(office_location_id);
create index if not exists attendance_office_location_idx on public.attendance(office_location_id);

comment on column public.profiles.office_location_id is 'Wilayah kerja/lokasi kantor yang menjadi geofence karyawan.';
comment on column public.attendance.office_location_id is 'Wilayah kerja yang tervalidasi ketika absensi dicatat.';
