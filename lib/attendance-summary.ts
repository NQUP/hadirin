import type { AppRole } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type AttendanceSummaryStatus = "present" | "late" | "permission" | "sick" | "leave" | "absent";

export type AttendanceSummaryRecord = {
  employeeId: string;
  date: string;
  name: string;
  number: string;
  clockIn: string | null;
  clockOut: string | null;
  status: AttendanceSummaryStatus;
  lateMinutes: number;
  workMinutes: number | null;
};

export type AttendanceSummary = {
  totalWorkDays: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  leave: number;
  absent: number;
  totalLateMinutes: number;
  averageWorkHours: number | null;
};

export type AttendanceSummaryEmployee = {
  id: string;
  name: string;
  number: string;
};

export type AttendanceSummaryResult = {
  from: string;
  to: string;
  records: AttendanceSummaryRecord[];
  summary: AttendanceSummary;
  employees: AttendanceSummaryEmployee[];
};

type SummaryProfile = {
  id: string;
  full_name: string;
  employee_number: string;
  role: AppRole;
};

type ScheduleRow = {
  employee_id: string;
  weekday: number;
  shift_id: string;
  shift?: {
    start_time: string;
    end_time: string;
    late_tolerance_minutes: number;
  };
};

type AttendanceRow = {
  employee_id: string;
  attendance_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  status: string;
};

type LeaveRow = {
  employee_id: string;
  leave_type: "permission" | "sick" | "leave";
  start_date: string;
  end_date: string;
};

export async function getAttendanceSummary(
  profile: { id: string; role: AppRole },
  filters: { from: string; to: string; employeeId?: string },
): Promise<AttendanceSummaryResult> {
  const supabase = await createClient();
  const from = normalizeDate(filters.from);
  const to = normalizeDate(filters.to);

  if (!from || !to || from > to) {
    throw new Error("Periode rekap tidak valid.");
  }

  let profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, employee_number, role")
    .eq("is_active", true)
    .order("full_name");

  if (profile.role === "employee") {
    profilesQuery = profilesQuery.eq("id", profile.id);
  } else if (profile.role === "manager") {
    profilesQuery = profilesQuery.eq("manager_id", profile.id);
  } else {
    profilesQuery = profilesQuery.eq("role", "employee");
  }

  if (filters.employeeId && profile.role !== "employee") {
    profilesQuery = profilesQuery.eq("id", filters.employeeId);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError) {
    throw new Error("Gagal mengambil data employee.");
  }

  const scopedProfiles = (profiles ?? []) as SummaryProfile[];
  const employeeIds = scopedProfiles.map((employee) => employee.id);
  const emptyIds = ["00000000-0000-0000-0000-000000000000"];
  const scopedIds = employeeIds.length ? employeeIds : emptyIds;

  const [{ data: schedules, error: schedulesError }, { data: attendance, error: attendanceError }, { data: leaves, error: leavesError }] = await Promise.all([
    supabase
      .from("work_schedules")
      .select("employee_id, weekday, shift_id")
      .in("employee_id", scopedIds),
    supabase
      .from("attendance")
      .select("employee_id, attendance_date, clock_in_at, clock_out_at, status")
      .in("employee_id", scopedIds)
      .gte("attendance_date", from)
      .lte("attendance_date", to),
    supabase
      .from("leave_requests")
      .select("employee_id, leave_type, start_date, end_date")
      .in("employee_id", scopedIds)
      .eq("status", "approved")
      .lte("start_date", to)
      .gte("end_date", from),
  ]);

  if (schedulesError || attendanceError || leavesError) {
    throw new Error("Gagal mengambil data rekap kehadiran.");
  }

  const scheduleRows = (schedules ?? []) as ScheduleRow[];
  const shiftIds = [...new Set(scheduleRows.map((schedule) => schedule.shift_id))];
  const adminSupabase = createAdminClient();
  const { data: shifts, error: shiftsError } = shiftIds.length
    ? await adminSupabase.from("shifts").select("id, start_time, end_time, late_tolerance_minutes").in("id", shiftIds)
    : { data: [], error: null };

  if (shiftsError) {
    throw new Error("Gagal mengambil konfigurasi shift.");
  }

  const shiftMap = new Map((shifts ?? []).map((shift) => [shift.id, shift]));
  const scheduleMap = new Map<string, ScheduleRow[]>();
  for (const schedule of scheduleRows) {
    const shift = shiftMap.get(schedule.shift_id);
    if (!shift) continue;
    schedule.shift = shift;
    const rows = scheduleMap.get(schedule.employee_id) ?? [];
    rows.push(schedule);
    scheduleMap.set(schedule.employee_id, rows);
  }

  const attendanceMap = new Map<string, AttendanceRow>();
  for (const row of (attendance ?? []) as AttendanceRow[]) {
    attendanceMap.set(`${row.employee_id}:${row.attendance_date}`, row);
  }

  const leaveRows = (leaves ?? []) as LeaveRow[];
  const records: AttendanceSummaryRecord[] = [];

  for (const employee of scopedProfiles) {
    const employeeSchedules = scheduleMap.get(employee.id) ?? [];

    for (const date of datesBetween(from, to)) {
      const weekday = dayOfWeek(date);
      const schedule = employeeSchedules.find((row) => row.weekday === weekday);
      const attendanceRow = attendanceMap.get(`${employee.id}:${date}`) ?? null;
      const leave = leaveRows.find(
        (row) => row.employee_id === employee.id && row.start_date <= date && row.end_date >= date,
      );
      if (!schedule && !attendanceRow && !leave) continue;

      const metrics = attendanceRow ? getAttendanceMetrics(attendanceRow, schedule?.shift ?? null) : null;
      const status = metrics?.status ?? leave?.leave_type ?? (schedule ? "absent" : "present");

      records.push({
        employeeId: employee.id,
        date,
        name: employee.full_name,
        number: employee.employee_number,
        clockIn: attendanceRow?.clock_in_at ?? null,
        clockOut: attendanceRow?.clock_out_at ?? null,
        status,
        lateMinutes: metrics?.lateMinutes ?? 0,
        workMinutes: metrics?.workMinutes ?? null,
      });
    }
  }

  records.sort((left, right) => right.date.localeCompare(left.date) || left.name.localeCompare(right.name));

  return {
    from,
    to,
    records,
    summary: summarize(records),
    employees: scopedProfiles.map((employee) => ({ id: employee.id, name: employee.full_name, number: employee.employee_number })),
  };
}

function getAttendanceMetrics(row: AttendanceRow, shift: ScheduleRow["shift"] | null) {
  const lateMinutes = row.clock_in_at && shift ? Math.max(0, differenceInMinutes(localTime(row.clock_in_at), shift.start_time)) : 0;
  const status: AttendanceSummaryStatus = row.status === "late" || Boolean(shift && lateMinutes > shift.late_tolerance_minutes) ? "late" : "present";
  const workMinutes = row.clock_in_at && row.clock_out_at
    ? Math.max(0, Math.round((Date.parse(row.clock_out_at) - Date.parse(row.clock_in_at)) / 60000))
    : null;
  return { status, lateMinutes, workMinutes };
}

function summarize(records: AttendanceSummaryRecord[]): AttendanceSummary {
  const workMinutes = records.flatMap((record) => (record.workMinutes === null ? [] : [record.workMinutes]));
  return {
    totalWorkDays: records.length,
    present: records.filter((record) => record.status === "present").length,
    late: records.filter((record) => record.status === "late").length,
    permission: records.filter((record) => record.status === "permission").length,
    sick: records.filter((record) => record.status === "sick").length,
    leave: records.filter((record) => record.status === "leave").length,
    absent: records.filter((record) => record.status === "absent").length,
    totalLateMinutes: records.reduce((total, record) => total + record.lateMinutes, 0),
    averageWorkHours: workMinutes.length ? workMinutes.reduce((total, minutes) => total + minutes, 0) / workMinutes.length / 60 : null,
  };
}

function normalizeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function datesBetween(from: string, to: string) {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function dayOfWeek(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function localTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

function differenceInMinutes(later: string, earlier: string) {
  const [laterHour, laterMinute] = later.slice(0, 5).split(":").map(Number);
  const [earlierHour, earlierMinute] = earlier.slice(0, 5).split(":").map(Number);
  return laterHour * 60 + laterMinute - (earlierHour * 60 + earlierMinute);
}