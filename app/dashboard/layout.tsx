import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { requireProfile } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* SIDEBAR */}
      <Sidebar profile={profile} />

      {/* CONTENT */}
      <div className="min-w-0 flex-1">
        <Header profile={profile} />

        <main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
