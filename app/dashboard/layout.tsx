import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { requireProfile } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 lg:flex">
      <Sidebar profile={profile} />
      <div className="min-w-0 flex-1">
        <Header profile={profile} />
        <main className="mobile-page-main mx-auto max-w-7xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
