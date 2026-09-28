"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

type AttendanceRow = {
  id: string;
  attendance_date: string;
  status: string | null;
  employee_id: string;
};

type Period = "7d" | "30d" | "month";

export function AttendanceChart({ rows, today }: { rows: AttendanceRow[]; today: string }) {
  const [period, setPeriod] = useState<Period>("7d");

  const days = useMemo(() => {
    const end = new Date(`${today}T00:00:00+07:00`);
    const start = new Date(end);

    if (period === "month") {
      start.setDate(1);
    } else {
      start.setDate(start.getDate() - (period === "7d" ? 6 : 29));
    }

    const result: Array<{ date: string; label: string; present: number; late: number }> = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const date = cursor.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const dayRows = rows.filter((row) => row.attendance_date === date);
      result.push({
        date,
        label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(cursor),
        present: dayRows.filter((row) => row.status !== "absent").length,
        late: dayRows.filter((row) => row.status === "late").length,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [period, rows, today]);

  const maxPresent = Math.max(...days.map((day) => day.present), 1);
  const visibleDays = period === "month" ? days.slice(-14) : days;

  return (
    <section className="slide-up stagger-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Kehadiran</h3>
          <p className="mt-1 text-sm text-slate-500">Jumlah karyawan yang tercatat hadir setiap hari.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="hidden size-5 text-slate-400 sm:block" />
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["7d", "30d", "month"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${period === value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                {value === "7d" ? "7 Hari" : value === "30d" ? "30 Hari" : "Bulan Ini"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className={`flex min-w-full items-end gap-2 ${period === "month" ? "min-w-[620px]" : "min-w-[420px]"}`}>
          {visibleDays.map((day) => (
            <div key={day.date} className="flex min-w-10 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full max-w-12 items-end justify-center rounded-xl bg-slate-50 p-1.5">
                <div
                  className="w-full rounded-lg bg-blue-500 transition-all"
                  style={{ height: `${Math.max((day.present / maxPresent) * 100, day.present ? 8 : 2)}%` }}
                  title={`${day.present} hadir, ${day.late} terlambat`}
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500">{day.label}</p>
                <p className="text-sm font-bold text-slate-900">{day.present}</p>
                {day.late > 0 && <p className="text-[10px] text-amber-600">{day.late} terlambat</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
