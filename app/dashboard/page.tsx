import { ClockCard } from "@/components/dashboard/clock-card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { CalendarDays, Clock, FileCheck, TrendingUp, Users, Zap } from "lucide-react";

const labels = { employee: "Ringkasan kehadiran pribadi", manager: "Ringkasan kehadiran tim", admin: "Ringkasan perusahaan" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: todayAttendance } = await supabase.from("attendance").select("id, clock_in_at, clock_out_at, status").eq("employee_id", profile.id).eq("attendance_date", today).maybeSingle();
  const { count: monthlyCount } = await supabase.from("attendance").select("id", { count: "exact", head: true }).eq("employee_id", profile.id).gte("attendance_date", `${today.slice(0, 7)}-01`);
  const { count: pendingCount } = await supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("employee_id", profile.id).eq("status", "pending");
  const { data: workRegion } = profile.office_location_id ? await supabase.from("office_locations").select("name, address").eq("id", profile.office_location_id).maybeSingle() : { data: null };

  const icons = [TrendingUp, Clock, FileCheck];
  const iconColors = ["text-blue-600 bg-blue-50", "text-emerald-600 bg-emerald-50", "text-amber-600 bg-amber-50"];

  const cards = profile.role === "employee"
    ? [["Hadir bulan ini", monthlyCount ?? 0, "Hari kerja tercatat"], ["Status hari ini", todayAttendance?.status === "late" ? "Terlambat" : todayAttendance ? "Hadir" : "Belum absen", "Diperbarui real-time"], ["Pengajuan aktif", pendingCount ?? 0, "Menunggu review"]]
    : [["Anggota tim", "—", "Data sesuai akses role"], ["Hadir hari ini", "—", "Lihat modul absensi"], ["Perlu ditinjau", "—", "Lihat pengajuan"]];

  return (
    <div className="space-y-7">
      <div className="slide-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <Zap className="size-3.5" />
          Dashboard
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{labels[profile.role]}</h2>
        <p className="mt-1 text-sm text-slate-500">Pantau informasi penting dari satu tempat.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([title, value, detail], index) => {
          const Icon = icons[index];
          return (
            <article key={title} className={`card-hover slide-up stagger-${index + 1} rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <div className={`grid size-9 place-items-center rounded-xl ${iconColors[index]}`}>
                  <Icon className="size-[18px]" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
              <p className="mt-2 text-xs text-slate-400">{detail}</p>
            </article>
          );
        })}
      </div>

      {profile.role === "employee" ? (
        <div className="slide-up stagger-4">
          <ClockCard initialAttendance={todayAttendance} workRegion={workRegion} />
        </div>
      ) : (
        <section className="slide-up stagger-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Zap className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Tindakan cepat</h3>
              <p className="mt-1 text-sm text-slate-500">Gunakan menu di samping untuk memantau tim, meninjau pengajuan, dan membuka laporan.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
