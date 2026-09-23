import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { officeLocationSchema } from "@/lib/validations/office-location";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = await createClient();
  const { data, error } = await supabase.from("office_locations").select("*").order("name");
  if (error) return NextResponse.json({ error: "Gagal mengambil wilayah kerja." }, { status: 500 });
  return NextResponse.json({ regions: data });
}

export async function POST(request: Request) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = officeLocationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data wilayah tidak valid." }, { status: 422 });
  const supabase = await createClient(); const value = parsed.data;
  const { data, error } = await supabase.from("office_locations").insert({ name: value.name, address: value.address || null, latitude: value.latitude, longitude: value.longitude, radius_meters: value.radiusMeters, is_active: value.isActive ?? true }).select().single();
  if (error) return NextResponse.json({ error: "Gagal menambahkan wilayah kerja." }, { status: 500 });
  return NextResponse.json({ region: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await request.json().catch(() => null); const id = typeof body?.id === "string" ? body.id : null;
  const parsed = officeLocationSchema.safeParse(body);
  if (!id) return NextResponse.json({ error: "Wilayah kerja tidak valid." }, { status: 422 });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data wilayah tidak valid." }, { status: 422 });
  const supabase = await createClient(); const value = parsed.data;
  const { data, error } = await supabase.from("office_locations").update({ name: value.name, address: value.address || null, latitude: value.latitude, longitude: value.longitude, radius_meters: value.radiusMeters, is_active: value.isActive ?? true }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Gagal memperbarui wilayah kerja." }, { status: 500 });
  return NextResponse.json({ region: data });
}

export async function DELETE(request: Request) {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Wilayah kerja tidak valid." }, { status: 422 });
  const supabase = await createClient(); const { error } = await supabase.from("office_locations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Wilayah ini tidak dapat dihapus karena masih digunakan." }, { status: 409 });
  return NextResponse.json({ success: true });
}
