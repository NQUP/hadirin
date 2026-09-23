import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = await createClient();
  const query = supabase.from("attendance").select("*").order("attendance_date", { ascending: false }).limit(60);
  const { data, error } = access.profile.role === "employee" ? await query.eq("employee_id", access.profile.id) : await query;
  if (error) return NextResponse.json({ error: "Gagal mengambil riwayat." }, { status: 500 });
  return NextResponse.json({ attendance: data });
}
