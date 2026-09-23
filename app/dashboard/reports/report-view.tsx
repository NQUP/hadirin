"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";

export type AttendanceReportRecord = {
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  name: string;
  number: string;
};

type Stat = {
  title: string;
  value: number;
  detail: string;
  icon: typeof BarChart3;
  color: string;
};

/* =========================================================
   HELPER
========================================================= */

function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
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

function statusLabel(status: string) {
  switch (status) {
    case "late":
      return "Terlambat";

    case "present":
      return "Hadir";

    case "absent":
      return "Tidak hadir";

    case "early_leave":
      return "Pulang awal";

    default:
      return status || "-";
  }
}

/* =========================================================
   EXCEL STYLE
========================================================= */

const excelBorder = {
  top: {
    style: "thin",
    color: {
      rgb: "000000",
    },
  },
  bottom: {
    style: "thin",
    color: {
      rgb: "000000",
    },
  },
  left: {
    style: "thin",
    color: {
      rgb: "000000",
    },
  },
  right: {
    style: "thin",
    color: {
      rgb: "000000",
    },
  },
};

const excelHeaderStyle = {
  font: {
    bold: true,
    sz: 10,
    color: {
      rgb: "000000",
    },
  },

  fill: {
    fgColor: {
      rgb: "D9EAF7",
    },
  },

  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  },

  border: excelBorder,
};

const excelDataStyle = {
  font: {
    sz: 10,
    color: {
      rgb: "000000",
    },
  },

  alignment: {
    vertical: "center",
  },

  border: excelBorder,
};

/* =========================================================
   COMPONENT
========================================================= */

export function ReportView({
  records,
  employeeCount,
}: {
  records: AttendanceReportRecord[];
  employeeCount: number;
}) {
  const [month, setMonth] = useState(currentMonth());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (fromDate || toDate) {
        return (
          (!fromDate || record.date >= fromDate) &&
          (!toDate || record.date <= toDate)
        );
      }

      return !month || record.date.startsWith(month);
    });
  }, [records, month, fromDate, toDate]);

  /* =======================================================
     STATISTIC
  ======================================================= */

  const stats: Stat[] = [
    {
      title: "Hari tercatat",
      value: filteredRecords.length,
      detail: "Total absensi periode ini",
      icon: BarChart3,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Hadir normal",
      value: filteredRecords.filter((record) => record.status === "present")
        .length,
      detail: "Status tepat waktu",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Terlambat",
      value: filteredRecords.filter((record) => record.status === "late")
        .length,
      detail: "Perlu dievaluasi",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Belum clock out",
      value: filteredRecords.filter(
        (record) => record.clockIn && !record.clockOut,
      ).length,
      detail: "Perlu ditindaklanjuti",
      icon: Clock3,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  /* =======================================================
     PERIOD LABEL
  ======================================================= */

  const titleDate =
    fromDate && toDate && fromDate === toDate
      ? formatDate(fromDate)
      : fromDate || toDate
        ? `${fromDate ? formatDate(fromDate) : "Awal"} - ${
            toDate ? formatDate(toDate) : "Sekarang"
          }`
        : month
          ? new Intl.DateTimeFormat("id-ID", {
              month: "long",
              year: "numeric",
            }).format(new Date(`${month}-01T00:00:00+07:00`))
          : "Semua Periode";

  const periodLabel =
    fromDate || toDate
      ? `${fromDate || "awal"}-${toDate || "sekarang"}`
      : month || "semua-periode";

  /* =======================================================
     RESET FILTER
  ======================================================= */

  function resetFilters() {
    setMonth(currentMonth());
    setFromDate("");
    setToDate("");
  }

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  function exportExcel() {
    const headers = [
      "No",
      "Tanggal",
      "Karyawan",
      "Nomor",
      "Clock In",
      "Clock Out",
      "Status",
    ];

    const dataRows = filteredRecords.map((record, index) => [
      index + 1,
      formatDate(record.date),
      record.name,
      record.number,
      formatTime(record.clockIn),
      formatTime(record.clockOut),
      statusLabel(record.status),
    ]);

    /*
     * Struktur Excel:
     *
     * A1:G1 = Judul
     * A2:G2 = kosong
     * A3:G3 = Header
     * A4:G... = Data
     */

    const sheetData = [
      [`LAPORAN ABSENSI ${titleDate.toUpperCase()}`],
      [],
      headers,
      ...dataRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    /* =====================================================
       MERGE JUDUL
    ===================================================== */

    worksheet["!merges"] = [
      {
        s: {
          r: 0,
          c: 0,
        },
        e: {
          r: 0,
          c: 6,
        },
      },
    ];

    /* =====================================================
       COLUMN WIDTH
    ===================================================== */

    worksheet["!cols"] = [
      {
        wch: 6,
      },
      {
        wch: 20,
      },
      {
        wch: 28,
      },
      {
        wch: 18,
      },
      {
        wch: 14,
      },
      {
        wch: 14,
      },
      {
        wch: 18,
      },
    ];

    /* =====================================================
       ROW HEIGHT
    ===================================================== */

    worksheet["!rows"] = [
      {
        hpt: 28,
      },
      {
        hpt: 8,
      },
      {
        hpt: 24,
      },
    ];

    for (let i = 3; i < sheetData.length; i++) {
      worksheet["!rows"][i] = {
        hpt: 22,
      };
    }

    /* =====================================================
       TITLE STYLE
    ===================================================== */

    worksheet["A1"].s = {
      font: {
        bold: true,
        sz: 14,
        color: {
          rgb: "000000",
        },
      },

      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    /* =====================================================
       HEADER STYLE
    ===================================================== */

    for (let col = 0; col < 7; col++) {
      const cell = XLSX.utils.encode_cell({
        r: 2,
        c: col,
      });

      if (worksheet[cell]) {
        worksheet[cell].s = excelHeaderStyle;
      }
    }

    /* =====================================================
       DATA STYLE
    ===================================================== */

    for (let row = 3; row < sheetData.length; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

        if (!worksheet[cell]) {
          continue;
        }

        worksheet[cell].s = {
          ...excelDataStyle,

          alignment: {
            vertical: "center",

            horizontal:
              col === 0 || col === 3 || col === 4 || col === 5
                ? "center"
                : "left",
          },
        };
      }
    }

    /* =====================================================
       PRINT SETTINGS
    ===================================================== */

    worksheet["!pageSetup"] = {
      orientation: "landscape",
      paperSize: "9",
      fitToWidth: 1,
      fitToHeight: 0,
    };

    worksheet["!margins"] = {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };

    /* =====================================================
       FREEZE HEADER
    ===================================================== */

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 3,
    };

    /* =====================================================
       WORKBOOK
    ===================================================== */

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");

    XLSX.writeFile(workbook, `laporan-absensi-${periodLabel}.xlsx`);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="report-print-area">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="slide-up mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
            <BarChart3 className="size-3.5" />
            Laporan
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Laporan Absensi
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Rekap detail berdasarkan periode yang dipilih.
          </p>
        </div>

        <div className="report-actions flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={exportExcel}
            className="action-button border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="action-button bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          >
            <FileText className="size-4" />
            PDF
          </button>
        </div>
      </div>

      {/* ===================================================
          FILTER
      =================================================== */}

      <div className="report-filters mb-7 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-40 flex-1 text-xs font-semibold text-slate-600">
            Bulan / tahun
            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setFromDate("");
                setToDate("");
              }}
              className="field mt-1.5"
            />
          </label>

          <label className="min-w-40 flex-1 text-xs font-semibold text-slate-600">
            Tanggal mulai
            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setMonth("");
              }}
              className="field mt-1.5"
            />
          </label>

          <label className="min-w-40 flex-1 text-xs font-semibold text-slate-600">
            Tanggal akhir
            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setMonth("");
              }}
              className="field mt-1.5"
            />
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="action-button border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Menampilkan {filteredRecords.length} absensi untuk periode {titleDate}
          .
        </p>
      </div>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="report-summary grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        {stats.map(({ title, value, detail, icon: StatIcon, color }, index) => (
          <article
            key={title}
            className={`card-hover slide-up stagger-${
              index + 1
            } rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{title}</p>

              <div
                className={`grid size-9 place-items-center rounded-xl ${color}`}
              >
                <StatIcon className="size-[18px]" />
              </div>
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>

            <p className="mt-2 text-xs text-slate-400">{detail}</p>
          </article>
        ))}
      </div>

      {/* ===================================================
          PRINT TITLE + TABLE
      =================================================== */}

      <div className="report-detail-table mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm print:mt-0 print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        {/* PRINT HEADER */}

        <div className="hidden px-2 pb-5 text-center print:block">
          <h1 className="text-xl font-bold uppercase text-black">
            LAPORAN ABSENSI
          </h1>

          <p className="mt-1 text-sm font-medium uppercase text-black">
            {titleDate}
          </p>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm print:min-w-0 print:text-xs">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 print:bg-[#d9eaf7] print:text-black">
              <tr>
                <th className="border border-slate-300 px-3 py-2.5 text-center font-semibold print:border-black">
                  No
                </th>

                <th className="border border-slate-300 px-3 py-2.5 font-semibold print:border-black">
                  Tanggal
                </th>

                <th className="border border-slate-300 px-3 py-2.5 font-semibold print:border-black">
                  Karyawan
                </th>

                <th className="border border-slate-300 px-3 py-2.5 font-semibold print:border-black">
                  Nomor
                </th>

                <th className="border border-slate-300 px-3 py-2.5 text-center font-semibold print:border-black">
                  Clock In
                </th>

                <th className="border border-slate-300 px-3 py-2.5 text-center font-semibold print:border-black">
                  Clock Out
                </th>

                <th className="border border-slate-300 px-3 py-2.5 font-semibold print:border-black">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record, index) => (
                <tr
                  key={`${record.employeeId}-${record.date}`}
                  className="text-slate-700 print:text-black"
                >
                  <td className="border border-slate-200 px-3 py-2.5 text-center print:border-black">
                    {index + 1}
                  </td>

                  <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 print:border-black">
                    {formatDate(record.date)}
                  </td>

                  <td className="border border-slate-200 px-3 py-2.5 font-medium text-slate-900 print:border-black print:text-black">
                    {record.name}
                  </td>

                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {record.number}
                  </td>

                  <td className="border border-slate-200 px-3 py-2.5 text-center print:border-black">
                    {formatTime(record.clockIn)}
                  </td>

                  <td className="border border-slate-200 px-3 py-2.5 text-center print:border-black">
                    {formatTime(record.clockOut)}
                  </td>

                  <td className="border border-slate-200 px-3 py-2.5 print:border-black">
                    {statusLabel(record.status)}
                  </td>
                </tr>
              ))}

              {!filteredRecords.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-slate-300 px-5 py-14 text-center text-slate-500 print:border-black print:text-black"
                  >
                    Tidak ada data absensi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PRINT FOOTER */}

        <div className="hidden pt-5 text-right text-xs text-black print:block">
          <p>
            Total data: <strong>{filteredRecords.length}</strong> absensi
          </p>
        </div>
      </div>
    </section>
  );
}
