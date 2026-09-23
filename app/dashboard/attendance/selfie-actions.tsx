"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, X } from "lucide-react";

interface SelfieActionsProps {
  url: string;
  title: string;
}

export default function SelfieActions({ url, title }: SelfieActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm">
          <Eye className="size-4" />
          Lihat
        </button>
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fade-in fixed inset-0 z-[99999] isolate overflow-y-auto" style={{ zIndex: 2147483647 }} role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label="Tutup modal" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex min-h-screen items-center justify-center p-3 sm:p-4">
            <div className="scale-in flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500">Foto selfie absensi</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-950 p-2 sm:p-4">
              <img src={url} alt={title} className="block max-h-[calc(100dvh-11rem)] w-auto max-w-full rounded-lg object-contain sm:max-h-[calc(100dvh-12rem)]" />
            </div>
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md">
                <Download className="size-4" />
                Download
              </a>
            </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
