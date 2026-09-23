"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Send, Upload, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError, showSuccess } from "@/components/ui/sweet-alert";

export function LeaveForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [leaveType, setLeaveType] = useState("permission");
  const [fileName, setFileName] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setFileName("");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setFileName("");

      void showError(
        "Format tidak didukung",
        "Dokumen hanya boleh berupa PDF, JPG, JPEG, atau PNG.",
      );

      return;
    }

    if (file.size > maxSize) {
      event.target.value = "";
      setFileName("");

      void showError(
        "Ukuran file terlalu besar",
        "Ukuran dokumen maksimal 5 MB.",
      );

      return;
    }

    setFileName(file.name);
  }

  function removeFile() {
    const input = document.querySelector(
      'input[name="document"]',
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    setFileName("");
  }

  async function submit(formData: FormData) {
    if (loading) return;

    setLoading(true);

    try {
      const file = formData.get("document");

      /*
       * Validasi tambahan untuk pengajuan sakit.
       */
      if (leaveType === "sick") {
        if (!(file instanceof File) || file.size === 0) {
          throw new Error(
            "Dokumen pendukung wajib dilampirkan untuk pengajuan sakit.",
          );
        }

        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            "Dokumen hanya boleh berupa PDF, JPG, JPEG, atau PNG.",
          );
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Ukuran dokumen maksimal 5 MB.");
        }
      }

      /*
       * LANGSUNG kirim FormData.
       *
       * Jangan gunakan JSON.stringify()
       * karena file tidak akan ikut terkirim.
       */
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Pengajuan tidak dapat dikirim.");
      }

      const form = document.getElementById(
        "leave-form",
      ) as HTMLFormElement | null;

      form?.reset();

      setLeaveType("permission");
      setFileName("");

      await showSuccess(
        "Pengajuan berhasil dikirim",
        "Pengajuan Anda akan ditinjau oleh atasan.",
      );

      router.refresh();
    } catch (error) {
      await showError(
        "Pengajuan gagal",
        error instanceof Error
          ? error.message
          : "Pengajuan tidak dapat dikirim.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="leave-form"
      action={submit}
      className="fade-in grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
      aria-busy={loading}
    >
      {/* JENIS PENGAJUAN */}
      <label className="text-sm font-medium text-slate-700">
        Jenis pengajuan
        <select
          name="leaveType"
          value={leaveType}
          onChange={(event) => {
            setLeaveType(event.target.value);

            /*
             * Kalau pindah dari Sakit ke jenis lain,
             * hapus file yang sebelumnya dipilih.
             */
            if (event.target.value !== "sick") {
              removeFile();
            }
          }}
          className="field mt-1"
          disabled={loading}
        >
          <option value="permission">Izin</option>
          <option value="sick">Sakit</option>
          <option value="leave">Cuti</option>
        </select>
      </label>

      {/* TANGGAL MULAI */}
      <label className="text-sm font-medium text-slate-700">
        Tanggal mulai
        <input
          required
          name="startDate"
          type="date"
          className="field mt-1"
          disabled={loading}
        />
      </label>

      {/* TANGGAL SELESAI */}
      <label className="text-sm font-medium text-slate-700">
        Tanggal selesai
        <input
          required
          name="endDate"
          type="date"
          className="field mt-1"
          disabled={loading}
        />
      </label>

      {/* ALASAN */}
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">
        Alasan
        <textarea
          required
          minLength={5}
          name="reason"
          className="field mt-1 min-h-24"
          placeholder="Jelaskan alasan pengajuan"
          disabled={loading}
        />
      </label>

      {/* DOKUMEN SAKIT */}
      {leaveType === "sick" && (
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Dokumen pendukung
            <span className="ml-1 text-rose-500">*</span>
          </label>

          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-50">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
              <Upload className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700">
                Pilih dokumen
              </p>

              <p className="text-xs text-slate-500">
                PDF, JPG, JPEG, atau PNG · Maks. 5 MB
              </p>

              {fileName && (
                <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-blue-600">
                  <FileText className="size-3.5 shrink-0" />
                  {fileName}
                </p>
              )}
            </div>

            <input
              type="file"
              name="document"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              disabled={loading}
              onChange={handleFileChange}
            />
          </label>

          {fileName && (
            <button
              type="button"
              onClick={removeFile}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
            >
              <X className="size-3.5" />
              Hapus dokumen
            </button>
          )}
        </div>
      )}

      {/* SUBMIT */}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="action-button bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />

          {loading ? <LoadingSpinner label="Mengirim..." /> : "Kirim pengajuan"}
        </button>
      </div>
    </form>
  );
}
