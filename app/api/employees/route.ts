import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations/employee";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*, departments(name), positions(title)").order("full_name");
  if (error) return NextResponse.json({ error: "Gagal mengambil data karyawan." }, { status: 500 });
  return NextResponse.json({ employees: data });
}

export async function PATCH(request: Request) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  const parsed = employeeSchema.safeParse(body);
  if (!id || !parsed.success) return NextResponse.json({ error: "Data karyawan tidak valid." }, { status: 422 });
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ employee_number: parsed.data.employeeNumber, full_name: parsed.data.fullName, email: parsed.data.email, role: parsed.data.role, department_id: parsed.data.departmentId ?? null, position_id: parsed.data.positionId ?? null, manager_id: parsed.data.managerId ?? null, is_active: parsed.data.isActive ?? true }).eq("id", id);
  if (error) return NextResponse.json({ error: "Gagal memperbarui karyawan." }, { status: 500 });
  return NextResponse.json({ success: true });
}
