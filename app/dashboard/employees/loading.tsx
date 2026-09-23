import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function EmployeesLoading() {
  return (
    <section className="space-y-6">
      <div className="slide-up">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton mt-3 h-8 w-48" />
      </div>
      <TableSkeleton columns={4} rows={7} />
    </section>
  );
}
