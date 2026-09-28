import { ClockCard } from "@/components/dashboard/clock-card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { CalendarDays, CheckCircle2, Clock3, FileCheck2, Users, XCircle } from "lucide-react";

const labels = {
  employee: "Ringkasan kehadiran pribadi",
  manager: "Ringkasan kehadiran tim",
  admin: "Ringkasan perusahaan",
} as const;

function startOfMonth(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function startOfSevenDays(date: string) {
  const value = new Date(`${date}T00:00:00+07:00`);
  value.setDate(value.getDate() - 6);
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const monthStart = startOfMonth(today);
  const sevenDaysStart = startOfSevenDays(today);

  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("id, clock_in_at, clock_out_at, status")
    .eq("employee_id", profile.id)
    .eq("attendance_date", today)
    .maybeSingle();

  const { count: monthlyCount } = await supabase
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", profile.id)
    .gte("attendance_date", monthStart);

  const { count: pendingCount } = await supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", profile.id)
    .eq("status", "pending");

  const { data: workRegion } = profile.office_location_id
    ? await supabase.from("office_locations").select("name, address").eq("id", profile.office_location_id).maybeSingle()
    : { data: null };

  if (profile.role === "employee") {
    const cards = [
      ["Hadir bulan ini", monthlyCount ?? 0, "Hari kerja tercatat", Users],
      ["Status hari ini", todayAttendance?.status === "late" ? "Terlambat" : todayAttendance ? "Hadir" : "Belum absen", "Diperbarui real-time", Clock3],
      ["Pengajuan aktif", pendingCount ?? 0, "Menunggu review", FileCheck2],
    ] as const;

    return (
      <div className="space-y-7">
        <Header label={labels.employee} />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(([title, value, detail, Icon], index) => (
            <StatCard key={title} title={title} value={value} detail={detail} Icon={Icon} index={index} />
          ))}
        </div>
        <div className="slide-up stagger-4">
          <ClockCard initialAttendance={todayAttendance} workRegion={workRegion} />
        </div>
      </div>
    );
  }

  // Manager/Admin analytics use the same attendance table and rely on Supabase RLS
  // for the rows available to the current role.
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("id, attendance_date, status, employee_id")
    .gte("attendance_date", sevenDaysStart)
    .lte("attendance_date", today);

  const rows = recentAttendance ?? [];
  const todayRows = rows.filter((row) => row.attendance_date === today);
  const monthRows = rows.filter((row) => row.attendance_date >= monthStart);
  const presentToday = todayRows.filter((row) => row.status !== "absent").length;
  const lateToday = todayRows.filter((row) => row.status === "late").length;
  const uniqueEmployeesToday = new Set(todayRows.map((row) => row.employee_id)).size;

  const { count: employeeCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "employee");

  const { count: pendingRequests } = await supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${sevenDaysStart}T00:00:00+07:00`);
    date.setDate(date.getDate() + index);
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const dayRows = rows.filter((row) => row.attendance_date === key);
    return {
      date: key,
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "Asia/Jakarta" }).format(date),
      total: dayRows.length,
      late: dayRows.filter((row) => row.status === "late").length,
    };
  });

  const cards = [
    [profile.role === "manager" ? "Anggota tim" : "Total karyawan", employeeCount ?? 0, "Karyawan aktif", Users],
    ["Hadir hari ini", presentToday, "Data absensi hari ini", CheckCircle2],
    ["Terlambat hari ini", lateToday, "Perlu diperhatikan", Clock3],
    ["Perlu ditinjau", pendingRequests ?? 0, "Pengajuan pending", FileCheck2],
  ] as const;

  return (
    <div className="space-y-7">
      <Header label={labels[profile.role]} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, detail, Icon], index) => (
          <StatCard key={title} title={title} value={value} detail={detail} Icon={Icon} index={index} />
        ))}
      </div>

      <section className="slide-up stagger-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">Kehadiran 7 hari terakhir</h3>
            <p className="mt-1 text-sm text-slate-500">Ringkasan absensi berdasarkan data yang dapat diakses role Anda.</p>
          </div>
          <CalendarDays className="size-5 text-slate-400" />
        </div>
        <div className="mt-6 grid grid-cols-7 gap-2">
          {daily.map((day) => (
            <div key={day.date} className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs font-medium text-slate-500">{day.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{day.total}</p>
              <p className="mt-1 text-[11px] text-amber-600">{day.late} terlambat</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="slide-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">Ringkasan hari ini</h3>
          <div className="mt-5 space-y-3">
            <SummaryRow label="Karyawan dengan absensi" value={uniqueEmployeesToday} icon={Users} />
            <SummaryRow label="Tercatat hadir" value={presentToday} icon={CheckCircle2} />
            <SummaryRow label="Terlambat" value={lateToday} icon={Clock3} />
            <SummaryRow label="Belum tercatat" value={Math.max((employeeCount ?? 0) - uniqueEmployeesToday, 0)} icon={XCircle} />
          </div>
        </section>

        <section className="slide-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">Periode berjalan</h3>
          <div className="mt-5 space-y-3">
            <SummaryRow label="Catatan absensi 7 hari" value={rows.length} icon={CalendarDays} />
            <SummaryRow label="Catatan bulan berjalan" value={monthRows.length} icon={CheckCircle2} />
            <SummaryRow label="Pengajuan pending" value={pendingRequests ?? 0} icon={FileCheck2} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Header({ label }: { label: string }) {
  return (
    <div className="slide-up">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
        <CalendarDays className="size-3.5" />
        Dashboard
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{label}</h2>
      <p className="mt-1 text-sm text-slate-500">Pantau informasi penting dari satu tempat.</p>
    </div>
  );
}

function StatCard({ title, value, detail, Icon, index }: { title: string; value: string | number; detail: string; Icon: typeof Users; index: number }) {
  return (
    <article className={`card-hover slide-up stagger-${Math.min(index + 1, 4)} rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </article>
  );
}

function SummaryRow({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-slate-500" />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
