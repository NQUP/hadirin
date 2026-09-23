import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return <main className="grid min-h-screen place-items-center bg-slate-50"><div className="fade-in rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm"><LoadingSpinner label="Memuat Hadirin..." /></div></main>;
}
