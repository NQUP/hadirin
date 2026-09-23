"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError } from "@/components/ui/sweet-alert";
import { createClient } from "@/utils/supabase/client";

const NORMAL_SESSION = 8 * 60 * 60 * 1000; // 8 jam
const REMEMBER_SESSION = 7 * 24 * 60 * 60 * 1000; // 7 hari

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    if (loading) return;

    setLoading(true);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "true";

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await showError("Login gagal", "Email atau kata sandi tidak valid.");
        return;
      }

      /*
       * Tentukan durasi session aplikasi.
       *
       * Dicentang:
       * 7 hari
       *
       * Tidak dicentang:
       * 8 jam
       */
      const duration = remember ? REMEMBER_SESSION : NORMAL_SESSION;

      const loginAt = Date.now();

      /*
       * Format:
       * loginAt:duration
       *
       * Contoh:
       * 1727050000000:28800000
       */
      document.cookie = [
        `hadirin_login_at=${loginAt}:${duration}`,
        "path=/",
        "SameSite=Lax",
      ].join("; ");

      router.replace(search.get("next") || "/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);

      await showError("Login gagal", "Terjadi kesalahan saat melakukan login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-600 font-bold">
            H
          </div>

          <span className="text-lg font-semibold">Hadirin</span>
        </div>

        <div className="slide-up">
          <p className="text-sm font-medium text-blue-300">
            Sistem Absensi Karyawan
          </p>

          <h1 className="mt-4 max-w-lg text-5xl font-semibold leading-tight">
            Kehadiran tim, lebih sederhana dan tepercaya.
          </h1>

          <p className="mt-6 max-w-md leading-7 text-slate-400">
            Kelola absensi, pengajuan, dan laporan karyawan dari satu dashboard
            aman.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Dilindungi Supabase Auth dan kontrol akses berbasis peran.
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6">
        <div className="fade-in w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-600 font-bold text-white">
                H
              </div>

              <span className="text-lg font-semibold">Hadirin</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-7">
              <div className="mb-3 grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="size-6" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Masuk ke akun Anda
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Gunakan email dan kata sandi perusahaan.
              </p>
            </div>

            <form action={submit} className="space-y-5" aria-busy={loading}>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="field mt-1.5"
                  placeholder="nama@perusahaan.com"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Kata sandi
                <div className="relative mt-1.5">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="field pr-11"
                    placeholder="Masukkan kata sandi"
                  />

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-400"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="remember"
                  value="true"
                  defaultChecked
                  disabled={loading}
                  className="size-4 rounded border-slate-300"
                />
                Ingat sesi saya
              </label>

              <button
                disabled={loading}
                className="action-button w-full justify-center bg-blue-600 py-3 text-white hover:bg-blue-700"
              >
                {loading ? (
                  <LoadingSpinner label="Memproses login..." />
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
