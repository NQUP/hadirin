import { CalendarDays } from "lucide-react";

import { AttendanceCalendarView } from "@/components/dashboard/attendance-calendar-view";
import { getAttendanceCalendar } from "@/lib/attendance-calendar";
import { requireProfile } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AttendanceCalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const params = await searchParams;
  const month = normalizeMonth(valueOf(params.month));
  const requestedEmployeeId = valueOf(params.employeeId) || undefined;
  const available = await getAttendanceCalendar(profile, { from: `${month}-01`, to: `${month}-${daysInMonth(month)}` });
  const employeeId = profile.role === "employee" ? available.employees[0]?.id : requestedEmployeeId || available.employees[0]?.id;
  const result = employeeId ? await getAttendanceCalendar(profile, { from: `${month}-01`, to: `${month}-${daysInMonth(month)}`, employeeId }) : available;

  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600"><CalendarDays className="size-3.5" />Kalender</div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{profile.role === "employee" ? "Kalender Kehadiran Saya" : "Kalender Kehadiran"}</h2>
        <p className="mt-2 text-sm text-slate-500">Lihat status kehadiran berdasarkan jadwal kerja, absensi, dan pengajuan yang disetujui.</p>
      </div>
      <AttendanceCalendarView result={result} employees={available.employees} role={profile.role} month={month} employeeId={employeeId ?? ""} />
    </section>
  );
}

function valueOf(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function normalizeMonth(value?: string) { return value && /^\d{4}-\d{2}$/.test(value) ? value : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()).slice(0, 7); }
function daysInMonth(month: string) { const [year, monthNumber] = month.split("-").map(Number); return String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, "0"); }