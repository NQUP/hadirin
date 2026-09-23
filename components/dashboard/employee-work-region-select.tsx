"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError, showSuccess } from "@/components/ui/sweet-alert";
import type { WorkRegion } from "@/components/dashboard/office-region-manager";

export function EmployeeWorkRegionSelect({ employeeId, regionId, regions }: { employeeId: string; regionId: string | null; regions: WorkRegion[] }) {
  const router = useRouter(); const [value, setValue] = useState(regionId ?? ""); const [saving, setSaving] = useState(false);
  async function assign(nextValue: string) {
    setValue(nextValue); setSaving(true);
    try { const response = await fetch(`/api/employees/${employeeId}/work-region`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ officeLocationId: nextValue || null }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); await showSuccess("Wilayah kerja diperbarui"); router.refresh(); } catch (error) { setValue(regionId ?? ""); await showError("Wilayah kerja gagal diperbarui", error instanceof Error ? error.message : "Silakan coba lagi."); } finally { setSaving(false); }
  }
  const selectedRegion = regions.find((region) => region.id === value);
  return <div className="flex items-center gap-2"><select value={value} onChange={(event) => assign(event.target.value)} disabled={saving} className="field min-w-44 py-2 text-xs" aria-label="Wilayah kerja karyawan"><option value="">Belum ditetapkan</option>{regions.map((region) => <option key={region.id} value={region.id} disabled={!region.is_active}>{region.name}{!region.is_active ? " (nonaktif)" : ""}</option>)}</select>{selectedRegion && <a href={`https://www.openstreetmap.org/?mlat=${selectedRegion.latitude}&mlon=${selectedRegion.longitude}#map=16/${selectedRegion.latitude}/${selectedRegion.longitude}`} target="_blank" rel="noreferrer" className="icon-action text-blue-700 hover:bg-blue-50" aria-label={`Lihat peta ${selectedRegion.name}`}><Map className="size-4" /></a>}{saving && <LoadingSpinner label="" className="text-blue-600" />}</div>;
}
