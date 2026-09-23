"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { confirmAction, showError, showSuccess } from "@/components/ui/sweet-alert";

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter(); const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  async function review(status: "approved" | "rejected") {
    const approved = await confirmAction({ title: status === "approved" ? "Setujui pengajuan?" : "Tolak pengajuan?", text: status === "approved" ? "Status pengajuan akan diperbarui menjadi disetujui." : "Pemohon akan menerima status ditolak.", confirmButtonText: status === "approved" ? "Ya, setujui" : "Ya, tolak" });
    if (!approved) return; setAction(status);
    try {
      const response = await fetch(`/api/leave-requests/${requestId}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      await showSuccess(status === "approved" ? "Pengajuan berhasil disetujui" : "Pengajuan berhasil ditolak"); router.refresh();
    } catch (error) { await showError("Tidak dapat memproses pengajuan", error instanceof Error ? error.message : "Silakan coba lagi."); } finally { setAction(null); }
  }
  const busy = action !== null;
  return <div className="flex items-center gap-2" aria-busy={busy}><button disabled={busy} onClick={() => review("approved")} className="icon-action text-emerald-700 hover:bg-emerald-50" aria-label="Setujui pengajuan">{action === "approved" ? <LoadingSpinner label="" /> : <Check className="size-4" />}</button><button disabled={busy} onClick={() => review("rejected")} className="icon-action text-rose-700 hover:bg-rose-50" aria-label="Tolak pengajuan">{action === "rejected" ? <LoadingSpinner label="" /> : <X className="size-4" />}</button></div>;
}
