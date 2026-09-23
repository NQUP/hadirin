import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function RequestsLoading() {
  return <section className="space-y-6"><div><div className="skeleton h-4 w-20" /><div className="skeleton mt-3 h-8 w-64" /></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div className="skeleton h-11" key={index} />)}</div></div><TableSkeleton columns={3} rows={5} /></section>;
}
