"use client";

import { useState } from "react";
import { Power } from "lucide-react";
import { showError, showSuccess, confirmAction } from "@/components/ui/sweet-alert";

export function ToggleEmployeeActive({
  employeeId,
  employeeName,
  isActive,
  isSelf,
  subordinateCount,
  employeeData,
}: {
  employeeId: string;
  employeeName: string;
  isActive: boolean;
  isSelf: boolean;
  subordinateCount: number;
  employeeData: {
    employeeNumber: string;
    fullName: string;
    email: string;
    role: string;
    departmentId: string | null;
    positionId: string | null;
    managerId: string | null;
  };
}) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;

    if (isSelf) {
      await showError(
        "Tidak diizinkan",
        "Anda tidak dapat menonaktifkan akun sendiri.",
      );
      return;
    }

    if (isActive) {
      const subordinateWarning =
        subordinateCount > 0
          ? `\n\n⚠️ ${subordinateCount} bawahan aktif akan kehilangan reviewer aktif.`
          : "";

      const confirmed = await confirmAction({
        title: "Nonaktifkan karyawan?",
        text: `${employeeName} tidak akan bisa login setelah dinonaktifkan.${subordinateWarning}`,
        confirmButtonText: "Ya, nonaktifkan",
      });
      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: employeeId,
          ...employeeData,
          isActive: !isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengubah status karyawan.");
      }

      await showSuccess(
        isActive ? "Karyawan dinonaktifkan" : "Karyawan diaktifkan",
        `${employeeName} berhasil ${isActive ? "dinonaktifkan" : "diaktifkan"}.`,
      );

      window.location.reload();
    } catch (error) {
      await showError(
        "Gagal mengubah status",
        error instanceof Error ? error.message : "Status karyawan tidak dapat diubah.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || isSelf}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
      }`}
      title={isSelf ? "Tidak dapat mengubah status akun sendiri" : isActive ? "Nonaktifkan" : "Aktifkan"}
    >
      <Power className="size-3" />
      {loading ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
    </button>
  );
}
