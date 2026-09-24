import { NextResponse } from "next/server";
import { notifyRequestReviewed } from "@/lib/notifications";
import { requireApiProfile } from "@/lib/auth";
import { reviewRequestSchema } from "@/lib/validations/leave-request";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiProfile(["manager", "admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = reviewRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data approval tidak valid." }, { status: 422 });
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: requestRow } = await supabase.from("leave_requests").select("employee_id, leave_type, start_date, profiles!leave_requests_employee_id_fkey(manager_id)").eq("id", id).single();
  if (!requestRow) return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  const employee = requestRow.profiles as unknown as { manager_id: string | null };
  if (access.profile.role === "manager" && employee.manager_id !== access.profile.id) return NextResponse.json({ error: "Pengajuan ini bukan milik anggota tim Anda." }, { status: 403 });
  const { error } = await supabase.from("leave_requests").update({ status: parsed.data.status, reviewed_by: access.profile.id, reviewed_at: new Date().toISOString(), review_note: parsed.data.note ?? null }).eq("id", id).eq("status", "pending");
  if (error) return NextResponse.json({ error: "Gagal memproses pengajuan." }, { status: 500 });
  await notifyRequestReviewed({ kind: "leave", requestId: id, employeeId: requestRow.employee_id, status: parsed.data.status, date: requestRow.start_date, leaveType: requestRow.leave_type });
  return NextResponse.json({ success: true });
}
