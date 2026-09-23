import { NextResponse } from "next/server";
import { haversineDistanceMeters } from "@/lib/attendance";
import { requireApiProfile } from "@/lib/auth";
import { clockSchema } from "@/lib/validations/attendance";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = clockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data lokasi tidak valid." }, { status: 422 });
  if (!parsed.data.selfiePath.startsWith(`${access.profile.id}/`)) return NextResponse.json({ error: "Foto selfie tidak valid." }, { status: 422 });
  const supabase = await createClient();
  const now = new Date();
  const attendanceDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: record } = await supabase.from("attendance").select("id, status").eq("employee_id", access.profile.id).eq("attendance_date", attendanceDate).maybeSingle();
  if (!record) return NextResponse.json({ error: "Lakukan clock in terlebih dahulu." }, { status: 422 });
  if (!access.profile.office_location_id) return NextResponse.json({ error: "Wilayah kerja Anda belum ditentukan. Hubungi administrator." }, { status: 422 });
  const { data: office } = await supabase.from("office_locations").select("id, name, address, latitude, longitude, radius_meters").eq("id", access.profile.office_location_id).eq("is_active", true).maybeSingle();
  if (!office) return NextResponse.json({ error: "Wilayah kerja Anda tidak aktif atau tidak ditemukan." }, { status: 422 });
  const distance = haversineDistanceMeters(parsed.data.latitude, parsed.data.longitude, office.latitude, office.longitude);
  if (distance > office.radius_meters) return NextResponse.json({ error: "Lokasi Anda berada di luar radius kantor." }, { status: 422 });
  const { data, error } = await supabase.from("attendance").update({ clock_out_at: now.toISOString(), clock_out_latitude: parsed.data.latitude, clock_out_longitude: parsed.data.longitude, clock_out_distance_meters: Math.round(distance), clock_out_selfie_url: parsed.data.selfiePath, office_location_id: office.id }).eq("id", record.id).is("clock_out_at", null).select().single();
  if (error) return NextResponse.json({ error: "Gagal menyimpan clock out." }, { status: 500 });
  return NextResponse.json({ attendance: data, workRegion: { name: office.name, address: office.address } });
}
