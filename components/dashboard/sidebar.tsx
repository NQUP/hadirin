"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { entries } from "@/components/dashboard/dashboard-menu";
import type { AppRole } from "@/types/database";

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
    <aside className="sidebar-surface fixed inset-y-0 left-0 z-30 hidden w-[260px] shrink-0 print:hidden lg:block">
      <div className="flex h-full flex-col px-4 py-5">
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-white/15 shadow-sm ring-1 ring-white/20">
            <img src="/images/hadirin.png" alt="Hadirin" className="size-full object-contain" />
          </div>
          <div className="min-w-0"><p className="text-[15px] font-bold tracking-tight text-white">Hadirin</p><p className="text-[11px] text-white/70">Sistem Absensi</p></div>
        </div>
        <div className="mb-4 px-3"><div className="h-px w-full bg-gradient-to-r from-white/20 via-white/20 to-transparent" /></div>
        <div className="relative min-h-0 flex-1">
          <nav className="h-full space-y-1 overflow-y-auto pb-6">
            {entries[profile.role].map(([label, href, Icon], index) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
              return <Link key={href} href={href} className={`sidebar-menu-in group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 ${active ? "bg-white text-indigo-700 shadow-lg shadow-black/10" : "text-white/75 hover:bg-white/10 hover:text-white"}`} style={{ animationDelay: `${index * 50}ms` }}><span className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${active ? "bg-indigo-100 text-indigo-600" : "text-white/60 group-hover:bg-white/10 group-hover:text-cyan-300"}`}><Icon className="size-[17px]" /></span><span>{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/60" />}</Link>;
            })}
          </nav>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1e1b4b] to-transparent" />
        </div>
        <div className="mt-auto px-3 pt-6"><div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">HADIRIN</p><p className="mt-0.5 text-[11px] text-white/80">Sistem manajemen kehadiran</p></div></div>
      </div>
    </aside>
  );
}
