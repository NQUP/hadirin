import type { AppRole } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type CalendarStatus = "present" | "late" | "permission" | "sick" | "leave" | "absent" | "non_working";

export type AttendanceCalendarRecord = {
  employeeId: string;
  date: string;
  status: CalendarStatus;
  clockIn: string | null;
  clockOut: string | null;
  lateMinutes: number;
  shiftName: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  leaveType: "permission" | "sick" | "leave" | null;
  leaveReason: string | null;
  notes: string | null;
};

export type AttendanceCalendarEmployee = { id: string; name: string; number: string };

export type AttendanceCalendarResult = {
  from: string;
  to: string;
  employee: AttendanceCalendarEmployee | null;
  employees: AttendanceCalendarEmployee[];
  records: AttendanceCalendarRecord[];
};

type ProfileRow = { id: string; full_name: string; employee_number: string; role: AppRole };
type ScheduleRow = { employee_id: string; weekday: number; shift_id: string };
type ShiftRow = { id: string; name: string; start_time: string; end_time: string; late_tolerance_minutes: number };
type AttendanceRow = { employee_id: string; attendance_date: string; clock_in_at: string | null; clock_out_at: string | null; status: string; notes: string | null };
type LeaveRow = { employee_id: string; leave_type: "permission" | "sick" | "leave"; start_date: string; end_date: string; reason: string };

export async function getAttendanceCalendar(
  profile: { id: string; role: AppRole },
  filters: { from: string; to: string; employeeId?: string },
): Promise<AttendanceCalendarResult> {
  const from = validDate(filters.from);
  const to = validDate(filters.to);
  if (!from || !to || from > to) throw new Error("Periode kalender tidak valid.");

  const supabase = await createClient();
  let profilesQuery = supabase.from("profiles").select("id, full_name, employee_number, role").eq("is_active", true).order("full_name");
  if (profile.role === "employee") profilesQuery = profilesQuery.eq("id", profile.id);
  if (profile.role === "manager") profilesQuery = profilesQuery.eq("manager_id", profile.id);
  if (profile.role === "admin") profilesQuery = profilesQuery.eq("role", "employee");
  if (filters.employeeId && profile.role !== "employee") profilesQuery = profilesQuery.eq("id", filters.employeeId);

  const { data: profiles, error: profilesError } = await profilesQuery;
  if (profilesError) throw new Error("Gagal mengambil employee kalender.");
  const employees = (profiles ?? []) as ProfileRow[];
  const employeeIds = employees.map((employee) => employee.id);
  const ids = employeeIds.length ? employeeIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: schedules, error: scheduleError }, { data: attendance, error: attendanceError }, { data: leaves, error: leaveError }] = await Promise.all([
    supabase.from("work_schedules").select("employee_id, weekday, shift_id").in("employee_id", ids),
    supabase.from("attendance").select("employee_id, attendance_date, clock_in_at, clock_out_at, status, notes").in("employee_id", ids).gte("attendance_date", from).lte("attendance_date", to),
    supabase.from("leave_requests").select("employee_id, leave_type, start_date, end_date, reason").in("employee_id", ids).eq("status", "approved").lte("start_date", to).gte("end_date", from),
  ]);
  if (scheduleError || attendanceError || leaveError) throw new Error("Gagal mengambil data kalender.");

  const scheduleRows = (schedules ?? []) as ScheduleRow[];
  const shiftIds = [...new Set(scheduleRows.map((schedule) => schedule.shift_id))];
  const adminClient = createAdminClient();
  const { data: shifts, error: shiftsError } = shiftIds.length
    ? await adminClient.from("shifts").select("id, name, start_time, end_time, late_tolerance_minutes").in("id", shiftIds)
    : { data: [], error: null };
  if (shiftsError) throw new Error("Gagal mengambil shift kalender.");

  const shiftMap = new Map((shifts ?? []).map((shift) => [shift.id, shift as ShiftRow]));
  const scheduleMap = new Map<string, ScheduleRow[]>();
  for (const schedule of scheduleRows) {
    if (!shiftMap.has(schedule.shift_id)) continue;
    scheduleMap.set(schedule.employee_id, [...(scheduleMap.get(schedule.employee_id) ?? []), schedule]);
  }
  const attendanceMap = new Map((attendance ?? []).map((row) => [`${row.employee_id}:${row.attendance_date}`, row as AttendanceRow]));
  const leaveRows = (leaves ?? []) as LeaveRow[];
  const employee = employees.length === 1 ? employees[0] : null;
  const records = employee ? buildRecords(employee.id, from, to, scheduleMap, shiftMap, attendanceMap, leaveRows) : [];

  return {
    from,
    to,
    employee: employee ? { id: employee.id, name: employee.full_name, number: employee.employee_number } : null,
    employees: employees.map((item) => ({ id: item.id, name: item.full_name, number: item.employee_number })),
    records,
  };
}

function buildRecords(employeeId: string, from: string, to: string, scheduleMap: Map<string, ScheduleRow[]>, shiftMap: Map<string, ShiftRow>, attendanceMap: Map<string, AttendanceRow>, leaves: LeaveRow[]) {
  return datesBetween(from, to).map((date) => {
    const leave = leaves.find((item) => item.employee_id === employeeId && item.start_date <= date && item.end_date >= date) ?? null;
    const schedule = (scheduleMap.get(employeeId) ?? []).find((item) => item.weekday === dayOfWeek(date));
    const shift = schedule ? shiftMap.get(schedule.shift_id) ?? null : null;
    const attendance = attendanceMap.get(`${employeeId}:${date}`) ?? null;
    const status = leave ? leave.leave_type : attendance ? attendanceStatus(attendance, shift) : schedule ? "absent" : "non_working";
    return {
      employeeId,
      date,
      status,
      clockIn: attendance?.clock_in_at ?? null,
      clockOut: attendance?.clock_out_at ?? null,
      lateMinutes: attendance?.clock_in_at && shift ? Math.max(0, differenceInMinutes(localTime(attendance.clock_in_at), shift.start_time)) : 0,
      shiftName: shift?.name ?? null,
      shiftStart: shift?.start_time ?? null,
      shiftEnd: shift?.end_time ?? null,
      leaveType: leave?.leave_type ?? null,
      leaveReason: leave?.reason ?? null,
      notes: attendance?.notes ?? null,
    } satisfies AttendanceCalendarRecord;
  });
}

function attendanceStatus(attendance: AttendanceRow, shift: ShiftRow | null): CalendarStatus {
  if (attendance.status === "late") return "late";
  if (shift && attendance.clock_in_at && differenceInMinutes(localTime(attendance.clock_in_at), shift.start_time) > shift.late_tolerance_minutes) return "late";
  return "present";
}

function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }
function datesBetween(from: string, to: string) { const dates: string[] = []; const cursor = new Date(`${from}T00:00:00Z`); const end = new Date(`${to}T00:00:00Z`); while (cursor <= end) { dates.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); } return dates; }
function dayOfWeek(value: string) { return new Date(`${value}T00:00:00Z`).getUTCDay(); }
function localTime(value: string) { return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)); }
function differenceInMinutes(later: string, earlier: string) { const [laterHour, laterMinute] = later.slice(0, 5).split(":").map(Number); const [earlierHour, earlierMinute] = earlier.slice(0, 5).split(":").map(Number); return laterHour * 60 + laterMinute - (earlierHour * 60 + earlierMinute); }