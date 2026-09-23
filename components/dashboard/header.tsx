"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  CalendarClock,
  ClipboardList,
  FileText,
  Building2,
  BarChart3,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import type { AppRole, Profile } from "@/types/database";

const entries = {
  employee: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Absensi Saya", "/dashboard/attendance", CalendarClock],
    ["Pengajuan", "/dashboard/requests", ClipboardList],
    ["Profil", "/dashboard/profile", Users],
  ],
  manager: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Tim Saya", "/dashboard/team", Users],
    ["Absensi Tim", "/dashboard/attendance", CalendarClock],
    ["Pengajuan", "/dashboard/requests", ClipboardList],
    ["Laporan", "/dashboard/reports", FileText],
    ["Profil", "/dashboard/profile", Users],
  ],
  admin: [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ["Karyawan", "/dashboard/employees", Users],
    ["Wilayah Kerja", "/dashboard/settings", Building2],
    ["Absensi", "/dashboard/attendance", CalendarClock],
    ["Pengajuan", "/dashboard/requests", ClipboardList],
    ["Laporan", "/dashboard/reports", BarChart3],
    ["Profil", "/dashboard/profile", Users],
  ],
} as const;

function getRoleLabel(role: AppRole) {
  switch (role) {
    case "admin": return "Administrator";
    case "manager": return "Manager";
    default: return "Karyawan";
  }
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("") || "U";
}

export function Header({ profile }: { profile: Profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = profile.full_name?.trim() || "Pengguna";
  const initials = getInitials(displayName);
  const roleLabel = getRoleLabel(profile.role);

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const menuItems = entries[profile.role];

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="mobile-safe-top sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMenuOpen(true)} className="mobile-menu-trigger grid size-9 place-items-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm lg:hidden" aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <div className="slide-down">
            <p className="text-xs text-slate-400 sm:text-sm">Selamat datang kembali,</p>
            <h1 className="mt-0.5 text-sm font-semibold text-slate-900 sm:text-[15px]">{displayName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" className="relative grid size-9 place-items-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm" aria-label="Notifikasi">
            <Bell className="size-[18px]" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-blue-600 shadow-sm shadow-blue-400 pulse-soft" />
          </button>
          <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />
          <Link href="/dashboard/profile" className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-800">{displayName}</p>
              <p className="text-[10px] text-slate-400">{roleLabel}</p>
            </div>
            <div className="size-9 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm transition-transform duration-200 group-hover:scale-105">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto profil" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-xs font-bold text-white">{initials}</div>
              )}
            </div>
          </Link>
          <button type="button" onClick={logout} className="grid size-9 place-items-center rounded-xl p-0 text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 sm:size-auto sm:p-2" aria-label="Keluar" title="Keluar">
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      <button type="button" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} />

      {/* MOBILE DRAWER */}
      <aside className={`mobile-drawer fixed inset-y-0 left-0 z-[9999] flex w-[280px] max-w-[88vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-screen flex-col px-4 py-5">
          <div className="slide-in-left mb-8 flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-xl shadow-sm">
                <img src="/images/hadirin.png" alt="Hadirin" className="size-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-tight text-slate-900">Hadirin</p>
                <p className="text-[11px] text-slate-400">Sistem Absensi</p>
              </div>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} className="mobile-close-button grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Tutup menu">
              <X className="size-5" />
            </button>
          </div>

          <div className="mb-4 px-3">
            <div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
          </div>

          <nav className="space-y-1 overflow-y-auto">
            {menuItems.map(([label, href, Icon], index) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={`group slide-in-left stagger-${Math.min(index + 1, 8)} flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${active ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm shadow-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ${active ? "bg-blue-100 text-blue-600 shadow-sm" : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"}`}>
                  <Icon className="size-[17px]" />
                </span>
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-400" />}
              </Link>
            );
            })}
          </nav>

          <div className="mt-auto px-3 pt-6">
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">HADIRIN</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Sistem manajemen kehadiran</p>
            </div>
            <button type="button" onClick={logout} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100"><LogOut className="size-4" /></span>
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
