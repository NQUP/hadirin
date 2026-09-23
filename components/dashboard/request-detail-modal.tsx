"use client";

import { useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
    }

    setOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !open) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => {
      setOpen(false);
    };

    const handleCancel = (event: Event) => {
      event.preventDefault();
      closeModal();
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [open]);

  return (
    <>
      {/* BUTTON DETAIL */}
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:shadow-sm"
      >
        <Eye className="size-4" />
        Detail
      </button>

      {/* MODAL */}
      <dialog
        ref={dialogRef}
        className="m-0 h-screen w-screen max-h-none max-w-none overflow-hidden bg-transparent p-0 outline-none backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      >
        <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
          <div
            className="flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600">
                  Detail Pengajuan
                </p>

                <h3 className="mt-1 truncate text-lg font-bold text-slate-900">
                  {typeLabel}
                  {request.employee_name && ` · ${request.employee_name}`}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="ml-3 shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* JENIS */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FileText className="size-4" />
                    <span className="text-xs font-medium">Jenis pengajuan</span>
                  </div>

                  <p className="mt-2 font-semibold text-slate-900">
                    {typeLabel}
                  </p>
                </div>

                {/* STATUS */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">Status</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* KARYAWAN */}
                {request.employee_name && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
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
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarDays className="size-4" />
                    <span className="text-xs font-medium">Periode</span>
                  </div>

                  <p className="mt-2 font-semibold text-slate-900">
                    {request.start_date} s.d. {request.end_date}
                  </p>
                </div>
              </div>

              {/* ALASAN */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <MessageSquare className="size-4" />
                  <span className="text-xs font-medium">Alasan</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {request.reason}
                </p>
              </div>

              {/* DOKUMEN */}
              {request.document_url ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
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
                      <a
                        href={request.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <ExternalLink className="size-3.5" />
                        Buka
                      </a>

                      <a
                        href={request.document_url}
                        download={request.document_name ?? "dokumen"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-xs font-medium text-white transition hover:shadow-md"
                      >
                        <Download className="size-3.5" />
                        Download
                      </a>
                    </div>
                  </div>

                  {/* IMAGE */}
                  {request.document_type?.startsWith("image/") && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={request.document_url}
                        alt={request.document_name ?? "Dokumen pendukung"}
                        className="mx-auto max-h-[45vh] w-full object-contain"
                      />
                    </div>
                  )}

                  {/* PDF */}
                  {request.document_type === "application/pdf" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      <iframe
                        src={request.document_url}
                        title="Dokumen pendukung"
                        className="h-[45vh] w-full"
                      />
                    </div>
                  )}

                  {/* FILE LAIN */}
                  {!request.document_type?.startsWith("image/") &&
                    request.document_type !== "application/pdf" && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                        Dokumen tersedia. Gunakan tombol <strong>Buka</strong>{" "}
                        untuk melihat dokumen.
                      </div>
                    )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-700">
                    Dokumen pendukung tidak tersedia.
                  </p>

                  <p className="mt-1 text-xs text-amber-600">
                    URL dokumen tidak berhasil diterima oleh komponen detail.
                  </p>
                </div>
              )}

              {/* CATATAN */}
              {request.note && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Catatan atasan
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {request.note}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
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
      </dialog>
    </>
  );
}
