"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { AppRole } from "@/types/database";
import type { AttendanceCalendarEmployee, AttendanceCalendarRecord, AttendanceCalendarResult, CalendarStatus } from "@/lib/attendance-calendar";

const statusLabels: Record<CalendarStatus, string> = { present: "Hadir", late: "Terlambat", permission: "Izin", sick: "Sakit", leave: "Cuti", absent: "Absent", non_working: "Bukan Hari Kerja" };
const statusStyles: Record<CalendarStatus, string> = { present: "border-emerald-200 bg-emerald-50 text-emerald-700", late: "border-amber-200 bg-amber-50 text-amber-700", permission: "border-sky-200 bg-sky-50 text-sky-700", sick: "border-violet-200 bg-violet-50 text-violet-700", leave: "border-indigo-200 bg-indigo-50 text-indigo-700", absent: "border-rose-200 bg-rose-50 text-rose-700", non_working: "border-slate-200 bg-slate-50 text-slate-500" };
const dotStyles: Record<CalendarStatus, string> = { present: "bg-emerald-500", late: "bg-amber-500", permission: "bg-sky-500", sick: "bg-violet-500", leave: "bg-indigo-500", absent: "bg-rose-500", non_working: "bg-slate-300" };
const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function AttendanceCalendarView({ result, employees, role, month, employeeId }: { result: AttendanceCalendarResult; employees: AttendanceCalendarEmployee[]; role: AppRole; month: string; employeeId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AttendanceCalendarRecord | null>(null);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${month}-01T00:00:00+07:00`));
  const cells = calendarCells(month, result.records);

  function navigate(nextMonth: string) {
    const params = new URLSearchParams({ month: nextMonth });
    if (role !== "employee" && employeeId) params.set("employeeId", employeeId);
    router.push(`/dashboard/attendance-calendar?${params.toString()}`);
  }

  function today() {
    const current = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()).slice(0, 7);
    navigate(current);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(addMonth(month, -1))} className="icon-action border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Bulan sebelumnya"><ChevronLeft className="size-4" /></button>
          <h3 className="min-w-44 text-center text-lg font-semibold capitalize text-slate-900">{monthLabel}</h3>
          <button type="button" onClick={() => navigate(addMonth(month, 1))} className="icon-action border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Bulan berikutnya"><ChevronRight className="size-4" /></button>
          <button type="button" onClick={today} className="action-button ml-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Hari Ini</button>
        </div>
        {role !== "employee" && <form method="get" className="flex flex-wrap gap-2"><input type="hidden" name="month" value={month} /><select name="employeeId" defaultValue={employeeId} className="field min-w-56"><option value="">Pilih employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} ({employee.number})</option>)}</select><button className="action-button bg-blue-600 text-white hover:bg-blue-700">Tampilkan</button></form>}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">{(Object.keys(statusLabels) as CalendarStatus[]).map((status) => <span key={status} className="inline-flex items-center gap-2 text-xs font-medium text-slate-600"><span className={`size-2.5 rounded-full ${dotStyles[status]}`} />{statusLabels[status]}</span>)}</div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{weekDays.map((day) => <div key={day} className="px-1 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-3">{day}</div>)}</div>
        <div className="grid grid-cols-7">{cells.map((cell) => cell.record ? <button key={cell.date} type="button" onClick={() => setSelected(cell.record)} className={`min-h-24 min-w-0 border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-blue-50 sm:min-h-28 sm:p-3 ${cell.record.status === "non_working" ? "bg-slate-50/60" : "bg-white"}`}><span className="text-sm font-semibold text-slate-800">{cell.day}</span><span className={`mt-2 flex min-w-0 items-center gap-1.5 rounded-lg border px-1.5 py-1 text-[10px] font-semibold leading-tight sm:text-xs ${statusStyles[cell.record.status]}`}><span className={`size-1.5 shrink-0 rounded-full ${dotStyles[cell.record.status]}`} /><span className="truncate">{statusLabels[cell.record.status]}</span></span></button> : <div key={cell.date} className="min-h-24 border-b border-r border-slate-100 bg-slate-50/30 sm:min-h-28" />)}</div>
      </div>

      {selected && <CalendarDetail record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CalendarDetail({ record, onClose }: { record: AttendanceCalendarRecord; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/30 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Detail ${record.date}`}><div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Detail tanggal</p><h3 className="mt-1 text-xl font-bold capitalize text-slate-900">{formatDate(record.date)}</h3></div><button type="button" onClick={onClose} className="icon-action text-slate-500 hover:bg-slate-100" aria-label="Tutup detail"><X className="size-4" /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Detail label="Status" value={statusLabels[record.status]} /><Detail label="Shift" value={record.shiftName ? `${record.shiftName} ${record.shiftStart?.slice(0, 5)} - ${record.shiftEnd?.slice(0, 5)}` : "-"} /><Detail label="Jam masuk" value={formatTime(record.clockIn)} /><Detail label="Jam pulang" value={formatTime(record.clockOut)} /><Detail label="Keterlambatan" value={record.lateMinutes ? `${record.lateMinutes} menit` : "-"} /><Detail label="Leave request" value={record.leaveType ? `${statusLabels[record.leaveType]} disetujui` : "-"} /></div><p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{record.status === "absent" ? "Tidak terdapat data absensi pada hari kerja ini." : record.status === "leave" || record.status === "permission" || record.status === "sick" ? `${statusLabels[record.status]} disetujui.${record.leaveReason ? ` ${record.leaveReason}` : ""}` : record.status === "non_working" ? "Bukan hari kerja berdasarkan jadwal employee." : record.notes || "Data absensi tercatat."}</p></div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>; }
type CalendarCell = { date: string; day: number; record: AttendanceCalendarRecord | null };

function calendarCells(month: string, records: AttendanceCalendarRecord[]): CalendarCell[] { const [year, monthNumber] = month.split("-").map(Number); const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay(); const mondayOffset = (firstDay + 6) % 7; const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate(); const map = new Map(records.map((record) => [record.date, record])); const leadingCells: CalendarCell[] = Array.from({ length: mondayOffset }, (_, index) => ({ date: `empty-${index}`, day: 0, record: null })); const monthCells: CalendarCell[] = Array.from({ length: days }, (_, index) => { const day = index + 1; const date = `${month}-${String(day).padStart(2, "0")}`; return { date, day, record: map.get(date) ?? null }; }); return [...leadingCells, ...monthCells]; }
function addMonth(month: string, offset: number) { const [year, monthNumber] = month.split("-").map(Number); const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T00:00:00+07:00`)); }
function formatTime(value: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(new Date(value)) : "-"; }