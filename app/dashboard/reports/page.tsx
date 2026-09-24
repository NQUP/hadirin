import { requireProfile } from "@/lib/auth";
import { getAttendanceSummary } from "@/lib/attendance-summary";
import { AttendanceSummaryView } from "./attendance-summary-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const params = await searchParams;
  const period = valueOf(params.period) || "monthly";
  const selectedDate = valueOf(params.date) || (period === "monthly" ? todayInJakarta().slice(0, 7) : todayInJakarta());
  const requestedEmployeeId = valueOf(params.employeeId) || undefined;
  const employeeId = profile.role === "employee" ? undefined : requestedEmployeeId;
  const range = getPeriodRange(period, selectedDate, valueOf(params.from), valueOf(params.to));

  const result = await getAttendanceSummary(profile, { ...range, employeeId });
  return <AttendanceSummaryView result={result} role={profile.role} period={period} selectedDate={selectedDate} employeeId={employeeId ?? ""} />;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function todayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function getPeriodRange(period: string, selectedDate: string, from?: string, to?: string) {
  if (period === "custom") {
    return { from: from || selectedDate, to: to || selectedDate };
  }

  if (period === "daily") {
    return { from: selectedDate, to: selectedDate };
  }

  if (period === "weekly") {
    const date = new Date(`${selectedDate}T00:00:00Z`);
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    const start = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 6);
    return { from: start, to: date.toISOString().slice(0, 10) };
  }

  const month = /^\d{4}-\d{2}$/.test(selectedDate) ? selectedDate : selectedDate.slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}
