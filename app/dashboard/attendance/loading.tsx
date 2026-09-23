import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function AttendanceLoading() {
  return <section className="space-y-6"><div><div className="skeleton h-4 w-20" /><div className="skeleton mt-3 h-8 w-56" /></div><TableSkeleton columns={5} rows={7} /></section>;
}
