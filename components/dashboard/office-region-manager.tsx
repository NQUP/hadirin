"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { confirmAction, showError, showSuccess } from "@/components/ui/sweet-alert";

const WorkRegionMap = dynamic(() => import("@/components/dashboard/work-region-map").then((module) => module.WorkRegionMap), { ssr: false, loading: () => <div className="skeleton h-72 w-full" /> });

export type WorkRegion = { id: string; name: string; address: string | null; latitude: number; longitude: number; radius_meters: number; is_active: boolean };
type RegionForm = { id?: string; name: string; address: string; latitude: string; longitude: string; radiusMeters: string; isActive: boolean };
const emptyForm: RegionForm = { name: "", address: "", latitude: "", longitude: "", radiusMeters: "100", isActive: true };

export function OfficeRegionManager({ regions }: { regions: WorkRegion[] }) {
  const router = useRouter();
  const [form, setForm] = useState<RegionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isEditing = Boolean(form.id);
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const radiusMeters = Number(form.radiusMeters) || 100;
  const update = (field: keyof RegionForm, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (region: WorkRegion) => setForm({ id: region.id, name: region.name, address: region.address ?? "", latitude: String(region.latitude), longitude: String(region.longitude), radiusMeters: String(region.radius_meters), isActive: region.is_active });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return; setSaving(true);
    try {
      const response = await fetch("/api/office-locations", { method: isEditing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
      setForm(emptyForm); await showSuccess(isEditing ? "Wilayah berhasil diperbarui" : "Wilayah berhasil ditambahkan"); router.refresh();
    } catch (error) { await showError("Wilayah tidak dapat disimpan", error instanceof Error ? error.message : "Silakan coba lagi."); } finally { setSaving(false); }
  }

  async function remove(region: WorkRegion) {
    if (!await confirmAction({ title: `Hapus ${region.name}?`, text: "Wilayah yang dihapus tidak dapat dikembalikan.", confirmButtonText: "Ya, hapus" })) return;
    setDeletingId(region.id);
    try { const response = await fetch(`/api/office-locations?id=${region.id}`, { method: "DELETE" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); await showSuccess("Wilayah berhasil dihapus"); router.refresh(); } catch (error) { await showError("Wilayah tidak dapat dihapus", error instanceof Error ? error.message : "Silakan coba lagi."); } finally { setDeletingId(null); }
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5" aria-busy={saving}>
      <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">{isEditing ? "Edit wilayah kerja" : "Tambah wilayah kerja"}</h3><p className="mt-1 text-sm text-slate-500">Klik peta untuk menentukan pusat geofence.</p></div>{isEditing && <button type="button" onClick={() => setForm(emptyForm)} className="icon-action text-slate-500 hover:bg-slate-100" aria-label="Batalkan edit"><X className="size-4" /></button>}</div>
      <div className="grid gap-4"><WorkRegionMap latitude={latitude} longitude={longitude} radiusMeters={radiusMeters} onSelect={(selectedLatitude, selectedLongitude) => setForm((current) => ({ ...current, latitude: selectedLatitude.toFixed(7), longitude: selectedLongitude.toFixed(7) }))} /><p className="-mt-2 text-xs text-slate-500">Lingkaran menunjukkan radius absensi. Anda juga dapat mengubah koordinat secara manual.</p>
        <label className="text-sm font-medium text-slate-700">Nama wilayah<input required disabled={saving} value={form.name} onChange={(event) => update("name", event.target.value)} className="field mt-1" placeholder="Contoh: Kantor Pusat Jakarta" /></label>
        <label className="text-sm font-medium text-slate-700">Alamat<textarea disabled={saving} value={form.address} onChange={(event) => update("address", event.target.value)} className="field mt-1 min-h-20" placeholder="Alamat atau deskripsi wilayah kerja" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Latitude<input required disabled={saving} type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} className="field mt-1" placeholder="-6.200000" /></label><label className="text-sm font-medium text-slate-700">Longitude<input required disabled={saving} type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} className="field mt-1" placeholder="106.816666" /></label></div>
        <label className="text-sm font-medium text-slate-700">Radius absensi (meter)<input required disabled={saving} type="number" min="10" max="50000" value={form.radiusMeters} onChange={(event) => update("radiusMeters", event.target.value)} className="field mt-1" /></label>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.isActive} disabled={saving} onChange={(event) => update("isActive", event.target.checked)} className="size-4 rounded border-slate-300" />Wilayah aktif untuk absensi</label>
        <button disabled={saving} className="action-button w-full bg-blue-600 text-white hover:bg-blue-700">{saving ? <LoadingSpinner label="Menyimpan..." /> : <><Plus className="size-4" />{isEditing ? "Simpan perubahan" : "Tambah wilayah"}</>}</button>
      </div>
    </form>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold text-slate-900">Wilayah terdaftar</h3></div>{regions.length ? <div className="divide-y divide-slate-100">{regions.map((region) => <article key={region.id} className="flex items-start justify-between gap-4 p-5"><div className="flex min-w-0 gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><MapPin className="size-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-medium text-slate-800">{region.name}</h4><span className={`badge ${region.is_active ? "badge-success" : "badge-danger"}`}>{region.is_active ? "Aktif" : "Nonaktif"}</span></div><p className="mt-1 truncate text-sm text-slate-500">{region.address || "Alamat belum diisi"}</p><p className="mt-2 text-xs text-slate-400">{region.latitude}, {region.longitude} · Radius {region.radius_meters} m</p></div></div><div className="flex shrink-0 gap-1"><button onClick={() => edit(region)} className="icon-action text-blue-700 hover:bg-blue-50" aria-label={`Edit ${region.name}`}><Pencil className="size-4" /></button><button disabled={deletingId === region.id} onClick={() => remove(region)} className="icon-action text-rose-700 hover:bg-rose-50" aria-label={`Hapus ${region.name}`}>{deletingId === region.id ? <LoadingSpinner label="" /> : <Trash2 className="size-4" />}</button></div></article>)}</div> : <div className="p-12 text-center"><MapPin className="mx-auto size-9 text-slate-300" /><p className="mt-3 font-medium text-slate-700">Belum ada wilayah kerja</p><p className="mt-1 text-sm text-slate-500">Tambahkan wilayah agar karyawan dapat melakukan absensi.</p></div>}</div>
  </div>;
}
