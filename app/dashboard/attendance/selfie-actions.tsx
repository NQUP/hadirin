"use client";

import { useState } from "react";
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

      {open && (
        <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="scale-in relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500">Foto selfie absensi</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900">
                <X className="size-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-4">
              <img src={url} alt={title} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain" />
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md">
                <Download className="size-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
