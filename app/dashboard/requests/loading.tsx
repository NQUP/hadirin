import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function RequestsLoading() {
  return (
    <section className="space-y-6">
      <div className="slide-up">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton mt-3 h-8 w-64" />
      </div>
      <div className="slide-up stagger-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => <div className="skeleton h-11" key={index} />)}
        </div>
      </div>
      <TableSkeleton columns={3} rows={5} />
    </section>
  );
}
