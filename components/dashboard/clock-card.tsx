"use client";

import { useEffect, useState } from "react";
import { Clock3, LogIn, LogOut, MapPin } from "lucide-react";
import { SelfieCapture } from "@/components/dashboard/selfie-capture";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError, showInfo, showSuccess } from "@/components/ui/sweet-alert";
import { createClient } from "@/utils/supabase/client";

type Attendance = {
  id: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  status: string;
} | null;

type WorkRegion = {
  name: string;
  address: string | null;
} | null;

type ClockState = "idle" | "locating" | "uploading" | "submitting";

export function ClockCard({
  initialAttendance,
  workRegion,
}: {
  initialAttendance: Attendance;
  workRegion: WorkRegion;
}) {
  const [attendance, setAttendance] = useState<Attendance>(initialAttendance);

  const [now, setNow] = useState(new Date());

  const [clockState, setClockState] = useState<ClockState>("idle");

  const [selfie, setSelfie] = useState<Blob | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function uploadSelfie(photo: Blob, action: "clock-in" | "clock-out") {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
    }

    const date = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });

    const path = `${user.id}/${date}/${action}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("attendance-selfies")
      .upload(path, photo, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw new Error(
        "Foto selfie tidak dapat diunggah. Pastikan storage selfie sudah diaktifkan.",
      );
    }

    return path;
  }

  async function submit(action: "clock-in" | "clock-out") {
    if (!selfie) {
      await showInfo(
        "Selfie diperlukan",
        "Ambil foto selfie sebelum melakukan absensi.",
      );
      return;
    }

    if (!navigator.geolocation) {
      await showError(
        "GPS tidak tersedia",
        "Browser ini tidak mendukung lokasi.",
      );
      return;
    }

    setClockState("locating");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          /*
           * Upload selfie
           */
          setClockState("uploading");

          const selfiePath = await uploadSelfie(selfie, action);

          /*
           * Submit absensi
           */
          setClockState("submitting");

          const response = await fetch(`/api/attendance/${action}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: coords.latitude,
              longitude: coords.longitude,
              selfiePath,
            }),
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error);
          }

          /*
           * Update attendance.
           *
           * Penting:
           * selfie TIDAK langsung dihapus setelah Clock In,
           * supaya foto tetap tampil dan tombol Ambil ulang
           * bisa dikunci berdasarkan attendance.clock_in_at.
           */
          setAttendance(payload.attendance);

          /*
           * Hanya hapus selfie setelah Clock Out.
           */
          if (action === "clock-out") {
            setSelfie(null);
          }

          const attendanceTime =
            action === "clock-in"
              ? payload.attendance.clock_in_at
              : payload.attendance.clock_out_at;

          const time = new Date(attendanceTime).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
          });

          await showSuccess(
            "Absensi berhasil",
            `${action === "clock-in" ? "Jam masuk" : "Jam pulang"}: ${time}`,
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Absensi tidak dapat diproses.";

          await showError(
            message.toLowerCase().includes("radius") ||
              message.toLowerCase().includes("wilayah")
              ? "Lokasi di luar area"
              : "Absensi gagal",
            message,
          );
        } finally {
          setClockState("idle");
        }
      },
      async () => {
        setClockState("idle");

        await showInfo(
          "Lokasi diperlukan",
          "Aktifkan izin lokasi untuk melanjutkan absensi.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      },
    );
  }

  /*
   * Waktu saat ini
   */
  const time = now.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  /*
   * Tanggal saat ini
   */
  const date = now.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /*
   * Status proses
   */
  const busy = clockState !== "idle";

  const label =
    clockState === "locating"
      ? "Memverifikasi lokasi..."
      : clockState === "uploading"
        ? "Mengunggah selfie..."
        : "Memproses absensi...";

  /*
   * Tombol Clock In / Clock Out hanya aktif
   * jika sudah mengambil selfie dan tidak sedang proses.
   */
  const canClock = Boolean(workRegion && selfie && !busy);

  /*
   * Kalau sudah Clock In,
   * selfie tidak boleh diambil ulang.
   */
  const attendanceCompleted = Boolean(attendance?.clock_in_at);

  return (
    <section className="fade-in rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 p-6 text-white shadow-lg shadow-blue-200">
      {/* WAKTU */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-blue-100">Waktu server (WIB)</p>

          <p className="mt-1 text-4xl font-bold tracking-tight">{time}</p>

          <p className="mt-1 text-sm text-blue-100">{date}</p>
        </div>

        <Clock3 className="size-9 text-blue-200" />
      </div>

      {/* WILAYAH KERJA */}
      <div className="mt-6 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-sm text-blue-50">
        <MapPin className="mt-0.5 size-4 shrink-0" />

        <div>
          <p className="font-semibold">
            Wilayah kerja: {workRegion?.name ?? "Belum ditetapkan"}
          </p>

          <p className="mt-0.5 text-xs text-blue-100">
            {workRegion?.address ??
              "Hubungi administrator untuk menetapkan wilayah kerja dan radius absensi."}
          </p>
        </div>
      </div>

      {/* SELFIE */}
      <div className="mt-4">
        <SelfieCapture
          workRegion={workRegion?.name ?? "Wilayah belum ditetapkan"}
          onCapture={setSelfie}
          disabled={busy || !workRegion}
          attendanceCompleted={attendanceCompleted}
        />
      </div>

      {/* BUTTON ABSENSI */}
      <div className="mt-4 flex flex-wrap gap-3" aria-busy={busy}>
        {/* CLOCK IN */}
        {!attendance?.clock_in_at && (
          <button
            type="button"
            disabled={!canClock}
            onClick={() => void submit("clock-in")}
            className="action-button bg-white text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="size-4" />

            {busy ? <LoadingSpinner label={label} /> : "Clock In"}
          </button>
        )}

        {/* CLOCK OUT */}
        {attendance?.clock_in_at && !attendance.clock_out_at && (
          <button
            type="button"
            disabled={!canClock}
            onClick={() => void submit("clock-out")}
            className="action-button bg-white text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="size-4" />

            {busy ? <LoadingSpinner label={label} /> : "Clock Out"}
          </button>
        )}

        {/* SELESAI */}
        {attendance?.clock_out_at && (
          <span className="rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold">
            Absensi hari ini selesai
          </span>
        )}
      </div>

      {/* INFO */}
      {!selfie && !attendance?.clock_out_at && (
        <p className="mt-3 text-xs text-blue-100">
          Ambil selfie untuk mengaktifkan tombol absensi.
        </p>
      )}
    </section>
  );
}
