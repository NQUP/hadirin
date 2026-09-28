"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Users, X } from "lucide-react";

type AttendanceRow = {
  id: string;
  attendance_date: string;
  status: string | null;
  employee_id: string;
};

type Employee = {
  id: string;
  full_name: string;
  employee_number: string;
};

type Period = "7d" | "30d" | "month";

const statusLabel: Record<string, string> = {
  present: "Hadir",
  late: "Terlambat",
  early_leave: "Pulang cepat",
  absent: "Tidak hadir",
};

export function AttendanceChart({ rows, employees, today }: { rows: AttendanceRow[]; employees: Employee[]; today: string }) {
  const [period, setPeriod] = useState<Period>("7d");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const employeeMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

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
  const selectedRows = selectedDate ? rows.filter((row) => row.attendance_date === selectedDate) : [];
  const selectedLabel = selectedDate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date(`${selectedDate}T00:00:00+07:00`))
    : "";

  return (
    <section className="slide-up stagger-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Kehadiran</h3>
          <p className="mt-1 text-sm text-slate-500">Klik batang untuk melihat detail absensi hari tersebut.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="hidden size-5 text-slate-400 sm:block" />
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["7d", "30d", "month"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => { setPeriod(value); setSelectedDate(null); }}
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
            <button key={day.date} type="button" onClick={() => setSelectedDate(day.date)} className="group flex min-w-10 flex-1 flex-col items-center gap-2 rounded-xl p-1 hover:bg-slate-50">
              <div className="flex h-40 w-full max-w-12 items-end justify-center rounded-xl bg-slate-50 p-1.5 group-hover:bg-blue-50">
                <div
                  className="w-full rounded-lg bg-blue-500 transition-all group-hover:bg-blue-600"
                  style={{ height: `${Math.max((day.present / maxPresent) * 100, day.present ? 8 : 2)}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500">{day.label}</p>
                <p className="text-sm font-bold text-slate-900">{day.present}</p>
                {day.late > 0 && <p className="text-[10px] text-amber-600">{day.late} terlambat</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Detail Absensi</h4>
              </div>
              <p className="mt-1 text-sm text-slate-500">{selectedLabel} · {selectedRows.length} catatan</p>
            </div>
            <button type="button" onClick={() => setSelectedDate(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Tutup detail">
              <X className="size-4" />
            </button>
          </div>

          {selectedRows.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500">Belum ada data absensi pada tanggal ini.</div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl bg-white">
              {selectedRows.map((row) => {
                const employee = employeeMap.get(row.employee_id);
                const status = row.status ?? "present";
                const late = status === "late";
                return (
                  <div key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{employee?.full_name ?? "Karyawan"}</p>
                      <p className="text-xs text-slate-400">{employee?.employee_number ?? row.employee_id.slice(0, 8)}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${late ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {late ? <Clock3 className="size-3" /> : <CheckCircle2 className="size-3" />}
                      {statusLabel[status] ?? status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
