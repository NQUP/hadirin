export default function DashboardLoading() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Memuat dashboard">
      <div className="slide-up"><div className="skeleton h-5 w-24 rounded-full" /><div className="skeleton mt-3 h-8 w-72" /><div className="skeleton mt-2 h-4 w-56" /></div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <div className={`slide-up stagger-${index + 1} rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm`} key={index}><div className="flex items-center justify-between"><div className="skeleton h-4 w-24" /><div className="skeleton size-9 rounded-xl" /></div><div className="skeleton mt-4 h-9 w-16" /><div className="skeleton mt-3 h-3 w-36" /></div>)}
      </div>
      <div className="slide-up stagger-4 skeleton h-64 rounded-2xl" />
    </div>
  );
}
