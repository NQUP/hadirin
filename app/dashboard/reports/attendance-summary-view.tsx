"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";

import type { AppRole } from "@/types/database";
import type {
  AttendanceSummaryRecord,
  AttendanceSummaryResult,
  AttendanceSummaryStatus,
} from "@/lib/attendance-summary";

const statusLabels: Record<AttendanceSummaryStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  permission: "Izin",
  sick: "Sakit",
  leave: "Cuti",
  absent: "Absent",
};

const statusStyles: Record<AttendanceSummaryStatus, string> = {
  present: "badge-success",
  late: "badge-warning",
  permission: "bg-sky-50 text-sky-700",
  sick: "bg-violet-50 text-violet-700",
  leave: "bg-indigo-50 text-indigo-700",
  absent: "badge-danger",
};

const PAGE_SIZES = [10, 20, 50, 100];

export function AttendanceSummaryView({
  result,
  role,
  period,
  selectedDate,
  employeeId,
  pagination,
  printMode,
}: {
  result: AttendanceSummaryResult;
  role: AppRole;
  period: string;
  selectedDate: string;
  employeeId: string;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  printMode: boolean;
}) {
  const { summary } = result;
  const { page, pageSize, totalPages, totalRecords } = pagination;
  const periodLabel = `${formatDate(result.from)} - ${formatDate(result.to)}`;
  const firstRow = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, totalRecords);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!printMode) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [printMode]);

  function buildQuery(extra: Record<string, string>) {
    const params = new URLSearchParams({ period, date: selectedDate });
    if (period === "custom") {
      params.set("from", result.from);
      params.set("to", result.to);
    }
    if (employeeId) params.set("employeeId", employeeId);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    return params.toString();
  }

  function pageHref(targetPage: number, size = pageSize) {
    return `?${buildQuery({ page: String(targetPage), pageSize: String(size) })}`;
  }

  const printHref = `?${buildQuery({ print: "1" })}`;

  async function exportExcel() {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/reports/attendance-summary/export?${buildQuery({})}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("export failed");
      const payload = (await response.json()) as {
        records: AttendanceSummaryRecord[];
      };
      const rows = payload.records.map((record, index) => [
        index + 1,
        record.date,
        record.name,
        record.number,
        formatTime(record.clockIn),
        formatTime(record.clockOut),
        statusLabels[record.status],
        record.lateMinutes,
        record.workMinutes === null
          ? "-"
          : (record.workMinutes / 60).toFixed(2),
      ]);
      const sheet = XLSX.utils.aoa_to_sheet([
        ["REKAP KEHADIRAN", periodLabel],
        [],
        [
          "No",
          "Tanggal",
          "Employee",
          "Nomor",
          "Jam masuk",
          "Jam pulang",
          "Status",
          "Terlambat (menit)",
          "Durasi kerja (jam)",
        ],
        ...rows,
      ]);
      sheet["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 26 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Rekap Kehadiran");
      XLSX.writeFile(
        workbook,
        `rekap-kehadiran-${result.from}-${result.to}.xlsx`,
      );
    } catch {
      window.alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="report-print-area space-y-6">
      <div className="slide-up flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
            <BarChart3 className="size-3.5" />
            Rekap kehadiran
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {role === "employee" ? "Rekap Kehadiran Saya" : "Rekap Kehadiran"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportExcel}
            disabled={exporting}
            className="action-button border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            {exporting ? "Menyiapkan..." : "Excel"}
          </button>
          {printMode ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="action-button bg-slate-900 text-white shadow-sm hover:bg-slate-800"
            >
              <FileText className="size-4" />
              PDF
            </button>
          ) : (
            <a
              href={printHref}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button bg-slate-900 text-white shadow-sm hover:bg-slate-800"
            >
              <FileText className="size-4" />
              PDF
            </a>
          )}
        </div>
      </div>

      <form
        method="get"
        className="report-filters slide-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm print:hidden"
      >
        <input type="hidden" name="pageSize" value={pageSize} />
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">
            Periode
            <select
              name="period"
              defaultValue={period}
              className="field mt-1.5"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="custom">Rentang tanggal</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Tanggal acuan
            <input
              name="date"
              type={period === "monthly" ? "month" : "date"}
              defaultValue={selectedDate}
              className="field mt-1.5"
            />
          </label>
          {period === "custom" && (
            <>
              <label className="text-xs font-semibold text-slate-600">
                Dari
                <input
                  name="from"
                  type="date"
                  defaultValue={result.from}
                  className="field mt-1.5"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Sampai
                <input
                  name="to"
                  type="date"
                  defaultValue={result.to}
                  className="field mt-1.5"
                />
              </label>
            </>
          )}
          {role !== "employee" && (
            <label className="text-xs font-semibold text-slate-600">
              Employee
              <select
                name="employeeId"
                defaultValue={employeeId}
                className="field mt-1.5"
              >
                <option value="">Semua employee</option>
                {result.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.number})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <button
          type="submit"
          className="action-button mt-4 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
        >
          Terapkan filter
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6 print:hidden">
        <SummaryCard
          title="Hadir"
          value={summary.present}
          icon={CheckCircle2}
          color="text-emerald-600 bg-emerald-50"
        />
        <SummaryCard
          title="Terlambat"
          value={summary.late}
          icon={Clock3}
          color="text-amber-600 bg-amber-50"
        />
        <SummaryCard
          title="Izin"
          value={summary.permission}
          icon={CalendarDays}
          color="text-sky-600 bg-sky-50"
        />
        <SummaryCard
          title="Sakit"
          value={summary.sick}
          icon={Stethoscope}
          color="text-violet-600 bg-violet-50"
        />
        <SummaryCard
          title="Cuti"
          value={summary.leave}
          icon={CalendarDays}
          color="text-indigo-600 bg-indigo-50"
        />
        <SummaryCard
          title="Absent"
          value={summary.absent}
          icon={ShieldAlert}
          color="text-rose-600 bg-rose-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 print:hidden">
        <Metric label="Total hari kerja" value={summary.totalWorkDays} />
        <Metric
          label="Total terlambat"
          value={`${summary.totalLateMinutes} menit`}
        />
        <Metric
          label="Rata-rata jam kerja"
          value={
            summary.averageWorkHours === null
              ? "-"
              : `${summary.averageWorkHours.toFixed(2)} jam`
          }
        />
      </div>

      <div className="report-detail-table overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        <div className="hidden px-2 pb-5 text-center print:block">
          <h1 className="text-xl font-bold uppercase text-black">
            REKAP KEHADIRAN
          </h1>
          <p className="mt-1 text-sm font-medium uppercase text-black">
            {periodLabel}
          </p>
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm print:min-w-0 print:text-xs">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 print:bg-[#d9eaf7] print:text-black">
              <tr>
                {[
                  "Tanggal",
                  ...(role === "employee" ? [] : ["Employee"]),
                  "Jam masuk",
                  "Jam pulang",
                  "Status",
                  "Terlambat",
                  "Durasi kerja",
                ].map((header) => (
                  <th
                    key={header}
                    className="border border-slate-300 px-3 py-2.5 font-semibold print:border-black"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.records.map((record) => (
                <tr
                  key={`${record.employeeId}-${record.date}`}
                  className="text-slate-700 print:text-black"
                >
                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {formatDate(record.date)}
                  </td>
                  {role !== "employee" && (
                    <td className="border border-slate-200 px-3 py-2.5 font-medium text-slate-900 print:border-black print:text-black">
                      {record.name}
                      <span className="ml-2 text-xs text-slate-400">
                        {record.number}
                      </span>
                    </td>
                  )}
                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {formatTime(record.clockIn)}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {formatTime(record.clockOut)}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    <span className={`badge ${statusStyles[record.status]}`}>
                      {statusLabels[record.status]}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {record.lateMinutes ? `${record.lateMinutes} menit` : "-"}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {record.workMinutes === null
                      ? "-"
                      : `${(record.workMinutes / 60).toFixed(2)} jam`}
                  </td>
                </tr>
              ))}
              {!result.records.length && (
                <tr>
                  <td
                    colSpan={role === "employee" ? 6 : 7}
                    className="border border-slate-300 px-5 py-14 text-center text-slate-500 print:border-black"
                  >
                    Tidak ada data pada periode atau scope role ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!printMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 print:hidden">
            <p>
              Menampilkan {firstRow}-{lastRow} dari {totalRecords}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs">Per halaman</span>
              {PAGE_SIZES.map((size) => (
                <a
                  key={size}
                  href={pageHref(1, size)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${size === pageSize ? "bg-blue-600 text-white" : "border border-slate-200 hover:bg-slate-50"}`}
                >
                  {size}
                </a>
              ))}
              <a
                href={pageHref(page - 1)}
                aria-disabled={page <= 1}
                className={`rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
              >
                Sebelumnya
              </a>
              <span className="text-xs">
                Halaman {page} / {totalPages}
              </span>
              <a
                href={pageHref(page + 1)}
                aria-disabled={page >= totalPages}
                className={`rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
              >
                Berikutnya
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: typeof BarChart3;
  color: string;
}) {
  return (
    <article className="card-hover rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`grid size-8 place-items-center rounded-xl ${color}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
