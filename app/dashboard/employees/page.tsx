import { redirect } from "next/navigation";
import { EmployeeWorkRegionSelect } from "@/components/dashboard/employee-work-region-select";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";

export default async function EmployeesPage() {
  const profile = await requireProfile(["admin"]);
  if (profile.role !== "admin") redirect("/dashboard");
  const supabase = await createClient();
  const [{ data: employees }, { data: regions }] = await Promise.all([
    supabase.from("profiles").select("*, departments(name), positions(title)").order("full_name"),
    supabase.from("office_locations").select("id, name, address, latitude, longitude, radius_meters, is_active").order("name"),
  ]);

  return (
    <section>
      <div className="slide-up mb-6 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
            <Users className="size-3.5" />
            Master data
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Data Karyawan</h2>
          <p className="mt-1 text-sm text-slate-500">Tetapkan wilayah kerja agar absensi GPS menggunakan geofence yang sesuai.</p>
        </div>
      </div>

      <div className="scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-white text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Karyawan</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Department</th>
                <th className="px-5 py-4 font-semibold">Wilayah kerja</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees?.map((employee, index) => (
                <tr key={employee.id} className="table-row-hover slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                        {employee.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{employee.full_name}</p>
                        <p className="text-xs text-slate-500">{employee.employee_number} · {employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600">{employee.role}</td>
                  <td className="px-5 py-4 text-slate-600">{(employee.departments as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <EmployeeWorkRegionSelect employeeId={employee.id} regionId={employee.office_location_id} regions={regions ?? []} />
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${employee.is_active ? "badge-success" : "badge-danger"}`}>{employee.is_active ? "Aktif" : "Nonaktif"}</span>
                  </td>
                </tr>
              ))}
              {!employees?.length && (
                <tr><td colSpan={5} className="px-5 py-16 text-center">
                  <Users className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 font-medium text-slate-700">Belum ada data karyawan.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
