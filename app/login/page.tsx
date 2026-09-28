"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Fingerprint,
  Sparkles,
  MapPinCheck,
  Camera,
  Activity,
} from "lucide-react";
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        await showError("Login gagal", "Email atau kata sandi tidak valid.");
        return;
      }
      const duration = remember ? REMEMBER_SESSION : NORMAL_SESSION;
      const loginAt = Date.now();
      document.cookie = [`hadirin_login_at=${loginAt}:${duration}`, "path=/", "SameSite=Lax"].join("; ");
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
    <main className="grid min-h-screen overflow-hidden bg-[#f5f7fb] lg:grid-cols-2 lg:bg-transparent">
      <section className="animated-gradient-bg relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.02),rgba(0,0,0,0.18))]" />
        <div className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-1/4 size-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="floating-dot left-[12%] top-[18%] size-32 bg-indigo-300/10 opacity-50" style={{ animationDelay: "0s" }} />
        <div className="floating-dot right-[10%] top-[58%] size-24 bg-cyan-300/10 opacity-40" style={{ animationDelay: "2s" }} />
        <div className="floating-dot bottom-[14%] left-[58%] size-20 bg-white/10 opacity-30" style={{ animationDelay: "4s" }} />
        <div className="floating-dot left-[36%] top-[42%] size-16 bg-indigo-300/10 opacity-30" style={{ animationDelay: "1s" }} />
        <div className="slide-down relative z-10 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/15 backdrop-blur-md">
            <Image src="/images/hadirin.png" alt="Hadirin" width={44} height={44} className="size-full object-contain" />
          </div>
          <div><p className="text-lg font-bold tracking-tight">Hadirin</p><p className="text-xs font-medium text-white/55">Employee Attendance System</p></div>
        </div>
        <div className="slide-up relative z-10 max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md"><Sparkles className="size-3.5 text-cyan-300" />Sistem Absensi Karyawan</div>
          <h1 className="max-w-lg text-5xl font-bold leading-[1.12] tracking-tight">Kehadiran tim,<br />lebih <span className="text-cyan-300">sederhana.</span></h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/70">Kelola absensi, pengajuan, monitoring, dan laporan karyawan dalam satu platform yang aman dan terintegrasi.</p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-2">
            <div className="slide-up stagger-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md"><MapPinCheck className="mb-2 size-4 text-cyan-300" /><p className="text-xs font-semibold">GPS</p><p className="mt-0.5 text-[10px] text-white/45">Geofence</p></div>
            <div className="slide-up stagger-4 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md"><Camera className="mb-2 size-4 text-cyan-300" /><p className="text-xs font-semibold">Selfie</p><p className="mt-0.5 text-[10px] text-white/45">Verifikasi</p></div>
            <div className="slide-up stagger-5 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md"><Activity className="mb-2 size-4 text-cyan-300" /><p className="text-xs font-semibold">Real-time</p><p className="mt-0.5 text-[10px] text-white/45">Monitoring</p></div>
          </div>
        </div>
        <div className="fade-in stagger-6 relative z-10 flex items-center gap-2.5 text-xs font-medium text-white/50"><div className="grid size-7 place-items-center rounded-lg bg-white/10"><Fingerprint className="size-3.5 text-cyan-300" /></div><span>Protected by Supabase Auth & role-based access</span></div>
      </section>
      <section className="flex min-h-screen items-start justify-center px-4 pb-8 pt-8 sm:px-6 lg:items-center">
        <div className="scale-in w-full max-w-md">
          <div className="mobile-safe-top mb-6 lg:hidden">
            <div className="flex items-center gap-3"><div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/70 ring-1 ring-slate-100"><Image src="/images/hadirin.png" alt="Hadirin" width={48} height={48} className="size-full object-contain" /></div><div><p className="text-lg font-bold tracking-tight text-slate-900">Hadirin</p><p className="text-xs font-medium text-slate-400">Employee Attendance System</p></div></div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"><Sparkles className="size-3.5" />Sistem Absensi Karyawan</div>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-8">
            <div className="mb-7 text-center"><div className="bounce-in mx-auto mb-5 grid size-13 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><ShieldCheck className="size-6" /></div><h2 className="text-2xl font-bold tracking-tight text-slate-900">Selamat datang</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Masuk menggunakan akun perusahaan Anda untuk melanjutkan.</p></div>
            <form action={submit} className="space-y-5" aria-busy={loading}>
              <label className="slide-up stagger-1 block text-sm font-semibold text-slate-700">Email<input name="email" type="email" required autoComplete="email" disabled={loading} className="field mt-2" placeholder="nama@perusahaan.com" /></label>
              <label className="slide-up stagger-2 block text-sm font-semibold text-slate-700">Kata sandi<div className="relative mt-2"><input name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" disabled={loading} className="field pr-11" placeholder="Masukkan kata sandi" /><button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition-colors hover:text-indigo-600" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></label>
              <label className="slide-up stagger-3 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" name="remember" value="true" defaultChecked disabled={loading} className="size-4 rounded border-slate-300 accent-indigo-600" /><span>Ingat sesi saya</span></label>
              <button type="submit" disabled={loading} className="slide-up stagger-4 action-button w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3.5 text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-700 hover:to-indigo-800">{loading ? <LoadingSpinner label="Memproses login..." /> : <>Masuk ke Hadirin</>}</button>
            </form>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><ShieldCheck className="size-4" /></div><div><p className="text-xs font-semibold text-slate-700">Login aman</p><p className="mt-0.5 text-[11px] text-slate-400">Data akun dilindungi dengan autentikasi terenkripsi.</p></div></div>
          </div>
          <p className="fade-in stagger-5 mt-5 text-center text-xs leading-5 text-slate-400">Lupa kata sandi? Hubungi administrator perusahaan Anda.</p>
        </div>
      </section>
    </main>
  );
}
