import { NextResponse } from "next/server";

import { requireApiProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = await createClient();
  const { data, error } = await supabase.from("notifications").select("id, title, body, href, read_at, created_at").eq("recipient_id", access.profile.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Gagal mengambil notifikasi." }, { status: 500 });
  return NextResponse.json({ notifications: (data ?? []).map((item) => ({ ...item, message: item.body, link: item.href })) });
}