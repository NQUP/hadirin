import { requireProfile } from "@/lib/auth";

export default async function ReportsPage() {
  await requireProfile(["manager", "admin"]);
  return <section><p className="text-sm font-medium text-blue-600">Laporan</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Laporan Absensi</h2><div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8"><h3 className="font-semibold text-slate-800">Ekspor laporan</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Data rekap harian, mingguan, dan bulanan tersedia melalui tabel absensi. Tambahkan generator CSV/PDF pada deployment berikutnya sesuai format perusahaan.</p></div></section>;
}
