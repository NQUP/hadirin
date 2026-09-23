import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function DashboardLoading() {
  return <div className="space-y-7" aria-busy="true" aria-label="Memuat dashboard"><div><div className="skeleton h-4 w-24" /><div className="skeleton mt-3 h-8 w-72" /></div><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div className="rounded-2xl border border-slate-200 bg-white p-5" key={index}><div className="skeleton h-4 w-24" /><div className="skeleton mt-4 h-9 w-16" /><div className="skeleton mt-3 h-3 w-36" /></div>)}</div><TableSkeleton columns={4} rows={4} /></div>;
}
