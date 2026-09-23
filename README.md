# Hadirin — Sistem Absensi Karyawan

Aplikasi full-stack Next.js untuk absensi karyawan dengan Supabase Auth, PostgreSQL, role-based access control, dan Row Level Security.

## Setup

1. Salin `.env.example` menjadi `.env.local`, lalu isi URL dan publishable key dari proyek Supabase Anda.
2. Jalankan migration `supabase/migrations/202609220001_initial_schema.sql` di SQL Editor Supabase. Jika schema awal sudah dibuat, jalankan juga migration tambahan `supabase/migrations/202609220002_add_employee_work_regions.sql` dan `supabase/migrations/202609220003_add_attendance_selfie_storage.sql`.
3. Buat akun Admin, Manager, dan Karyawan melalui **Supabase Auth > Users**. Jangan menyimpan password di tabel aplikasi.
4. Tambahkan baris `profiles` dengan UUID yang sama dengan `auth.users.id`; tetapkan role dan relasi `manager_id` untuk setiap karyawan.
5. Sesuaikan `office_locations` dan `shifts` dengan kantor serta jam kerja perusahaan.
6. Jalankan `npm run dev`.

## Wilayah kerja absensi

Setiap karyawan sekarang harus memiliki `office_location_id` pada tabel `profiles`. Clock in dan clock out hanya diterima apabila GPS berada di dalam radius lokasi tersebut; aplikasi tidak lagi memilih satu lokasi kantor aktif secara global.

```sql
update public.profiles
set office_location_id = 'UUID_OFFICE_LOCATION'
where id = 'UUID_USER_AUTH';
```

Gunakan `name` dan `address` pada `office_locations` sebagai nama serta alamat wilayah kerja, misalnya `Jakarta Selatan`, `Kantor Pusat`, atau `Site Cikarang`.

## Selfie absensi

Clock in dan clock out mewajibkan foto dari kamera depan. Aplikasi menambahkan watermark waktu WIB dan wilayah kerja pada foto, lalu mengunggahnya ke bucket privat `attendance-selfies` di Supabase Storage. Jalankan migration `202609220003_add_attendance_selfie_storage.sql` agar bucket serta policy upload milik user tersedia.

## Fitur

- Satu halaman login serta satu layout dashboard yang menyesuaikan role `employee`, `manager`, atau `admin`.
- Cookie-based Supabase SSR session dan `proxy.ts` untuk refresh sesi / perlindungan rute.
- Clock in / clock out memakai waktu server, geolocation browser, dan validasi radius kantor Haversine di Route Handler.
- Riwayat absensi, pengajuan izin/sakit/cuti, visibilitas tim manager, dan data karyawan admin.
- Validasi server dengan Zod dan policy RLS untuk data pribadi, bawahan, serta admin.

## Catatan keamanan

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` boleh dipakai di browser. Jangan pernah menambahkan `service_role` key ke `.env` yang terekspos atau ke kode klien. Pembuatan user dilakukan lewat Supabase Dashboard atau proses admin server terpisah yang menyimpan service key secara aman.

## Validasi

```bash
npx tsc --noEmit
npm run lint
npm run build
```
