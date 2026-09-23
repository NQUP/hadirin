"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";

import type { AppRole } from "@/types/database";

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

type SidebarProfile = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  avatar_url?: string | null;
};

export function Sidebar({ profile }: { profile: SidebarProfile }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-slate-200/60 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        {/* BRAND */}
        <div className="slide-in-left mb-8 flex items-center gap-3 px-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-xl shadow-sm">
            <img src="/images/hadirin.png" alt="Hadirin" className="size-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-slate-900">Hadirin</p>
            <p className="text-[11px] text-slate-400">Sistem Absensi</p>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mb-4 px-3">
          <div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-1">
          {entries[profile.role].map(([label, href, Icon], index) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                className={`group slide-in-left stagger-${Math.min(index + 1, 8)} flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm shadow-blue-100/50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-blue-100 text-blue-600 shadow-sm"
                    : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                }`}>
                  <Icon className="size-[17px]" />
                </span>
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div className="mt-auto px-3 pt-6">
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">HADIRIN</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Sistem manajemen kehadiran</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
