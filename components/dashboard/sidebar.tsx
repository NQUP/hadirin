"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { entries, type MenuItem } from "@/components/dashboard/dashboard-menu";
import type { AppRole } from "@/types/database";

type SidebarProfile = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  avatar_url?: string | null;
};

function isGroupActive(item: MenuItem, pathname: string) {
  const children = item.length > 3 ? item[3] : undefined;
  if (!children) return false;
  return children.some(
    ([, href]) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)),
  );
}

export function Sidebar({ profile }: { profile: SidebarProfile }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar-surface fixed inset-y-0 left-0 z-30 hidden w-[260px] shrink-0 print:hidden lg:block">
      <div className="flex h-full flex-col px-4 py-5">
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-white/15 shadow-sm ring-1 ring-white/20">
            <Image
              src="/images/hadirin.png"
              alt="Hadirin"
              width={40}
              height={40}
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

        <div className="mb-4 px-3">
          <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/20 to-transparent" />
        </div>

        <div className="min-h-0 flex-1">
          <nav className="h-full space-y-1 overflow-y-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,black_calc(100%-32px),transparent)]">
            {entries[profile.role].map((item, index) => {
              const [label, href, Icon] = item;
              const hasChildren = item.length > 3;

              if (hasChildren) {
                return (
                  <SidebarGroup
                    key={href}
                    item={item}
                    pathname={pathname}
                    index={index}
                  />
                );
              }

              const active =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-menu-in group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                    active
                      ? "bg-white text-indigo-700 shadow-lg shadow-black/10"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${
                      active
                        ? "bg-indigo-100 text-indigo-600"
                        : "text-white/60 group-hover:bg-white/10 group-hover:text-cyan-300"
                    }`}
                  >
                    <Icon className="size-[17px]" />
                  </span>
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/60" />
                  )}
                </Link>
              );
            })}
          </nav>
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
        </div>
      </div>
    </aside>
  );
}

function SidebarGroup({
  item,
  pathname,
  index,
}: {
  item: MenuItem;
  pathname: string;
  index: number;
}) {
  const [label, , Icon] = item;
  const children = item.length > 3 ? item[3] : undefined;
  if (!children) return null;
  const groupActive = isGroupActive(item, pathname);
  const [open, setOpen] = useState(groupActive);

  return (
    <div
      className="sidebar-menu-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
          groupActive && !open
            ? "bg-white/15 text-white"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${
            groupActive
              ? "bg-white/15 text-cyan-300"
              : "text-white/60 group-hover:bg-white/10 group-hover:text-cyan-300"
          }`}
        >
          <Icon className="size-[17px]" />
        </span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`size-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/15 pl-4">
          {children.map(([childLabel, childHref, ChildIcon]) => {
            const active =
              pathname === childHref ||
              (childHref !== "/dashboard" &&
                childHref !== item[1] &&
                pathname.startsWith(`${childHref}/`));
            return (
              <Link
                key={childHref}
                href={childHref}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors duration-200 ${
                  active
                    ? "bg-white text-indigo-700 shadow-md shadow-black/10"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ChildIcon className="size-[15px] shrink-0" />
                <span>{childLabel}</span>
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/60" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

