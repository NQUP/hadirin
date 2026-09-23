import { requireProfile } from "@/lib/auth";
import { BarChart3, FileText, Download } from "lucide-react";

export default async function ReportsPage() {
  await requireProfile(["manager", "admin"]);
  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <BarChart3 className="size-3.5" />
          Laporan
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Laporan Absensi</h2>
      </div>

      <div className="scale-in rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <FileText className="size-7" />
        </div>
        <h3 className="mt-4 font-semibold text-slate-800">Ekspor laporan</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Data rekap harian, mingguan, dan bulanan tersedia melalui tabel absensi. Tambahkan generator CSV/PDF pada deployment berikutnya sesuai format perusahaan.
        </p>
      </div>
    </section>
  );
}
