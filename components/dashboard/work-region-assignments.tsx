"use client";

import { Users } from "lucide-react";
import { EmployeeWorkRegionSelect } from "@/components/dashboard/employee-work-region-select";
import type { WorkRegion } from "@/components/dashboard/office-region-manager";

type Employee = {
  id: string;
  full_name: string;
  employee_number: string;
  email: string;
  office_location_id: string | null;
  is_active: boolean;
};

export function WorkRegionAssignments({
  employees,
  regions,
}: {
  employees: Employee[];
  regions: WorkRegion[];
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-slate-900">
          Penetapan Wilayah Karyawan
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Pilih wilayah kerja untuk setiap karyawan. Perubahan langsung
          disimpan.
        </p>
      </div>
      {employees.length ? (
        <div className="divide-y divide-slate-100">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {employee.full_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {employee.employee_number} · {employee.email}
                  </p>
                </div>
                {!employee.is_active && (
                  <span className="badge badge-danger">Nonaktif</span>
                )}
              </div>
              <EmployeeWorkRegionSelect
                employeeId={employee.id}
                regionId={employee.office_location_id}
                regions={regions}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="p-10 text-center text-sm text-slate-500">
          Belum ada karyawan yang dapat ditetapkan.
        </p>
      )}
    </section>
  );
}
