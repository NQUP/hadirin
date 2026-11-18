import { OfficeRegionManager } from "@/components/dashboard/office-region-manager";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { MapPin } from "lucide-react";

export default async function WorkAreasPage() {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data: regions } = await supabase
    .from("office_locations")
    .select("id, name, address, latitude, longitude, radius_meters, is_active")
    .order("name");

  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <MapPin className="size-3.5" />
          Pengaturan
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Wilayah Kerja</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Buat geofence dari peta, lalu langsung tetapkan wilayah kerja untuk setiap karyawan di halaman ini.
        </p>
      </div>
      <div className="scale-in">
        <OfficeRegionManager regions={regions ?? []} />
      </div>
    </section>
  );
}
