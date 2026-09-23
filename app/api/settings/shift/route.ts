import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function PUT(request: Request) {
  const access = await requireApiProfile();

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  if (access.profile.role !== "admin") {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !body?.id ||
    !body?.start_time ||
    !body?.end_time ||
    body?.late_tolerance_minutes === undefined
  ) {
    return NextResponse.json(
      { error: "Data pengaturan jam tidak lengkap." },
      { status: 422 },
    );
  }

  const tolerance = Number(body.late_tolerance_minutes);

  if (!Number.isInteger(tolerance) || tolerance < 0 || tolerance > 180) {
    return NextResponse.json(
      { error: "Toleransi keterlambatan tidak valid." },
      { status: 422 },
    );
  }

  if (body.start_time >= body.end_time) {
    return NextResponse.json(
      { error: "Jam pulang harus lebih besar dari jam masuk." },
      { status: 422 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .update({
      start_time: body.start_time,
      end_time: body.end_time,
      late_tolerance_minutes: tolerance,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Update shift error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan jam." },
      { status: 500 },
    );
  }

  return NextResponse.json({ shift: data });
}