import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await request.json().catch(() => null);
  if (typeof body?.shiftId !== "string" || !Number.isInteger(body?.weekday) || body.weekday < 0 || body.weekday > 6) {
    return NextResponse.json({ error: "Shift dan hari kerja tidak valid." }, { status: 422 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("work_schedules").update({ shift_id: body.shiftId, weekday: body.weekday }).eq("id", id).select().single();
  if (error) {
    console.error("PATCH work schedule:", error);
    return NextResponse.json({ error: "Gagal memperbarui jadwal kerja." }, { status: 500 });
  }
  return NextResponse.json({ schedule: data });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const { id } = await context.params;
  const supabase = await createClient();
  const { error } = await supabase.from("work_schedules").delete().eq("id", id);
  if (error) {
    console.error("DELETE work schedule:", error);
    return NextResponse.json({ error: "Gagal menghapus jadwal kerja." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}