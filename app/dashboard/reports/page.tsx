import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { ReportView, type AttendanceReportRecord } from "./report-view";

export default async function ReportsPage() {
  const profile = await requireProfile(["manager", "admin"]);
  const supabase = await createClient();

  let employeeIds: string[] | null = null;
  if (profile.role === "manager") {
    const { data: team } = await supabase.from("profiles").select("id").eq("manager_id", profile.id);
    employeeIds = (team ?? []).map((member) => member.id);
  }

  let attendanceQuery = supabase
    .from("attendance")
    .select("employee_id, attendance_date, clock_in_at, clock_out_at, status, profiles!attendance_employee_id_fkey(full_name, employee_number)")
    .order("attendance_date", { ascending: false })
    .limit(5000);

  if (employeeIds) attendanceQuery = attendanceQuery.in("employee_id", employeeIds.length ? employeeIds : ["00000000-0000-0000-0000-000000000000"]);

  const [{ data: attendance }, { count: employeeCount }] = await Promise.all([
    attendanceQuery,
    profile.role === "admin"
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true)
      : supabase.from("profiles").select("id", { count: "exact", head: true }).eq("manager_id", profile.id).eq("is_active", true),
  ]);

  const records: AttendanceReportRecord[] = (attendance ?? []).map((record) => {
    const person = record.profiles as unknown as { full_name: string; employee_number: string } | null;
    return {
      employeeId: record.employee_id,
      date: record.attendance_date,
      clockIn: record.clock_in_at,
      clockOut: record.clock_out_at,
      status: record.status,
      name: person?.full_name ?? "Karyawan",
      number: person?.employee_number ?? "-",
    };
  });

  return <ReportView records={records} employeeCount={employeeCount ?? 0} />;
}
