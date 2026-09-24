import { NextResponse } from "next/server";

import { getAttendanceCalendar } from "@/lib/attendance-calendar";
import { requireApiProfile } from "@/lib/auth";

export async function GET(request: Request) {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const employeeId = params.get("employeeId") || undefined;
  if (!from || !to) return NextResponse.json({ error: "Periode kalender wajib diisi." }, { status: 422 });

  try {
    const result = await getAttendanceCalendar(access.profile, { from, to, employeeId });
    if (employeeId && access.profile.role === "manager" && !result.employees.some((employee) => employee.id === employeeId)) {
      return NextResponse.json({ error: "Employee bukan anggota tim Anda." }, { status: 403 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET attendance calendar:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengambil kalender kehadiran." }, { status: 422 });
  }
}