import { NextResponse } from "next/server";

import { notifyRequestSubmitted } from "@/lib/notifications";
import { requireApiProfile } from "@/lib/auth";
import { overtimeRequestSchema } from "@/lib/validations/overtime";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const supabase = await createClient();

  let employeeIds: string[] | null = null;

  if (access.profile.role === "manager") {
    const { data: team } = await supabase
      .from("profiles")
      .select("id")
      .eq("manager_id", access.profile.id);

    employeeIds = (team ?? []).map((member) => member.id);
  }

  let query = supabase
    .from("overtime_requests")
    .select("*, profiles!overtime_requests_employee_id_fkey(full_name, employee_number)")
    .order("overtime_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (access.profile.role === "employee") {
    query = query.eq("employee_id", access.profile.id);
  }

  if (access.profile.role === "manager") {
    query = query.in("employee_id", employeeIds && employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET overtime requests:", error);
    return NextResponse.json({ error: "Gagal mengambil data lembur." }, { status: 500 });
  }

  return NextResponse.json({ requests: data });
}

export async function POST(request: Request) {
  const access = await requireApiProfile();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const parsed = overtimeRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Data lembur tidak valid." }, { status: 422 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("overtime_requests")
    .insert({
      employee_id: access.profile.id,
      overtime_date: parsed.data.overtimeDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      reason: parsed.data.reason.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("Insert overtime request:", error);
    return NextResponse.json({ error: "Gagal membuat pengajuan lembur." }, { status: 500 });
  }

  await notifyRequestSubmitted({ kind: "overtime", requestId: data.id, employeeId: access.profile.id, date: parsed.data.overtimeDate });

  return NextResponse.json({ request: data }, { status: 201 });
}
