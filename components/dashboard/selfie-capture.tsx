"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, RefreshCw, X, RotateCcw } from "lucide-react";
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
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  /*
   * Pasang stream setelah video benar-benar dirender.
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

      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  /*
   * Pantau fullscreen.
   *
   * Kalau user menekan ESC:
   * fullscreen keluar dan kamera juga ditutup.
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && cameraOpen) {
        stopCamera(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [cameraOpen]);

  /*
   * Stop kamera.
   */
  async function stopCamera(exitFullscreen = true) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setVideoReady(false);
    setCameraOpen(false);

    if (exitFullscreen && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Browser bisa saja sudah keluar fullscreen.
      }
    }
  }

  /*
   * Membuka kamera.
   *
   * Fullscreen diminta dari klik user.
   */
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

    /*
     * Hentikan stream lama.
     */
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    /*
     * Masuk fullscreen terlebih dahulu.
     *
     * Elemen fullscreen sudah ada di DOM sehingga browser
     * masih menganggap request ini berasal dari klik user.
     */
    if (fullscreenRef.current && !document.fullscreenElement) {
      try {
        await fullscreenRef.current.requestFullscreen();
      } catch (error) {
        console.warn("Fullscreen tidak tersedia:", error);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      /*
       * React akan merender video setelah state berubah.
       */
      setCameraOpen(true);
    } catch (error) {
      console.error("Camera error:", error);

      /*
       * Kalau kamera gagal dibuka,
       * keluar fullscreen kembali.
       */
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // abaikan
        }
      }

      await showError(
        "Izin kamera diperlukan",
        "Izinkan akses kamera pada browser untuk mengambil selfie absensi.",
      );
    } finally {
      setOpening(false);
    }
  }

  /*
   * Ganti kamera depan / belakang.
   */
  async function switchCamera() {
    if (opening || !cameraOpen) return;

    const nextFacingMode = facingMode === "user" ? "environment" : "user";

    setFacingMode(nextFacingMode);

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    setVideoReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextFacingMode,
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        requestAnimationFrame(() => {
          if (
            videoRef.current &&
            videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          ) {
            setVideoReady(true);
          }
        });
      }
    } catch (error) {
      console.error("Gagal mengganti kamera:", error);

      /*
       * Kembalikan ke kamera depan kalau gagal.
       */
      setFacingMode("user");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setVideoReady(true);
        }
      } catch {
        await stopCamera();
      }
    }
  }

  /*
   * Ambil foto.
   */
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

    /*
     * Kamera depan di-mirror.
     * Kamera belakang tidak.
     */
    if (facingMode === "user") {
      context.save();

      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      context.restore();
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    /*
     * Timestamp WIB.
     */
    const now = new Date();

    const stamp = `${now.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
    })} · ${now.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })} WIB`;

    /*
     * Watermark bawah.
     */
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

        /*
         * Hapus preview lama.
         */
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        const url = URL.createObjectURL(blob);

        previewUrlRef.current = url;

        setPreview(url);

        onCapture(blob);

        /*
         * Tutup kamera + fullscreen.
         */
        void stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  /*
   * Ambil ulang.
   */
  function retake() {
    if (disabled || attendanceCompleted) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);

      previewUrlRef.current = null;
    }

    setPreview(null);
    onCapture(null);

    void openCamera();
  }

  return (
    <>
      {/* =====================================================
          CONTAINER FULLSCREEN
          Container ini selalu ada di DOM.
          Jadi requestFullscreen() bisa dipanggil dari klik.
      ====================================================== */}

      <div
        ref={fullscreenRef}
        className={
          cameraOpen
            ? "fixed inset-0 z-[2147483647] h-[100dvh] w-screen overflow-hidden bg-black"
            : "pointer-events-none fixed left-0 top-0 z-[-1] h-px w-px overflow-hidden opacity-0"
        }
      >
        {cameraOpen && (
          <>
            {/* =========================
                CAMERA
            ========================== */}

            <div className="absolute inset-0 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Loading */}
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <LoadingSpinner label="Menyiapkan kamera..." />
                </div>
              )}
            </div>

            {/* =========================
                TOP BAR
            ========================== */}

            <div className="absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-4 pb-14 pt-5 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between">
                <div className="text-white">
                  <p className="text-base font-semibold">Selfie Absensi</p>

                  <p className="mt-1 text-xs text-white/70">{workRegion}</p>
                </div>

                <button
                  type="button"
                  onClick={() => void stopCamera()}
                  className="grid size-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-white/20"
                  aria-label="Tutup kamera"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* =========================
                SWITCH CAMERA
            ========================== */}

            <button
              type="button"
              onClick={() => void switchCamera()}
              disabled={!videoReady}
              className="absolute right-4 top-24 z-20 grid size-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60 disabled:opacity-40 sm:right-6 sm:top-28"
              aria-label="Ganti kamera"
            >
              <RotateCcw className="size-5" />
            </button>

            {/* =========================
                BOTTOM CONTROLS
            ========================== */}

            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-5 pb-7 pt-24 sm:px-6 sm:pb-8">
              <div className="flex items-center justify-center gap-3">
                {/* BATAL */}

                <button
                  type="button"
                  onClick={() => void stopCamera()}
                  disabled={opening}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white/15 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-50 sm:h-14 sm:px-6"
                >
                  <X className="size-4" />
                  Batal
                </button>

                {/* AMBIL FOTO */}

                <button
                  type="button"
                  onClick={capture}
                  disabled={!videoReady || disabled}
                  className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-blue-700 shadow-2xl transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:px-8"
                >
                  <Camera className="size-5" />

                  {videoReady ? "Ambil foto" : "Menyiapkan..."}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-white/60">
                Posisikan wajah di tengah kamera
              </p>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          CARD NORMAL DASHBOARD
      ====================================================== */}

      <div className="rounded-xl bg-white/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Selfie absensi</p>

          {preview && (
            <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-medium text-emerald-100">
              Foto siap
            </span>
          )}
        </div>

        {/* ===================================================
            PREVIEW SETELAH FOTO DIAMBIL
        =================================================== */}

        {preview ? (
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
          /* =================================================
             TOMBOL BUKA KAMERA
          ================================================== */

          <button
            type="button"
            disabled={disabled || opening || attendanceCompleted}
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
    </>
  );
}
