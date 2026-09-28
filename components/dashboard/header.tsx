"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
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
import { entries } from "@/components/dashboard/dashboard-menu";
import { createClient } from "@/utils/supabase/client";
import type { AppRole, Profile } from "@/types/database";
import { NotificationBell } from "@/components/dashboard/notification-bell";

// const entries = {
//   employee: [
//     ["Dashboard", "/dashboard", LayoutDashboard],
//     ["Absensi Saya", "/dashboard/attendance", CalendarClock],
//     ["Pengajuan", "/dashboard/requests", ClipboardList],
//     ["Profil", "/dashboard/profile", Users],
//   ],
//   manager: [
//     ["Dashboard", "/dashboard", LayoutDashboard],
//     ["Tim Saya", "/dashboard/team", Users],
//     ["Absensi Tim", "/dashboard/attendance", CalendarClock],
//     ["Pengajuan", "/dashboard/requests", ClipboardList],
//     ["Laporan", "/dashboard/reports", FileText],
//     ["Profil", "/dashboard/profile", Users],
//   ],
//   admin: [
//     ["Dashboard", "/dashboard", LayoutDashboard],
//     ["Karyawan", "/dashboard/employees", Users],
//     ["Wilayah Kerja", "/dashboard/settings", Building2],
//     ["Absensi", "/dashboard/attendance", CalendarClock],
//     ["Pengajuan", "/dashboard/requests", ClipboardList],
//     ["Laporan", "/dashboard/reports", BarChart3],
//     ["Profil", "/dashboard/profile", Users],
//   ],
// } as const;

function getRoleLabel(role: AppRole) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "manager":
      return "Manager";
    default:
      return "Karyawan";
  }
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "U"
  );
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
      <header className="mobile-safe-top sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl print:hidden sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="mobile-menu-trigger grid size-9 place-items-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="slide-down">
            <p className="text-xs text-slate-400 sm:text-sm">
              Selamat datang kembali,
            </p>
            <h1 className="mt-0.5 text-sm font-semibold text-slate-900 sm:text-[15px]">
              {displayName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />
          <Link
            href="/dashboard/profile"
            className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-indigo-50 hover:shadow-sm"
          >
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400">{roleLabel}</p>
            </div>
            <div className="size-9 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-sm transition-transform duration-200 group-hover:scale-105">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Foto profil"
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-xs font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="grid size-9 place-items-center rounded-xl p-0 text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 sm:size-auto sm:p-2"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* MOBILE DRAWER */}
      <aside
        className={`sidebar-surface mobile-drawer fixed inset-y-0 left-0 z-[9999] flex w-[280px] max-w-[88vw] flex-col shadow-2xl transition-transform duration-300 ease-out lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="slide-in-left mb-8 flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-white/15 shadow-sm ring-1 ring-white/20">
                <img
                  src="/images/hadirin.png"
                  alt="Hadirin"
                  className="size-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-tight text-white">
                  Hadirin
                </p>
                <p className="text-[11px] text-white/70">Sistem Absensi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mobile-close-button grid size-9 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mb-4 px-3">
            <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/20 to-transparent" />
          </div>

          <div className="relative min-h-0 flex-1">
            <nav className="h-full space-y-1 overflow-y-auto pb-6">
              {menuItems.map(([label, href, Icon], index) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`group slide-in-left stagger-${Math.min(index + 1, 8)} flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${active ? "bg-white text-[#1e4fd6] shadow-md shadow-black/10" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ${active ? "bg-amber-400/20 text-amber-500" : "text-white/70 group-hover:bg-white/10 group-hover:text-white"}`}
                    >
                      <Icon className="size-[17px]" />
                    </span>
                    <span>{label}</span>
                    {active && (
                      <span className="ml-auto size-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#2f6bff] to-transparent" />
          </div>

          <div className="mt-auto px-3 pt-6">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                HADIRIN
              </p>
              <p className="mt-0.5 text-[11px] text-white/80">
                Sistem manajemen kehadiran
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/80 transition-all duration-200 hover:bg-rose-500/20 hover:text-rose-100"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
                <LogOut className="size-4" />
              </span>
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
