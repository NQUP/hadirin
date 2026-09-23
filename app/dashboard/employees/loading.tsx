import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function EmployeesLoading() {
  return <section className="space-y-6"><div><div className="skeleton h-4 w-24" /><div className="skeleton mt-3 h-8 w-48" /></div><TableSkeleton columns={4} rows={7} /></section>;
}
