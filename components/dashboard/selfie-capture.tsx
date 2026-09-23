"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, RefreshCw, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { showError } from "@/components/ui/sweet-alert";

interface SelfieCaptureProps {
  workRegion: string;
  onCapture: (photo: Blob | null) => void;
  disabled?: boolean;
  attendanceCompleted?: boolean;
}

export function SelfieCapture({
  workRegion,
  onCapture,
  disabled = false,
  attendanceCompleted = false,
}: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  /*
   * Pasang stream SETELAH <video> benar-benar dirender.
   * Ini menggantikan pendekatan setTimeout sebelumnya.
   */
  useEffect(() => {
    if (!cameraOpen) return;

    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) return;

    setVideoReady(false);

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    const handleReady = async () => {
      try {
        await video.play();

        // Tunggu browser menggambar frame pertama.
        requestAnimationFrame(() => {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            setVideoReady(true);
          }
        });
      } catch {
        setVideoReady(false);
      }
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("canplay", handleReady);

    // Kalau metadata sudah tersedia sebelum listener terpasang.
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      void handleReady();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("canplay", handleReady);
    };
  }, [cameraOpen]);

  /*
   * Cleanup ketika component dilepas.
   */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setVideoReady(false);
    setCameraOpen(false);
  }

  async function openCamera() {
    if (disabled || attendanceCompleted) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      await showError(
        "Kamera tidak tersedia",
        "Browser ini tidak mendukung akses kamera.",
      );
      return;
    }

    setOpening(true);
    setVideoReady(false);

    // Pastikan stream lama sudah berhenti.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      // React akan merender <video> setelah state berubah.
      setCameraOpen(true);
    } catch (error) {
      console.error("Camera error:", error);

      await showError(
        "Izin kamera diperlukan",
        "Izinkan akses kamera pada browser untuk mengambil selfie absensi.",
      );
    } finally {
      setOpening(false);
    }
  }

  function capture() {
    const video = videoRef.current;

    if (
      !video ||
      !videoReady ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) return;

    // Mirror hasil foto agar sama dengan preview kamera
    context.save();

    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    context.restore();

    const now = new Date();

    const stamp = `${now.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
    })} · ${now.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })} WIB`;

    const panelHeight = Math.max(84, canvas.height * 0.16);

    context.fillStyle = "rgba(15, 23, 42, 0.72)";
    context.fillRect(0, canvas.height - panelHeight, canvas.width, panelHeight);

    context.fillStyle = "#ffffff";

    context.font = `600 ${Math.max(18, canvas.width * 0.027)}px Arial`;

    context.fillText(
      "Hadirin · Selfie Absensi",
      24,
      canvas.height - panelHeight + 30,
    );

    context.font = `${Math.max(15, canvas.width * 0.021)}px Arial`;

    context.fillText(workRegion, 24, canvas.height - panelHeight + 56);

    context.fillText(stamp, 24, canvas.height - 18);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        // Hapus preview lama.
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        const url = URL.createObjectURL(blob);

        previewUrlRef.current = url;

        setPreview(url);
        onCapture(blob);

        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  function retake() {
    if (disabled || attendanceCompleted) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreview(null);
    onCapture(null);

    void openCamera();
  }

  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Selfie absensi</p>

        {preview && (
          <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-medium text-emerald-100">
            Foto siap
          </span>
        )}
      </div>

      {cameraOpen ? (
        <div className="overflow-hidden rounded-lg bg-slate-950">
          <div className="relative aspect-video w-full bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />

            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90">
                <LoadingSpinner label="Menyiapkan kamera..." />
              </div>
            )}
          </div>

          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={capture}
              disabled={!videoReady || disabled}
              className="action-button bg-white text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {videoReady ? (
                <>
                  <Camera className="size-4" />
                  Ambil foto
                </>
              ) : (
                <LoadingSpinner label="Menyiapkan kamera..." />
              )}
            </button>

            <button
              type="button"
              onClick={stopCamera}
              disabled={opening}
              className="action-button bg-white/15 text-white hover:bg-white/25 disabled:opacity-50"
            >
              <X className="size-4" />
              Batal
            </button>
          </div>
        </div>
      ) : preview ? (
        <div className="overflow-hidden rounded-lg bg-slate-900">
          <Image
            src={preview}
            alt="Preview selfie absensi"
            width={1280}
            height={720}
            unoptimized
            className="aspect-video w-full object-cover"
          />

          {!attendanceCompleted && (
            <button
              type="button"
              disabled={disabled || opening}
              onClick={retake}
              className="action-button m-3 bg-white text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {opening ? (
                <LoadingSpinner label="Membuka kamera..." />
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Ambil ulang
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || opening}
          onClick={() => void openCamera()}
          className="action-button w-full bg-white text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {opening ? (
            <LoadingSpinner label="Membuka kamera..." />
          ) : (
            <>
              <Camera className="size-4" />
              Ambil selfie
            </>
          )}
        </button>
      )}
    </div>
  );
}
