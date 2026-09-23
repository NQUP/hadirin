import { OfficeRegionManager } from "@/components/dashboard/office-region-manager";
import { WorkRegionAssignments } from "@/components/dashboard/work-region-assignments";
import { ShiftSettings } from "@/components/dashboard/shift-settings";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function SettingsPage() {
  await requireProfile(["admin"]);

  const supabase = await createClient();

  const [{ data: regions }, { data: employees }, { data: shift }] =
    await Promise.all([
      supabase
        .from("office_locations")
        .select(
          "id, name, address, latitude, longitude, radius_meters, is_active",
        )
        .order("name"),

      supabase
        .from("profiles")
        .select(
          "id, full_name, employee_number, email, office_location_id, is_active",
        )
        .order("full_name"),

      supabase
        .from("shifts")
        .select("id, start_time, end_time, late_tolerance_minutes, is_active")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600">Pengaturan</p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Wilayah Kerja Absensi
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Buat geofence dari peta, lalu langsung tetapkan wilayah kerja untuk
          setiap karyawan di halaman ini.
        </p>
      </div>

      {/* Wilayah kerja */}
      <OfficeRegionManager regions={regions ?? []} />

      {/* Pengaturan jam absensi */}
      <ShiftSettings shift={shift} />
    </section>
  );
}
