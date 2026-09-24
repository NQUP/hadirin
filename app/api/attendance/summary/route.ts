import { NextResponse } from "next/server";

import { getAttendanceSummary } from "@/lib/attendance-summary";
import { requireApiProfile } from "@/lib/auth";

export async function GET(request: Request) {
  const access = await requireApiProfile();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const employeeId = params.get("employeeId") || undefined;

  if (!from || !to) {
    return NextResponse.json({ error: "Periode rekap wajib diisi." }, { status: 422 });
  }

  try {
    const result = await getAttendanceSummary(access.profile, { from, to, employeeId });

    if (
      employeeId &&
      access.profile.role === "manager" &&
      !result.employees.some((employee) => employee.id === employeeId)
    ) {
      return NextResponse.json({ error: "Employee bukan anggota tim Anda." }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET attendance summary:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengambil rekap kehadiran." }, { status: 422 });
  }
}