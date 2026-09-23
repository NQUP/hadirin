"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { showError, showSuccess } from "@/components/ui/sweet-alert";

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

type FormData = {
  employeeNumber: string;
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "manager";
  departmentId: string;
  positionId: string;
  managerId: string;
  isActive: boolean;
};

const initialForm: FormData = {
  employeeNumber: "",
  fullName: "",
  email: "",
  password: "",
  role: "employee",
  departmentId: "",
  positionId: "",
  managerId: "",
  isActive: true,
};

function getEmployeePrefix(role: FormData["role"]) {
  switch (role) {
    case "admin":
      return "ADM";
    case "manager":
      return "MGR";
    default:
      return "EMP";
  }
}

function generateEmployeeNumber(role: FormData["role"], employees: Employee[]) {
  const prefix = getEmployeePrefix(role);

  const numbers = employees
    .map((employee) => employee.employee_number ?? "")
    .filter((number) => number.toUpperCase().startsWith(`${prefix}-`))
    .map((number) => {
      const match = number.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
      return match ? Number(match[1]) : 0;
    })
    .filter((number) => Number.isFinite(number));

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

export function AddEmployeeModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<FormData>(initialForm);
  const [employees, setEmployees] = useState<Employee[]>([]);

  /*
   * Ambil data karyawan ketika modal dibuka.
   * Data ini digunakan untuk:
   * - Generate nomor karyawan
   * - Pilihan department
   * - Pilihan posisi
   * - Pilihan manager
   */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadEmployees() {
      try {
        setLoadingEmployees(true);

        const response = await fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Gagal mengambil data karyawan.");
        }

        if (!cancelled) {
          setEmployees(data.employees ?? []);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setEmployees([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingEmployees(false);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
   * Generate nomor otomatis berdasarkan role.
   *
   * employee -> EMP-xxx
   * manager  -> MGR-xxx
   * admin    -> ADM-xxx
   */
  const generatedEmployeeNumber = useMemo(() => {
    return generateEmployeeNumber(form.role, employees);
  }, [form.role, employees]);

  /*
   * Department unik.
   */
  const departments = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();

    employees.forEach((employee) => {
      if (employee.department_id && employee.departments?.name) {
        map.set(employee.department_id, {
          id: employee.department_id,
          name: employee.departments.name,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [employees]);

  /*
   * Position unik.
   */
  const positions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        title: string;
      }
    >();

    employees.forEach((employee) => {
      if (employee.position_id && employee.positions?.title) {
        map.set(employee.position_id, {
          id: employee.position_id,
          title: employee.positions.title,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [employees]);

  /*
   * Manager hanya menampilkan:
   * - Aktif
   * - Role Manager/Admin
   */
  const managers = useMemo(() => {
    return employees
      .filter(
        (employee) =>
          employee.is_active &&
          ["manager", "admin"].includes(String(employee.role).toLowerCase()),
      )
      .sort((a, b) =>
        String(a.full_name ?? "").localeCompare(String(b.full_name ?? "")),
      );
  }, [employees]);

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openModal() {
    setForm(initialForm);
    setShowPassword(false);
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setOpen(false);
    setShowPassword(false);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    /*
     * Hanya 3 field yang wajib:
     * - Nama
     * - Email
     * - Password
     */
    if (!form.fullName.trim()) {
      await showError("Nama belum diisi", "Nama lengkap karyawan wajib diisi.");
      return;
    }

    if (!form.email.trim()) {
      await showError("Email belum diisi", "Email karyawan wajib diisi.");
      return;
    }

    if (!form.password.trim()) {
      await showError("Password belum diisi", "Password awal wajib diisi.");
      return;
    }

    if (form.password.length < 6) {
      await showError("Password tidak valid", "Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeNumber: generatedEmployeeNumber,
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,

          role: form.role,

          departmentId: form.departmentId || null,

          positionId: form.positionId || null,

          managerId: form.managerId || null,

          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal menambahkan karyawan.");
      }

      await showSuccess(
        "Karyawan berhasil ditambahkan",
        `${form.fullName} terdaftar dengan nomor ${generatedEmployeeNumber}.`,
      );

      setOpen(false);
      setShowPassword(false);
      setForm(initialForm);

      /*
       * Refresh halaman agar tabel langsung
       * menampilkan karyawan baru.
       */
      window.location.reload();
    } catch (error) {
      console.error(error);

      await showError(
        "Gagal menambahkan karyawan",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan karyawan.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* =========================================
          BUTTON TAMBAH
      ========================================== */}
      <button
        type="button"
        onClick={openModal}
        className="action-button shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800"
      >
        <Plus className="size-4" />
        Tambah Karyawan
      </button>

      {/* =========================================
          MODAL
      ========================================== */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            style={{ zIndex: 2147483647 }}
            role="dialog"
            aria-modal="true"
            aria-label="Tambah karyawan"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              className="scale-in relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* =========================================
                  HEADER
              ========================================== */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <User className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      Tambah Karyawan
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Buat akun karyawan baru
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

              {/* =========================================
                  FORM
              ========================================== */}
              <form
                onSubmit={handleSubmit}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-6 p-5 sm:p-6">
                  {/* =========================================
                      INFORMASI AKUN
                  ========================================== */}
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
                          Data utama untuk login karyawan
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* NOMOR KARYAWAN */}
                      <div>
                        <label
                          htmlFor="employee-number"
                          className="text-xs font-semibold text-slate-600"
                        >
                          Nomor Karyawan
                        </label>

                        <div className="relative mt-1.5">
                          <input
                            id="employee-number"
                            type="text"
                            value={
                              loadingEmployees
                                ? "Membuat nomor..."
                                : generatedEmployeeNumber
                            }
                            disabled
                            readOnly
                            className="field cursor-not-allowed bg-slate-100 pr-20 font-semibold text-slate-600"
                          />

                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            Otomatis
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Nomor dibuat otomatis berdasarkan role.
                        </p>
                      </div>

                      {/* NAMA LENGKAP */}
                      <div>
                        <label
                          htmlFor="full-name"
                          className="text-xs font-semibold text-slate-600"
                        >
                          Nama Lengkap
                          <span className="ml-1 text-rose-500">*</span>
                        </label>

                        <input
                          id="full-name"
                          type="text"
                          value={form.fullName}
                          onChange={(event) =>
                            updateField("fullName", event.target.value)
                          }
                          placeholder="Contoh: Budi Santoso"
                          disabled={loading}
                          required
                          className="field mt-1.5"
                          autoComplete="name"
                        />
                      </div>

                      {/* EMAIL */}
                      <div>
                        <label
                          htmlFor="employee-email"
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <Mail className="size-3.5" />
                          Email
                          <span className="text-rose-500">*</span>
                        </label>

                        <input
                          id="employee-email"
                          type="email"
                          value={form.email}
                          onChange={(event) =>
                            updateField("email", event.target.value)
                          }
                          placeholder="nama@perusahaan.com"
                          disabled={loading}
                          required
                          className="field mt-1.5"
                          autoComplete="email"
                        />
                      </div>

                      {/* PASSWORD */}
                      <div>
                        <label
                          htmlFor="employee-password"
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <KeyRound className="size-3.5" />
                          Password Awal
                          <span className="text-rose-500">*</span>
                        </label>

                        <div className="relative mt-1.5">
                          <input
                            id="employee-password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(event) =>
                              updateField("password", event.target.value)
                            }
                            placeholder="Minimal 6 karakter"
                            disabled={loading}
                            required
                            minLength={6}
                            className="field pr-11"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            disabled={loading}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
                            aria-label={
                              showPassword
                                ? "Sembunyikan password"
                                : "Tampilkan password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="size-5" />
                            ) : (
                              <Eye className="size-5" />
                            )}
                          </button>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Minimal 6 karakter.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* =========================================
                      DATA PEKERJAAN
                  ========================================== */}
                  <section className="border-t border-slate-100 pt-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                        <BriefcaseBusiness className="size-4" />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Data pekerjaan
                        </h4>

                        <p className="text-xs text-slate-400">
                          Bisa dilengkapi setelah akun dibuat
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                      {/* ROLE */}
                      <div className="min-w-0">
                        <label
                          htmlFor="employee-role"
                          className="flex h-5 items-center text-xs font-semibold text-slate-600"
                        >
                          Role
                        </label>

                        <select
                          id="employee-role"
                          value={form.role}
                          onChange={(event) =>
                            updateField(
                              "role",
                              event.target.value as FormData["role"],
                            )
                          }
                          disabled={loading}
                          className="field mt-1.5 w-full"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {/* DEPARTMENT */}
                      <div className="min-w-0">
                        <label
                          htmlFor="employee-department"
                          className="flex h-5 items-center text-xs font-semibold text-slate-600"
                        >
                          Department
                        </label>

                        <select
                          id="employee-department"
                          value={form.departmentId}
                          onChange={(event) =>
                            updateField("departmentId", event.target.value)
                          }
                          disabled={loading || loadingEmployees}
                          className="field mt-1.5 w-full"
                        >
                          <option value="">Tidak ditentukan</option>

                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* POSISI */}
                      <div className="min-w-0">
                        <label
                          htmlFor="employee-position"
                          className="flex h-5 items-center text-xs font-semibold text-slate-600"
                        >
                          Posisi
                        </label>

                        <select
                          id="employee-position"
                          value={form.positionId}
                          onChange={(event) =>
                            updateField("positionId", event.target.value)
                          }
                          disabled={loading || loadingEmployees}
                          className="field mt-1.5 w-full"
                        >
                          <option value="">Tidak ditentukan</option>

                          {positions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* MANAGER */}
                      <div className="min-w-0">
                        <label
                          htmlFor="employee-manager"
                          className="flex h-5 items-center gap-1.5 text-xs font-semibold text-slate-600"
                        >
                          <Users className="size-3.5 shrink-0" />
                          <span>Manager</span>
                        </label>

                        <select
                          id="employee-manager"
                          value={form.managerId}
                          onChange={(event) =>
                            updateField("managerId", event.target.value)
                          }
                          disabled={loading || loadingEmployees}
                          className="field mt-1.5 w-full"
                        >
                          <option value="">Tidak ditentukan</option>

                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* =========================================
                      STATUS
                  ========================================== */}
                  <section className="border-t border-slate-100 pt-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="flex cursor-pointer items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Status karyawan
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Jika aktif, karyawan dapat langsung menggunakan akun
                            untuk login.
                          </p>
                        </div>

                        <div className="relative shrink-0">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) =>
                              updateField("isActive", event.target.checked)
                            }
                            disabled={loading}
                            className="peer sr-only"
                          />

                          <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />

                          <div className="absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                        </div>
                      </label>
                    </div>
                  </section>
                </div>

                {/* =========================================
                    FOOTER
                ========================================== */}
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
                      disabled={loading || loadingEmployees}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" />
                          Tambah Karyawan
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
