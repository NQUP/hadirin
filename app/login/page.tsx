"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Fingerprint, Sparkles } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError } from "@/components/ui/sweet-alert";
import { createClient } from "@/utils/supabase/client";

const NORMAL_SESSION = 8 * 60 * 60 * 1000;
const REMEMBER_SESSION = 7 * 24 * 60 * 60 * 1000;

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
      const duration = remember ? REMEMBER_SESSION : NORMAL_SESSION;
      const loginAt = Date.now();
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
    <main className="grid min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-white lg:grid-cols-2 lg:bg-transparent">
      <section className="animated-gradient-bg relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="floating-dot left-[15%] top-[20%] size-32 opacity-40"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="floating-dot right-[10%] top-[60%] size-24 opacity-30"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="floating-dot left-[60%] bottom-[15%] size-20 opacity-25"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="floating-dot left-[35%] top-[45%] size-16 opacity-20"
          style={{ animationDelay: "1s" }}
        />

        <div className="slide-down relative z-10 flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-xl shadow-sm">
            <img
              src="/images/hadirin.png"
              alt="Hadirin"
              className="size-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">Hadirin</span>
        </div>

        <div className="slide-up relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Sistem Absensi Karyawan
          </div>
          <h1 className="max-w-lg text-5xl font-bold leading-[1.15] tracking-tight">
            Kehadiran tim, lebih{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              sederhana
            </span>{" "}
            dan tepercaya.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Kelola absensi, pengajuan, dan laporan karyawan dari satu dashboard
            aman.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["GPS Geofence", "Selfie Absensi", "Real-time"].map(
              (feature, i) => (
                <span
                  key={feature}
                  className={`slide-up stagger-${i + 3} rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm`}
                >
                  {feature}
                </span>
              ),
            )}
          </div>
        </div>

        <p className="fade-in stagger-6 relative z-10 flex items-center gap-2 text-sm text-slate-500">
          <Fingerprint className="size-4" />
          Dilindungi Supabase Auth dan kontrol akses berbasis peran.
        </p>
      </section>

      <section className="flex items-start justify-center bg-transparent px-4 pb-8 pt-8 sm:p-6 lg:items-center">
        <div className="scale-in w-full max-w-md">
          <div className="mobile-safe-top mb-6 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-md shadow-blue-100">
                <img src="/images/hadirin.png" alt="Hadirin" className="size-full object-contain" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900">Hadirin</p>
                <p className="text-xs text-slate-400">Sistem Absensi</p>
              </div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Sparkles className="size-3.5" />
              Sistem Absensi Karyawan
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-blue-100/70 sm:p-7">
            <div className="mb-7">
              <div className="bounce-in mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-sm">
                <ShieldCheck className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Masuk ke akun Anda
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Gunakan email dan kata sandi perusahaan.
              </p>
            </div>

            <form action={submit} className="space-y-5" aria-busy={loading}>
              <label className="slide-up stagger-1 block text-sm font-medium text-slate-700">
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

              <label className="slide-up stagger-2 block text-sm font-medium text-slate-700">
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
                    className="absolute inset-y-0 right-0 px-3 text-slate-400 transition-colors hover:text-slate-600"
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

              <label className="slide-up stagger-3 flex items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="remember"
                  value="true"
                  defaultChecked
                  disabled={loading}
                  className="size-4 rounded border-slate-300 accent-blue-600"
                />
                Ingat sesi saya
              </label>

              <button
                disabled={loading}
                className="slide-up stagger-4 action-button w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (
                  <LoadingSpinner label="Memproses login..." />
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>

          <p className="fade-in stagger-5 mt-5 text-center text-xs text-slate-400">
            Hubungi administrator jika Anda lupa kata sandi.
          </p>
        </div>
      </section>
    </main>
  );
}
