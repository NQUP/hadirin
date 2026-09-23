import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-50 to-white">
      <div className="bounce-in flex flex-col items-center gap-4">
        <div className="size-10 shrink-0 overflow-hidden rounded-xl shadow-sm">
          <img
            src="/images/hadirin.png"
            alt="Hadirin"
            className="size-full object-contain"
          />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/50">
          <LoadingSpinner label="Memuat Hadirin..." />
        </div>
      </div>
    </main>
  );
}
