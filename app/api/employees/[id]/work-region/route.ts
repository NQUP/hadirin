import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { employeeWorkRegionSchema } from "@/lib/validations/office-location";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = employeeWorkRegionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Wilayah kerja tidak valid." }, { status: 422 });
  const { id } = await context.params; const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ office_location_id: parsed.data.officeLocationId }).eq("id", id);
  if (error?.code === "42703") return NextResponse.json({ error: "Fitur wilayah kerja belum diaktifkan di database. Jalankan migration 202609220002_add_employee_work_regions.sql di Supabase SQL Editor." }, { status: 422 });
  if (error) return NextResponse.json({ error: "Gagal menetapkan wilayah kerja karyawan. Pastikan akun Anda masih memiliki akses admin." }, { status: 500 });
  return NextResponse.json({ success: true });
}
