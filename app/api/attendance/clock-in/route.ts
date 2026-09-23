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
  const { data: existing } = await supabase.from("attendance").select("id").eq("employee_id", access.profile.id).eq("attendance_date", attendanceDate).maybeSingle();
  if (existing) return NextResponse.json({ error: "Anda sudah melakukan clock in hari ini." }, { status: 409 });
  if (!access.profile.office_location_id) return NextResponse.json({ error: "Wilayah kerja Anda belum ditentukan. Hubungi administrator." }, { status: 422 });
  const { data: office } = await supabase.from("office_locations").select("id, name, address, latitude, longitude, radius_meters").eq("id", access.profile.office_location_id).eq("is_active", true).maybeSingle();
  if (!office) return NextResponse.json({ error: "Wilayah kerja Anda tidak aktif atau tidak ditemukan." }, { status: 422 });
  const distance = haversineDistanceMeters(parsed.data.latitude, parsed.data.longitude, office.latitude, office.longitude);
  if (distance > office.radius_meters) return NextResponse.json({ error: `Anda berada ${Math.round(distance)} m dari kantor; radius maksimal ${office.radius_meters} m.` }, { status: 422 });
  const { data: shift } = await supabase.from("shifts").select("start_time, late_tolerance_minutes").eq("is_active", true).limit(1).maybeSingle();
  const jakartaTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  const lateLimit = shift ? addMinutesToTime(shift.start_time, shift.late_tolerance_minutes) : "09:15";
  const status = jakartaTime > lateLimit ? "late" : "present";
  const { data, error } = await supabase.from("attendance").insert({
    employee_id: access.profile.id, attendance_date: attendanceDate, clock_in_at: now.toISOString(), clock_in_latitude: parsed.data.latitude,
    clock_in_longitude: parsed.data.longitude, clock_in_distance_meters: Math.round(distance), clock_in_selfie_url: parsed.data.selfiePath, office_location_id: office.id, status,
  }).select().single();
  if (error) return NextResponse.json({ error: "Gagal menyimpan absensi." }, { status: 500 });
  return NextResponse.json({ attendance: data, workRegion: { name: office.name, address: office.address } }, { status: 201 });
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, minute] = time.slice(0, 5).split(":").map(Number);
  const total = hours * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
