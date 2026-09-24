"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock3, Send } from "lucide-react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError, showSuccess } from "@/components/ui/sweet-alert";

const initialForm = {
  overtimeDate: "",
  startTime: "17:30",
  endTime: "19:30",
  reason: "",
};

export function OvertimeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Pengajuan lembur tidak dapat dikirim.");
      }

      setForm(initialForm);
      await showSuccess("Pengajuan lembur berhasil dikirim", "Permintaan Anda akan ditinjau oleh manager/admin.");
      router.refresh();
    } catch (error) {
      await showError("Pengajuan gagal", error instanceof Error ? error.message : "Pengajuan lembur tidak dapat dikirim.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="scale-in grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:grid-cols-2" aria-busy={loading}>
      <div className="md:col-span-2 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Clock3 className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Ajukan Lembur</h3>
          <p className="text-sm text-slate-500">Isi detail lembur dan kirim untuk persetujuan.</p>
        </div>
      </div>

      <label className="text-sm font-medium text-slate-700">
        Tanggal lembur
        <input
          required
          type="date"
          value={form.overtimeDate}
          onChange={(event) => setForm((previous) => ({ ...previous, overtimeDate: event.target.value }))}
          className="field mt-1"
          disabled={loading}
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Jam mulai
        <input
          required
          type="time"
          value={form.startTime}
          onChange={(event) => setForm((previous) => ({ ...previous, startTime: event.target.value }))}
          className="field mt-1"
          disabled={loading}
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Jam selesai
        <input
          required
          type="time"
          value={form.endTime}
          onChange={(event) => setForm((previous) => ({ ...previous, endTime: event.target.value }))}
          className="field mt-1"
          disabled={loading}
        />
      </label>

      <div className="text-sm font-medium text-slate-700">
        Durasi
        <div className="mt-1 flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
          {calculateDuration(form.startTime, form.endTime)} jam
        </div>
      </div>

      <label className="text-sm font-medium text-slate-700 md:col-span-2">
        Alasan lembur
        <textarea
          required
          minLength={5}
          value={form.reason}
          onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))}
          className="field mt-1 min-h-28"
          placeholder="Jelaskan alasan atau kebutuhan lembur"
          disabled={loading}
        />
      </label>

      <div className="md:col-span-2">
        <button type="submit" disabled={loading} className="action-button bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
          <Send className="size-4" />
          {loading ? <LoadingSpinner label="Mengirim..." /> : "Kirim pengajuan lembur"}
        </button>
      </div>
    </form>
  );
}

function calculateDuration(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "0";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const diff = Math.max(0, endMinutes - startMinutes);

  return (diff / 60).toFixed(1);
}
