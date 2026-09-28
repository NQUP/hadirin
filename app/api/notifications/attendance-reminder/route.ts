import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

const TIME_ZONE = "Asia/Jakarta";

export async function POST() {
  const access = await requireApiProfile(["admin"]);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = createAdminClient();
  const now = new Date();
  const { date: attendanceDate, weekday, time } = getJakartaParts(now);

  const { data: schedules, error: schedulesError } = await admin
    .from("work_schedules")
    .select(
      "employee_id, shift_id, profiles!inner(id, full_name, is_active), shifts!inner(start_time, late_tolerance_minutes, is_active)",
    )
    .eq("weekday", weekday)
    .eq("profiles.is_active", true)
    .eq("shifts.is_active", true);

  if (schedulesError) {
    console.error("Attendance reminder schedules error:", schedulesError);
    return NextResponse.json(
      { error: "Gagal mengambil jadwal kerja." },
      { status: 500 },
    );
  }

  if (!schedules?.length) {
    return NextResponse.json({
      date: attendanceDate,
      checked: 0,
      notified: 0,
      skipped: 0,
      message: "Tidak ada jadwal kerja aktif hari ini.",
    });
  }

  const employeeIds = schedules.map((schedule) => schedule.employee_id);
  const { data: attendances, error: attendanceError } = await admin
    .from("attendance")
    .select("employee_id, clock_in_at")
    .eq("attendance_date", attendanceDate)
    .in("employee_id", employeeIds);

  if (attendanceError) {
    console.error("Attendance reminder attendance error:", attendanceError);
    return NextResponse.json(
      { error: "Gagal memeriksa absensi hari ini." },
      { status: 500 },
    );
  }

  const clockedIn = new Set(
    (attendances ?? [])
      .filter((attendance) => Boolean(attendance.clock_in_at))
      .map((attendance) => attendance.employee_id),
  );

  const dueSchedules = schedules.filter((schedule) => {
    if (clockedIn.has(schedule.employee_id)) return false;

    // Supabase represents joined relations as arrays in the generated type.
    // A work schedule has one shift, so use the first joined row.
    const shift = Array.isArray(schedule.shifts)
      ? schedule.shifts[0]
      : schedule.shifts;

    if (!shift) return false;

    const startTime = String(shift.start_time).slice(0, 5);
    const tolerance = Number(shift.late_tolerance_minutes ?? 0);
    return timeToMinutes(time) >= timeToMinutes(startTime) + tolerance;
  });

  if (!dueSchedules.length) {
    return NextResponse.json({
      date: attendanceDate,
      checked: schedules.length,
      due: 0,
      notified: 0,
      message: "Belum ada karyawan yang perlu diberi pengingat.",
    });
  }

  const eventKeys = dueSchedules.map(
    (schedule) =>
      `attendance-reminder:${schedule.employee_id}:${attendanceDate}`,
  );

  const { data: existing, error: existingError } = await admin
    .from("notifications")
    .select("recipient_id, event_key")
    .in("event_key", eventKeys);

  if (existingError) {
    console.error(
      "Attendance reminder existing notification error:",
      existingError,
    );
    return NextResponse.json(
      { error: "Gagal memeriksa notifikasi yang sudah ada." },
      { status: 500 },
    );
  }

  const existingKeys = new Set(
    (existing ?? []).map(
      (notification) =>
        `${notification.recipient_id}:${notification.event_key}`,
    ),
  );

  const rows = dueSchedules
    .map((schedule) => {
      const eventKey =
        `attendance-reminder:${schedule.employee_id}:${attendanceDate}`;

      if (existingKeys.has(`${schedule.employee_id}:${eventKey}`)) {
        return null;
      }

      return {
        recipient_id: schedule.employee_id,
        type: "attendance.reminder",
        title: "Jangan lupa absen",
        message: "Anda belum melakukan clock in hari ini.",
        body: "Anda belum melakukan clock in hari ini.",
        link: "/dashboard/attendance",
        href: "/dashboard/attendance",
        event_key: eventKey,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (!rows.length) {
    return NextResponse.json({
      date: attendanceDate,
      checked: schedules.length,
      due: dueSchedules.length,
      notified: 0,
      message: "Semua pengingat hari ini sudah pernah dikirim.",
    });
  }

  const { error: insertError } = await admin
    .from("notifications")
    .insert(rows);

  if (insertError) {
    console.error("Attendance reminder insert error:", insertError);
    return NextResponse.json(
      { error: "Gagal membuat notifikasi pengingat." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    date: attendanceDate,
    checked: schedules.length,
    due: dueSchedules.length,
    notified: rows.length,
  });
}

function getJakartaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: weekdayMap[values.weekday],
    time: `${values.hour}:${values.minute}`,
  };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}
