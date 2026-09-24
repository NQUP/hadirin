import type { AppRole } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type ScheduleEmployee = {
  id: string;
  name: string;
  number: string;
};

export type ScheduleShift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  toleranceMinutes: number;
};

export type WorkScheduleRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  toleranceMinutes: number;
  weekday: number;
};

export type WorkScheduleResult = {
  employees: ScheduleEmployee[];
  shifts: ScheduleShift[];
  schedules: WorkScheduleRecord[];
};

type ScopedProfile = {
  id: string;
  full_name: string;
  employee_number: string;
  role: AppRole;
};

type ScheduleRow = {
  id: string;
  employee_id: string;
  shift_id: string;
  weekday: number;
};

export async function getWorkScheduleData(profile: { id: string; role: AppRole }): Promise<WorkScheduleResult> {
  const supabase = await createClient();
  let profilesQuery = supabase.from("profiles").select("id, full_name, employee_number, role").eq("is_active", true).order("full_name");

  if (profile.role === "employee") {
    profilesQuery = profilesQuery.eq("id", profile.id);
  } else if (profile.role === "manager") {
    profilesQuery = profilesQuery.eq("manager_id", profile.id);
  } else {
    profilesQuery = profilesQuery.eq("role", "employee");
  }

  const { data: profiles, error: profilesError } = await profilesQuery;
  if (profilesError) throw new Error("Gagal mengambil data employee.");

  const scopedProfiles = (profiles ?? []) as ScopedProfile[];
  const employeeIds = scopedProfiles.map((employee) => employee.id);
  const scopedIds = employeeIds.length ? employeeIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: schedules, error: schedulesError }, { data: shifts, error: shiftsError }] = await Promise.all([
    supabase.from("work_schedules").select("id, employee_id, shift_id, weekday").in("employee_id", scopedIds).order("weekday"),
    createAdminClient().from("shifts").select("id, name, start_time, end_time, late_tolerance_minutes").eq("is_active", true).order("start_time"),
  ]);

  if (schedulesError || shiftsError) throw new Error("Gagal mengambil data jadwal kerja.");

  const profileMap = new Map(scopedProfiles.map((employee) => [employee.id, employee]));
  const shiftMap = new Map((shifts ?? []).map((shift) => [shift.id, shift]));
  const scheduleRecords = ((schedules ?? []) as ScheduleRow[]).flatMap((schedule) => {
    const employee = profileMap.get(schedule.employee_id);
    const shift = shiftMap.get(schedule.shift_id);
    if (!employee || !shift) return [];
    return [{
      id: schedule.id,
      employeeId: employee.id,
      employeeName: employee.full_name,
      employeeNumber: employee.employee_number,
      shiftId: shift.id,
      shiftName: shift.name,
      startTime: shift.start_time,
      endTime: shift.end_time,
      toleranceMinutes: shift.late_tolerance_minutes,
      weekday: schedule.weekday,
    }];
  });

  return {
    employees: scopedProfiles.map((employee) => ({ id: employee.id, name: employee.full_name, number: employee.employee_number })),
    shifts: (shifts ?? []).map((shift) => ({ id: shift.id, name: shift.name, startTime: shift.start_time, endTime: shift.end_time, toleranceMinutes: shift.late_tolerance_minutes })),
    schedules: scheduleRecords,
  };
}