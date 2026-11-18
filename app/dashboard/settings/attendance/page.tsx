import { ShiftSettings } from "@/components/dashboard/shift-settings";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { CalendarClock } from "lucide-react";

export default async function AttendanceSettingsPage() {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data: shift } = await supabase
    .from("shifts")
    .select("id, start_time, end_time, late_tolerance_minutes, is_active")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <CalendarClock className="size-3.5" />
          Pengaturan
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Jam Absensi</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Atur jam masuk, toleransi keterlambatan, dan jam pulang karyawan.
        </p>
      </div>
      <div className="scale-in">
        <ShiftSettings shift={shift} />
      </div>
    </section>
  );
}
