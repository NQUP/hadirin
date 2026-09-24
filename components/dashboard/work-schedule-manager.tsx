"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Pencil, Save, Trash2, X } from "lucide-react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { confirmAction, showError, showSuccess } from "@/components/ui/sweet-alert";
import type { WorkScheduleResult, WorkScheduleRecord } from "@/lib/work-schedules";

const weekdays = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

const emptyForm = { employeeId: "", shiftId: "", weekdays: [] as number[] };

export function WorkScheduleManager({ data, canManage }: { data: WorkScheduleResult; canManage: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<WorkScheduleRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function edit(schedule: WorkScheduleRecord) {
    setEditing(schedule);
    setForm({ employeeId: schedule.employeeId, shiftId: schedule.shiftId, weekdays: [schedule.weekday] });
  }

  function reset() {
    setEditing(null);
    setForm(emptyForm);
  }

  function toggleWeekday(day: number) {
    setForm((current) => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter((value) => value !== day) : [...current.weekdays, day] }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/work-schedules/${editing.id}` : "/api/work-schedules", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { shiftId: form.shiftId, weekday: form.weekdays[0] } : form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Jadwal kerja tidak dapat disimpan.");
      await showSuccess(editing ? "Jadwal berhasil diperbarui" : "Jadwal berhasil disimpan");
      reset();
      router.refresh();
    } catch (error) {
      await showError("Jadwal tidak dapat disimpan", error instanceof Error ? error.message : "Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(schedule: WorkScheduleRecord) {
    if (!await confirmAction({ title: "Hapus jadwal?", text: `${schedule.employeeName} tidak akan memiliki jadwal ${dayLabel(schedule.weekday)} setelah dihapus.`, confirmButtonText: "Ya, hapus" })) return;
    setDeletingId(schedule.id);
    try {
      const response = await fetch(`/api/work-schedules/${schedule.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Jadwal tidak dapat dihapus.");
      await showSuccess("Jadwal berhasil dihapus");
      router.refresh();
    } catch (error) {
      await showError("Jadwal tidak dapat dihapus", error instanceof Error ? error.message : "Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = new Map<string, WorkScheduleRecord[]>();
  for (const schedule of data.schedules) grouped.set(schedule.employeeId, [...(grouped.get(schedule.employeeId) ?? []), schedule]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      {canManage && (
        <form onSubmit={save} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" aria-busy={saving}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><h3 className="font-semibold text-slate-900">{editing ? "Edit jadwal" : "Tambah jadwal"}</h3><p className="mt-1 text-sm text-slate-500">Satu employee dapat memiliki shift berbeda di setiap hari.</p></div>
            {editing && <button type="button" onClick={reset} className="icon-action text-slate-500 hover:bg-slate-100" aria-label="Batalkan edit"><X className="size-4" /></button>}
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Employee<select required disabled={saving} value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} className="field mt-1"><option value="">Pilih employee</option>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} ({employee.number})</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Shift<select required disabled={saving} value={form.shiftId} onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))} className="field mt-1"><option value="">Pilih shift</option>{data.shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} · {shift.startTime.slice(0, 5)}-{shift.endTime.slice(0, 5)}</option>)}</select></label>
            <fieldset><legend className="text-sm font-medium text-slate-700">Hari kerja</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{weekdays.map((day) => <label key={day.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${form.weekdays.includes(day.value) ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}><input type="checkbox" checked={form.weekdays.includes(day.value)} disabled={saving} onChange={() => toggleWeekday(day.value)} className="size-4 accent-blue-600" />{day.label}</label>)}</div></fieldset>
            <button type="submit" disabled={saving || !form.weekdays.length} className="action-button w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoadingSpinner label="Menyimpan..." /> : <><Save className="size-4" />{editing ? "Simpan perubahan" : "Simpan jadwal"}</>}</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4"><h3 className="font-semibold text-slate-900">Jadwal employee</h3></div>
        {grouped.size ? <div className="divide-y divide-slate-100">{[...grouped.entries()].map(([employeeId, schedules], index) => <article key={employeeId} className="slide-up p-5" style={{ animationDelay: `${index * 40}ms` }}><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-medium text-slate-900">{schedules[0].employeeName}</h4><p className="mt-1 text-xs text-slate-400">{schedules[0].employeeNumber}</p></div><span className="badge badge-success">{schedules.length} hari</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{schedules.sort((left, right) => weekdayOrder(left.weekday) - weekdayOrder(right.weekday)).map((schedule) => <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"><div><p className="text-sm font-medium text-slate-700">{dayLabel(schedule.weekday)}</p><p className="text-xs text-slate-500">{schedule.shiftName} · {schedule.startTime.slice(0, 5)}-{schedule.endTime.slice(0, 5)}</p></div>{canManage && <div className="flex gap-1"><button type="button" onClick={() => edit(schedule)} className="icon-action text-blue-700 hover:bg-blue-50" aria-label={`Edit ${dayLabel(schedule.weekday)} ${schedule.employeeName}`}><Pencil className="size-4" /></button><button type="button" disabled={deletingId === schedule.id} onClick={() => remove(schedule)} className="icon-action text-rose-700 hover:bg-rose-50" aria-label={`Hapus ${dayLabel(schedule.weekday)} ${schedule.employeeName}`}>{deletingId === schedule.id ? <LoadingSpinner label="" /> : <Trash2 className="size-4" />}</button></div>}</div>)}</div></article>)}</div> : <div className="p-16 text-center"><CalendarDays className="mx-auto size-10 text-slate-300" /><p className="mt-3 font-medium text-slate-700">Belum ada jadwal kerja</p><p className="mt-1 text-sm text-slate-500">Jadwal yang tersedia akan muncul di sini.</p></div>}
      </div>
    </div>
  );
}

function dayLabel(weekday: number) {
  return weekdays.find((day) => day.value === weekday)?.label ?? "Hari";
}

function weekdayOrder(weekday: number) {
  return weekday === 0 ? 7 : weekday;
}