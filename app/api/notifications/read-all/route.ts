import { NextResponse } from "next/server";

import { requireApiProfile } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH() {
  const access = await requireApiProfile();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const { error } = await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", access.profile.id).is("read_at", null);
  if (error) return NextResponse.json({ error: "Gagal menandai semua notifikasi." }, { status: 500 });
  return NextResponse.json({ success: true });
}