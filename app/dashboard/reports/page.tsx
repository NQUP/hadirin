import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { getAttendanceSummary } from "@/lib/attendance-summary";
import {
  getPeriodRange,
  parseEmployeeId,
  todayInJakarta,
  valueOf,
} from "@/lib/report-period";
import { AttendanceSummaryView } from "./attendance-summary-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZES = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const period = valueOf(params.period) || "monthly";
  const selectedDate =
    valueOf(params.date) ||
    (period === "monthly" ? todayInJakarta().slice(0, 7) : todayInJakarta());
  const employeeId =
    profile.role === "employee"
      ? undefined
      : parseEmployeeId(valueOf(params.employeeId));
  const range = getPeriodRange(
    period,
    selectedDate,
    valueOf(params.from),
    valueOf(params.to),
  );
  const printMode = valueOf(params.print) === "1";

  const requestedSize = Number(valueOf(params.pageSize));
  const pageSize = PAGE_SIZES.includes(requestedSize)
    ? requestedSize
    : DEFAULT_PAGE_SIZE;
  const requestedPage = Math.max(
    1,
    Math.floor(Number(valueOf(params.page))) || 1,
  );

  const result = await getAttendanceSummary(profile, { ...range, employeeId });
  const totalRecords = result.records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  if (!printMode && requestedPage > totalPages) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = valueOf(value);
      if (single !== undefined) query.set(key, single);
    }
    query.set("page", String(totalPages));
    redirect(`/dashboard/reports?${query.toString()}`);
  }

  const page = printMode ? 1 : requestedPage;
  const records = printMode
    ? result.records
    : result.records.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AttendanceSummaryView
      result={{ ...result, records }}
      role={profile.role}
      period={period}
      selectedDate={selectedDate}
      employeeId={employeeId ?? ""}
      pagination={{
        page,
        pageSize,
        totalPages: printMode ? 1 : totalPages,
        totalRecords,
      }}
      printMode={printMode}
    />
  );
}
