"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Loader2,
  Pencil,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { showError, showSuccess, confirmAction } from "@/components/ui/sweet-alert";

type Employee = {
  id: string;
  employee_number: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  department_id: string | null;
  position_id: string | null;
  manager_id: string | null;
  is_active: boolean;

  departments?: {
    name: string;
  } | null;

  positions?: {
    title: string;
  } | null;
};

type EditFormData = {
  employeeNumber: string;
  fullName: string;
  email: string;
  role: "admin" | "employee" | "manager";
  departmentId: string;
  positionId: string;
  managerId: string;
  isActive: boolean;
};

export function EditEmployeeModal({
  employee,
  currentAdminId,
  allEmployees,
  subordinateCount,
}: {
  employee: Employee;
  currentAdminId: string;
  allEmployees: Employee[];
  subordinateCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<EditFormData>(() => formFromEmployee(employee));
  const [departmentsRef, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [positionsRef, setPositions] = useState<Array<{ id: string; title: string }>>([]);

  const isSelf = employee.id === currentAdminId;

  function formFromEmployee(emp: Employee): EditFormData {
    return {
      employeeNumber: emp.employee_number ?? "",
      fullName: emp.full_name ?? "",
      email: emp.email ?? "",
      role: (emp.role as EditFormData["role"]) ?? "employee",
      departmentId: emp.department_id ?? "",
      positionId: emp.position_id ?? "",
      managerId: emp.manager_id ?? "",
      isActive: emp.is_active,
    };
  }

  /*
   * Department unik.
   */
  const departments = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    // Dari reference data di DB
    departmentsRef.forEach((dept) => {
      map.set(dept.id, {
        id: dept.id,
        name: dept.name,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [departmentsRef]);

  /*
   * Position unik.
   */
  const positions = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();

    // Dari reference data di DB
    positionsRef.forEach((pos) => {
      map.set(pos.id, {
        id: pos.id,
        title: pos.title,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [positionsRef]);

  /*
   * Manager hanya menampilkan aktif + role manager/admin, kecuali diri sendiri.
   */
  const managers = useMemo(() => {
    return allEmployees.filter(
      (e) =>
        e.is_active &&
        (e.role === "manager" || e.role === "admin") &&
        e.id !== employee.id,
    );
  }, [allEmployees, employee.id]);

  function updateField<K extends keyof EditFormData>(
    key: K,
    value: EditFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openModal() {
    setForm(formFromEmployee(employee));
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  // Load reference data (departments, positions) from API
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadRefData() {
      try {
        const response = await fetch("/api/employees", { method: "GET", cache: "no-store" });
        const data = await response.json();
        if (!cancelled && response.ok) {
          if (data.departments) setDepartments(data.departments);
          if (data.positions) setPositions(data.positions);
        }
      } catch {
        // Ref data gagal dimuat; dropdown tetap tampil kosong
      }
    }

    loadRefData();
    return () => { cancelled = true; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, loading]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!form.fullName.trim()) {
      await showError("Nama belum diisi", "Nama lengkap karyawan wajib diisi.");
      return;
    }

    if (!form.email.trim()) {
      await showError("Email belum diisi", "Email karyawan wajib diisi.");
      return;
    }

    // Cegah admin menonaktifkan atau menurunkan role diri sendiri
    if (isSelf) {
      if (!form.isActive) {
        await showError(
          "Tidak diizinkan",
          "Anda tidak dapat menonaktifkan akun Anda sendiri.",
        );
        return;
      }
      if (form.role !== "admin") {
        await showError(
          "Tidak diizinkan",
          "Anda tidak dapat menurunkan role akun Anda sendiri.",
        );
        return;
      }
    }

    // Konfirmasi nonaktif
    if (!form.isActive && employee.is_active) {
      const subordinateWarning =
        subordinateCount > 0
          ? `\n\n⚠️ ${subordinateCount} bawahan aktif akan kehilangan reviewer aktif.`
          : "";

      const confirmed = await confirmAction({
        title: "Nonaktifkan karyawan?",
        text: `${form.fullName} tidak akan bisa login setelah dinonaktifkan.${subordinateWarning}`,
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
          id: employee.id,
          employeeNumber: form.employeeNumber,
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          departmentId: form.departmentId || null,
          positionId: form.positionId || null,
          managerId: form.managerId || null,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal memperbarui karyawan.");
      }

      await showSuccess(
        "Karyawan diperbarui",
        `Data ${form.fullName} berhasil disimpan.`,
      );

      setOpen(false);

      // Refresh halaman supaya data terbaru muncul
      window.location.reload();
    } catch (error) {
      await showError(
        "Gagal menyimpan",
        error instanceof Error ? error.message : "Karyawan tidak dapat diperbarui.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
        title="Edit karyawan"
      >
        <Pencil className="size-3" />
        Edit
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* HEADER */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20">
                    <Pencil className="size-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Edit Karyawan
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {employee.employee_number} &middot; {employee.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Tutup"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-6 p-5 sm:p-6">
                  {/* INFORMASI AKUN */}
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <ShieldCheck className="size-4" />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Informasi akun
                        </h4>

                        <p className="text-xs text-slate-400">
                          Data utama karyawan
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* NOMOR KARYAWAN */}
                      <div>
                        <label
                          htmlFor={`edit-emp-number-${employee.id}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Nomor Karyawan
                        </label>

                        <input
                          id={`edit-emp-number-${employee.id}`}
                          type="text"
                          value={form.employeeNumber}
                          disabled
                          readOnly
                          className="field mt-1.5 cursor-not-allowed bg-slate-100 font-semibold text-slate-600"
                        />

                        <p className="mt-1 text-[11px] text-slate-400">
                          Nomor karyawan tidak dapat diubah.
                        </p>
                      </div>

                      {/* NAMA LENGKAP */}
                      <div>
                        <label
                          htmlFor={`edit-emp-name-${employee.id}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Nama Lengkap
                          <span className="ml-1 text-rose-500">*</span>
                        </label>

                        <input
                          id={`edit-emp-name-${employee.id}`}
                          type="text"
                          value={form.fullName}
                          onChange={(e) => updateField("fullName", e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          disabled={loading}
                          required
                          className="field mt-1.5"
                          autoComplete="name"
                        />
                      </div>

                      {/* EMAIL */}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`edit-emp-email-${employee.id}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Email
                          <span className="ml-1 text-rose-500">*</span>
                        </label>

                        <input
                          id={`edit-emp-email-${employee.id}`}
                          type="email"
                          value={form.email}
                          disabled
                          readOnly
                          className="field mt-1.5 cursor-not-allowed bg-slate-100 text-slate-600"
                        />

                        <p className="mt-1 text-[11px] text-slate-400">
                          Email tidak dapat diubah dari halaman ini.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* DETAIL ORGANISASI */}
                  <section className="border-t border-slate-100 pt-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                        <BriefcaseBusiness className="size-4" />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Detail organisasi
                        </h4>

                        <p className="text-xs text-slate-400">
                          Role, departemen, jabatan, dan atasan
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* ROLE */}
                      <div>
                        <label
                          htmlFor={`edit-emp-role-${employee.id}`}
                          className="flex h-5 items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <ShieldCheck className="size-3.5 shrink-0" />
                          <span>Role</span>
                        </label>

                        <select
                          id={`edit-emp-role-${employee.id}`}
                          value={form.role}
                          onChange={(e) =>
                            updateField(
                              "role",
                              e.target.value as EditFormData["role"],
                            )
                          }
                          disabled={loading || isSelf}
                          className="field mt-1.5 w-full"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>

                        {isSelf && (
                          <p className="mt-1 text-[11px] text-amber-600">
                            Tidak bisa mengubah role akun sendiri.
                          </p>
                        )}
                      </div>

                      {/* DEPARTMENT */}
                      <div>
                        <label
                          htmlFor={`edit-emp-dept-${employee.id}`}
                          className="flex h-5 items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <BriefcaseBusiness className="size-3.5 shrink-0" />
                          <span>Departemen</span>
                        </label>

                        <select
                          id={`edit-emp-dept-${employee.id}`}
                          value={form.departmentId}
                          onChange={(e) => updateField("departmentId", e.target.value)}
                          disabled={loading}
                          className="field mt-1.5 w-full"
                        >
                          <option value="">Tidak ditentukan</option>

                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* JABATAN */}
                      <div>
                        <label
                          htmlFor={`edit-emp-pos-${employee.id}`}
                          className="flex h-5 items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <User className="size-3.5 shrink-0" />
                          <span>Jabatan</span>
                        </label>

                        <select
                          id={`edit-emp-pos-${employee.id}`}
                          value={form.positionId}
                          onChange={(e) => updateField("positionId", e.target.value)}
                          disabled={loading}
                          className="field mt-1.5 w-full"
                        >
                          <option value="">Tidak ditentukan</option>

                          {positions.map((pos) => (
                            <option key={pos.id} value={pos.id}>
                              {pos.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* MANAGER */}
                      <div>
                        <label
                          htmlFor={`edit-emp-mgr-${employee.id}`}
                          className="flex h-5 items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <Users className="size-3.5 shrink-0" />
                          <span>Manager</span>
                        </label>

                        <select
                          id={`edit-emp-mgr-${employee.id}`}
                          value={form.managerId}
                          onChange={(e) => updateField("managerId", e.target.value)}
                          disabled={loading}
                          className="field mt-1.5 w-full"
                        >
                          <option value="">Tidak ditentukan</option>

                          {managers.map((mgr) => (
                            <option key={mgr.id} value={mgr.id}>
                              {mgr.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* STATUS */}
                  <section className="border-t border-slate-100 pt-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="flex cursor-pointer items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Status karyawan
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {isSelf
                              ? "Anda tidak dapat menonaktifkan akun sendiri."
                              : "Jika nonaktif, karyawan tidak bisa login."}
                          </p>
                        </div>

                        <div className="relative shrink-0">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                              updateField("isActive", e.target.checked)
                            }
                            disabled={loading || isSelf}
                            className="peer sr-only"
                          />

                          <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />

                          <div className="absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                        </div>
                      </label>
                    </div>
                  </section>
                </div>

                {/* FOOTER */}
                <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
                  <p className="hidden text-xs text-slate-400 sm:block">
                    <span className="text-rose-500">*</span> Wajib diisi
                  </p>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Pencil className="size-4" />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
