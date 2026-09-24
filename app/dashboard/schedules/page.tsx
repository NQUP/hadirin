import { CalendarDays } from "lucide-react";

import { WorkScheduleManager } from "@/components/dashboard/work-schedule-manager";
import { requireProfile } from "@/lib/auth";
import { getWorkScheduleData } from "@/lib/work-schedules";

export default async function WorkSchedulesPage() {
  const profile = await requireProfile();
  const data = await getWorkScheduleData(profile);

  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <CalendarDays className="size-3.5" />
          Jadwal kerja
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Jadwal Kerja</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {profile.role === "admin" ? "Tentukan shift dan hari kerja setiap employee." : "Lihat shift dan hari kerja sesuai akses Anda."}
        </p>
      </div>
      <WorkScheduleManager data={data} canManage={profile.role === "admin"} />
    </section>
  );
}