"use client";

import { useState } from "react";
import {
  X,
  Eye,
  FileText,
  CalendarDays,
  User,
  MessageSquare,
  ExternalLink,
  Download,
} from "lucide-react";

type RequestDetail = {
  id: string;
  leave_type: "permission" | "sick" | "leave";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  note?: string | null;
  document_url?: string | null;
  document_name?: string | null;
  document_type?: string | null;
  employee_name?: string | null;
};

export function RequestDetailModal({ request }: { request: RequestDetail }) {
  const [open, setOpen] = useState(false);

  const typeLabel =
    request.leave_type === "leave"
      ? "Cuti"
      : request.leave_type === "sick"
        ? "Sakit"
        : "Izin";

  const statusLabel =
    request.status === "pending"
      ? "Menunggu"
      : request.status === "approved"
        ? "Disetujui"
        : "Ditolak";

  const statusClass =
    request.status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : request.status === "rejected"
        ? "bg-rose-50 text-rose-700"
        : "bg-blue-50 text-blue-700";

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      {/* TOMBOL DETAIL */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
      >
        <Eye className="size-4" />
        Detail
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* OVERLAY */}
          <button
            type="button"
            aria-label="Tutup modal"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          {/* MODAL CONTENT */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600">
                  Detail Pengajuan
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {typeLabel}
                  {request.employee_name && ` · ${request.employee_name}`}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="min-h-0 overflow-y-auto p-5">
              {/* INFORMASI UTAMA */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* JENIS */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FileText className="size-4" />

                    <span className="text-xs font-medium">Jenis pengajuan</span>
                  </div>

                  <p className="mt-2 font-semibold text-slate-900">
                    {typeLabel}
                  </p>
                </div>

                {/* STATUS */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Status</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* KARYAWAN */}
                {request.employee_name && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="size-4" />

                      <span className="text-xs font-medium">Karyawan</span>
                    </div>

                    <p className="mt-2 font-semibold text-slate-900">
                      {request.employee_name}
                    </p>
                  </div>
                )}

                {/* PERIODE */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarDays className="size-4" />

                    <span className="text-xs font-medium">Periode</span>
                  </div>

                  <p className="mt-2 font-semibold text-slate-900">
                    {request.start_date}
                  </p>

                  <p className="text-sm text-slate-500">
                    s.d. {request.end_date}
                  </p>
                </div>
              </div>

              {/* ALASAN */}
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <MessageSquare className="size-4" />

                  <span className="text-xs font-medium">Alasan pengajuan</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {request.reason}
                </p>
              </div>

              {/* ================================================== */}
              {/* DOKUMEN PENDUKUNG */}
              {/* ================================================== */}

              {request.document_url ? (
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  {/* HEADER DOKUMEN */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        Dokumen pendukung
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {request.document_name ?? "Dokumen pendukung"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {/* BUKA TAB BARU */}
                      <a
                        href={request.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <ExternalLink className="size-3.5" />
                        Buka
                      </a>

                      {/* DOWNLOAD */}
                      <a
                        href={request.document_url}
                        download={request.document_name ?? "dokumen"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                      >
                        <Download className="size-3.5" />
                        Download
                      </a>
                    </div>
                  </div>

                  {/* PREVIEW GAMBAR */}
                  {request.document_type?.startsWith("image/") && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={request.document_url}
                        alt={request.document_name ?? "Dokumen pendukung"}
                        className="max-h-[500px] w-full object-contain"
                      />
                    </div>
                  )}

                  {/* PREVIEW PDF */}
                  {request.document_type === "application/pdf" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      <iframe
                        src={request.document_url}
                        title="Dokumen pendukung"
                        className="h-[500px] w-full"
                      />
                    </div>
                  )}

                  {/* FALLBACK FORMAT */}
                  {!request.document_type?.startsWith("image/") &&
                    request.document_type !== "application/pdf" && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                        Dokumen tersedia. Gunakan tombol <strong>Buka</strong>{" "}
                        untuk melihat dokumen.
                      </div>
                    )}
                </div>
              ) : (
                /* TIDAK ADA URL */
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-700">
                    Dokumen pendukung tidak tersedia.
                  </p>

                  <p className="mt-1 text-xs text-amber-600">
                    URL dokumen tidak berhasil diterima oleh komponen detail.
                  </p>
                </div>
              )}

              {/* CATATAN ATASAN */}
              {request.note && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Catatan atasan
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {request.note}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
