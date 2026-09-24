import { NextResponse } from "next/server";
import { getWorkScheduleData } from "@/lib/work-schedules";
import { requireApiProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    return NextResponse.json(await getWorkScheduleData(access.profile));
  } catch (error) {
    console.error("GET work schedules:", error);
    return NextResponse.json({ error: "Gagal mengambil jadwal kerja." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json().catch(() => null);
  const weekdays = Array.isArray(body?.weekdays) ? body.weekdays : [];
  if (typeof body?.employeeId !== "string" || typeof body?.shiftId !== "string" || !weekdays.length || weekdays.some((day: unknown) => !Number.isInteger(day) || Number(day) < 0 || Number(day) > 6)) {
    return NextResponse.json({ error: "Employee, shift, dan hari kerja wajib diisi." }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: employee } = await supabase.from("profiles").select("id").eq("id", body.employeeId).eq("role", "employee").eq("is_active", true).maybeSingle();
  if (!employee) return NextResponse.json({ error: "Employee tidak ditemukan atau tidak aktif." }, { status: 404 });

  const { data: shift } = await supabase.from("shifts").select("id").eq("id", body.shiftId).eq("is_active", true).maybeSingle();
  if (!shift) return NextResponse.json({ error: "Shift tidak ditemukan atau tidak aktif." }, { status: 404 });

  const { data, error } = await supabase.from("work_schedules").upsert(
    weekdays.map((weekday: number) => ({ employee_id: body.employeeId, shift_id: body.shiftId, weekday })),
    { onConflict: "employee_id,weekday" },
  ).select();
  if (error) {
    console.error("POST work schedules:", error);
    return NextResponse.json({ error: "Gagal menyimpan jadwal kerja." }, { status: 500 });
  }
  return NextResponse.json({ schedules: data }, { status: 201 });
}