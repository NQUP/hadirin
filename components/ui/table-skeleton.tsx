export function TableSkeleton({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm" aria-busy="true" aria-label="Memuat data tabel">
      <div className="h-14 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white" />
      {Array.from({ length: rows }, (_, row) => (
        <div className="grid gap-5 border-b border-slate-100 px-5 py-4 last:border-0" key={row} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, animationDelay: `${row * 50}ms` }}>
          {Array.from({ length: columns }, (_, column) => <span className="skeleton h-4" key={column} />)}
        </div>
      ))}
    </div>
  );
}
