"use client";

import Swal from "sweetalert2";

const baseOptions = {
  position: "center" as const,
  buttonsStyling: false,
  customClass: {
    popup: "hadirin-alert",
    confirmButton: "hadirin-alert-confirm",
    cancelButton: "hadirin-alert-cancel",
  },
};

export function showSuccess(title: string, text?: string) {
  return Swal.fire({ ...baseOptions, icon: "success", title, text, confirmButtonText: "OK" });
}

export function showError(title = "Terjadi Kesalahan", text = "Silakan coba lagi.") {
  return Swal.fire({ ...baseOptions, icon: "error", title, text, confirmButtonText: "Tutup" });
}

export function showInfo(title: string, text?: string) {
  return Swal.fire({ ...baseOptions, icon: "info", title, text, confirmButtonText: "Mengerti" });
}

export async function confirmAction({ title = "Apakah Anda yakin?", text = "Tindakan ini tidak dapat dikembalikan.", confirmButtonText = "Lanjutkan" }: { title?: string; text?: string; confirmButtonText?: string } = {}) {
  const result = await Swal.fire({ ...baseOptions, icon: "warning", title, text, showCancelButton: true, confirmButtonText, cancelButtonText: "Batal", focusCancel: true });
  return result.isConfirmed;
}
