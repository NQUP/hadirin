import { NextResponse } from "next/server";

import { requireApiProfile } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: notification } = await supabase.from("notifications").select("id, href").eq("id", id).eq("recipient_id", access.profile.id).maybeSingle();
  if (!notification) return NextResponse.json({ error: "Notifikasi tidak ditemukan." }, { status: 404 });
  const { data, error } = await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("recipient_id", access.profile.id).select("id, href").single();
  if (error) return NextResponse.json({ error: "Gagal menandai notifikasi." }, { status: 500 });
  return NextResponse.json({ notification: { id: data.id, link: data.href } });
}