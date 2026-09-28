"use client";

import { useEffect, useState } from "react";
import { Clock3, LogIn, LogOut, MapPin, Wifi } from "lucide-react";
import { SelfieCapture } from "@/components/dashboard/selfie-capture";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError, showInfo, showSuccess } from "@/components/ui/sweet-alert";
import { createClient } from "@/utils/supabase/client";

type Attendance = { id: string; clock_in_at: string | null; clock_out_at: string | null; status: string } | null;
type WorkRegion = { name: string; address: string | null } | null;
type ClockState = "idle" | "locating" | "uploading" | "submitting";

export function ClockCard({ initialAttendance, workRegion }: { initialAttendance: Attendance; workRegion: WorkRegion }) {
  const [attendance, setAttendance] = useState<Attendance>(initialAttendance);
  const [now, setNow] = useState(new Date());
  const [clockState, setClockState] = useState<ClockState>("idle");
  const [selfie, setSelfie] = useState<Blob | null>(null);

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);

  async function uploadSelfie(photo: Blob, action: "clock-in" | "clock-out") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
    const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const path = `${user.id}/${date}/${action}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("attendance-selfies").upload(path, photo, { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error("Foto selfie tidak dapat diunggah. Pastikan storage selfie sudah diaktifkan.");
    return path;
  }

  async function submit(action: "clock-in" | "clock-out") {
    if (!selfie) { await showInfo("Selfie diperlukan", "Ambil foto selfie sebelum melakukan absensi."); return; }
    if (!navigator.geolocation) { await showError("GPS tidak tersedia", "Browser ini tidak mendukung lokasi."); return; }
    setClockState("locating");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        setClockState("uploading");
        const selfiePath = await uploadSelfie(selfie, action);
        setClockState("submitting");
        const response = await fetch(`/api/attendance/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, selfiePath }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setAttendance(payload.attendance);
        if (action === "clock-out") setSelfie(null);
        const attendanceTime = action === "clock-in" ? payload.attendance.clock_in_at : payload.attendance.clock_out_at;
        const time = new Date(attendanceTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
        await showSuccess("Absensi berhasil", `${action === "clock-in" ? "Jam masuk" : "Jam pulang"}: ${time}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Absensi tidak dapat diproses.";
        await showError(message.toLowerCase().includes("radius") || message.toLowerCase().includes("wilayah") ? "Lokasi di luar area" : "Absensi gagal", message);
      } finally { setClockState("idle"); }
    }, async () => { setClockState("idle"); await showInfo("Lokasi diperlukan", "Aktifkan izin lokasi untuk melanjutkan absensi."); }, { enableHighAccuracy: true, timeout: 15000 });
  }

  const time = now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const busy = clockState !== "idle";
  const label = clockState === "locating" ? "Memverifikasi lokasi..." : clockState === "uploading" ? "Mengunggah selfie..." : "Memproses absensi...";
  const canClock = Boolean(workRegion && selfie && !busy);
  const attendanceCompleted = Boolean(attendance?.clock_in_at);

  return (
    <section className="scale-in overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50">
      <div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-sm text-blue-200"><Wifi className="size-3.5 pulse-soft" /><span>Waktu server (WIB)</span></div><p className="mt-2 font-mono text-5xl font-bold tracking-tight">{time}</p><p className="mt-2 text-sm text-blue-200">{date}</p></div><div className="float grid size-12 place-items-center rounded-2xl bg-white/10 backdrop-blur-sm"><Clock3 className="size-6 text-blue-200" /></div></div>
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-white/10 p-3.5 backdrop-blur-sm"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10"><MapPin className="size-4" /></div><div><p className="font-semibold text-sm">Wilayah kerja: {workRegion?.name ?? "Belum ditetapkan"}</p><p className="mt-0.5 text-xs text-blue-200">{workRegion?.address ?? "Hubungi administrator untuk menetapkan wilayah kerja dan radius absensi."}</p></div></div>
      <div className="mt-4"><SelfieCapture workRegion={workRegion?.name ?? "Wilayah belum ditetapkan"} onCapture={setSelfie} disabled={busy || !workRegion} attendanceCompleted={attendanceCompleted} /></div>
      <div className="mt-4 flex flex-wrap gap-3" aria-busy={busy}>
        {!attendance?.clock_in_at && <button type="button" disabled={!canClock} onClick={() => void submit("clock-in")} className="action-button bg-white text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><LogIn className="size-4" />{busy ? <LoadingSpinner label={label} /> : "Clock In"}</button>}
        {attendance?.clock_in_at && !attendance.clock_out_at && <button type="button" disabled={!canClock} onClick={() => void submit("clock-out")} className="action-button bg-white text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><LogOut className="size-4" />{busy ? <LoadingSpinner label={label} /> : "Clock Out"}</button>}
        {attendance?.clock_out_at && <span className="scale-in inline-flex items-center gap-2 rounded-xl bg-emerald-400/20 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm"><span className="size-2 rounded-full bg-emerald-400 pulse-soft" />Absensi hari ini selesai</span>}
      </div>
      {!selfie && !attendance?.clock_out_at && <p className="mt-3 flex items-center gap-1.5 text-xs text-blue-200"><span className="size-1.5 rounded-full bg-blue-300 pulse-soft" />Ambil selfie untuk mengaktifkan tombol absensi.</p>}
    </section>
  );
}
