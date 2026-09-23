"use client";

import { useState } from "react";
import { Clock, Save } from "lucide-react";
import { showError, showSuccess } from "@/components/ui/sweet-alert";

interface Shift {
  id: string;
  start_time: string;
  end_time: string;
  late_tolerance_minutes: number;
  is_active: boolean;
}

interface ShiftSettingsProps {
  shift: Shift | null;
}

export function ShiftSettings({ shift }: ShiftSettingsProps) {
  const [startTime, setStartTime] = useState(
    shift?.start_time?.slice(0, 5) ?? "08:00",
  );

  const [endTime, setEndTime] = useState(
    shift?.end_time?.slice(0, 5) ?? "17:00",
  );

  const [tolerance, setTolerance] = useState(
    String(shift?.late_tolerance_minutes ?? 15),
  );

  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!shift?.id) {
      await showError(
        "Shift belum tersedia",
        "Data jam kerja belum ditemukan di database.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/settings/shift", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: shift.id,
          start_time: startTime,
          end_time: endTime,
          late_tolerance_minutes: Number(tolerance),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan pengaturan.");
      }

      await showSuccess(
        "Pengaturan tersimpan",
        "Jam absensi berhasil diperbarui.",
      );
    } catch (error) {
      await showError(
        "Gagal menyimpan",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan pengaturan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Clock className="size-5" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Pengaturan Jam Absensi
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Atur jam masuk, toleransi keterlambatan, dan jam pulang karyawan.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Jam masuk */}
          <div>
            <label
              htmlFor="start_time"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Jam Masuk
            </label>

            <input
              id="start_time"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1.5 text-xs text-slate-400">Contoh: 08:00</p>
          </div>

          {/* Toleransi */}
          <div>
            <label
              htmlFor="late_tolerance"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Toleransi Keterlambatan
            </label>

            <div className="relative">
              <input
                id="late_tolerance"
                type="number"
                min="0"
                max="180"
                value={tolerance}
                onChange={(event) => setTolerance(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-16 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                menit
              </span>
            </div>

            <p className="mt-1.5 text-xs text-slate-400">Contoh: 15 menit</p>
          </div>

          {/* Jam pulang */}
          <div>
            <label
              htmlFor="end_time"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Jam Pulang
            </label>

            <input
              id="end_time"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1.5 text-xs text-slate-400">
              Karyawan dapat clock out mulai jam ini.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <div className="text-xs text-slate-500">
            {startTime} + {tolerance} menit = batas keterlambatan{" "}
            <strong className="text-slate-700">
              {calculateLateLimit(startTime, Number(tolerance))}
            </strong>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="size-4" />

            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function calculateLateLimit(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);

  const total = hours * 60 + mins + minutes;

  const resultHours = Math.floor(total / 60) % 24;
  const resultMinutes = total % 60;

  return `${String(resultHours).padStart(2, "0")}:${String(
    resultMinutes,
  ).padStart(2, "0")}`;
}
