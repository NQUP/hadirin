-- Jalankan setelah migration wilayah kerja. Bucket dibuat private agar foto absensi tidak dapat diakses publik.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attendance-selfies', 'attendance-selfies', false, 5242880, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

drop policy if exists "attendance selfie upload own" on storage.objects;
drop policy if exists "attendance selfie view own or admin" on storage.objects;

create policy "attendance selfie upload own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'attendance-selfies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "attendance selfie view own or admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'attendance-selfies'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
