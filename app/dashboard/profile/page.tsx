"use client";

import { useEffect, useState } from "react";
import { Camera, Lock, Mail, Pencil, Save, User, X } from "lucide-react";

import { showError, showSuccess } from "@/components/ui/sweet-alert";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar_url?: string | null;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // MODE EDIT
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      setFullName(data.full_name ?? "");
      setEmail(data.email ?? "");
      setAvatarPreview(data.avatar_url ?? "");
    } catch (error) {
      console.error("LOAD PROFILE ERROR:", error);

      await showError("Gagal memuat profil", "Data profil tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      void showError("Format tidak valid", "Foto profil harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      void showError("File terlalu besar", "Ukuran foto maksimal 2 MB.");
      return;
    }

    setAvatarFile(file);

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
  }

  function removeAvatar() {
    setAvatarFile(null);

    if (profile?.avatar_url) {
      setAvatarPreview(profile.avatar_url);
    } else {
      setAvatarPreview("");
    }
  }

  // =========================
  // MULAI EDIT
  // =========================

  function startEditing() {
    if (!profile) return;

    setFullName(profile.full_name ?? "");
    setEmail(profile.email ?? "");
    setAvatarPreview(profile.avatar_url ?? "");
    setAvatarFile(null);
    setPassword("");
    setPasswordConfirmation("");

    setIsEditing(true);
  }

  // =========================
  // BATAL EDIT
  // =========================

  function cancelEditing() {
    if (!profile) return;

    setFullName(profile.full_name ?? "");
    setEmail(profile.email ?? "");
    setAvatarPreview(profile.avatar_url ?? "");

    setAvatarFile(null);
    setPassword("");
    setPasswordConfirmation("");

    setIsEditing(false);
  }

  // =========================
  // SIMPAN
  // =========================

  async function saveProfile() {
    if (saving) return;

    if (!fullName.trim()) {
      await showError("Nama belum diisi", "Nama lengkap wajib diisi.");
      return;
    }

    if (password && password.length < 6) {
      await showError(
        "Password terlalu pendek",
        "Password minimal 6 karakter.",
      );
      return;
    }

    if (password !== passwordConfirmation) {
      await showError(
        "Password tidak cocok",
        "Konfirmasi password harus sama.",
      );
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("fullName", fullName.trim());

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      if (password) {
        formData.append("password", password);
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Profil gagal diperbarui.");
      }

      // Update state langsung dari hasil API
      if (result.profile) {
        setProfile((current) =>
          current
            ? {
                ...current,
                ...result.profile,
              }
            : result.profile,
        );

        setFullName(result.profile.full_name ?? "");
        setEmail(result.profile.email ?? "");
        setAvatarPreview(result.profile.avatar_url ?? "");
      }

      setPassword("");
      setPasswordConfirmation("");
      setAvatarFile(null);

      setIsEditing(false);

      await showSuccess(
        "Profil berhasil diperbarui",
        "Perubahan profil berhasil disimpan.",
      );

      // Ambil data terbaru
      await loadProfile();
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);

      await showError(
        "Gagal menyimpan",
        error instanceof Error ? error.message : "Profil gagal diperbarui.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-7">
        <div>
          <p className="text-sm font-medium text-blue-600">Profil</p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Profil Saya
          </h2>
        </div>

        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Memuat profil...
        </div>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  const roleLabel =
    profile.role === "employee"
      ? "Karyawan"
      : profile.role === "manager"
        ? "Manager"
        : profile.role === "admin"
          ? "Administrator"
          : profile.role;

  const displayName = fullName.trim() || "Pengguna";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <section className="space-y-7">
      {/* HEADER */}
      <div>
        <p className="text-sm font-medium text-blue-600">Profil</p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">Profil Saya</h2>

        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi akun Anda.
        </p>
      </div>

      {/* CARD */}
      <div className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* PROFILE HEADER */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-6">
          <div className="flex items-center gap-4">
            {/* AVATAR */}
            <div className="relative">
              <div className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Foto profil"
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              {/* CAMERA */}
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm transition hover:bg-blue-700">
                  <Camera className="size-4" />

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                </label>
              )}
            </div>

            {/* PROFILE INFO */}
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900">
                {displayName}
              </h3>

              <p className="mt-1 truncate text-sm text-slate-500">
                {profile.email}
              </p>

              <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* CANCEL FOTO */}
          {isEditing && avatarFile && (
            <button
              type="button"
              onClick={removeAvatar}
              disabled={saving}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
            >
              <X className="size-3.5" />
              Batalkan foto baru
            </button>
          )}
        </div>

        {/* FORM */}
        <div className="space-y-6 p-6">
          {/* INFORMASI AKUN */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Informasi akun
            </h3>

            <div className="mt-4 grid gap-5">
              {/* NAMA */}
              <label className="block text-sm font-medium text-slate-700">
                Nama lengkap
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing || saving}
                    className="field !pl-12 !pr-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Nama lengkap"
                  />
                </div>
              </label>

              {/* EMAIL */}
              <label className="block text-sm font-medium text-slate-700">
                Email
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    disabled
                    className="field !pl-12 !pr-4 cursor-not-allowed bg-slate-50 text-slate-500"
                    placeholder="nama@perusahaan.com"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Email tidak dapat diubah dari halaman ini.
                </p>
              </label>
            </div>
          </div>

          {/* PASSWORD */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-slate-500" />

              <h3 className="text-sm font-semibold text-slate-900">
                Ubah password
              </h3>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Kosongkan jika tidak ingin mengubah password.
            </p>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {/* PASSWORD BARU */}
              <label className="block text-sm font-medium text-slate-700">
                Password baru
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isEditing || saving}
                  className="field mt-1.5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Minimal 6 karakter"
                />
              </label>

              {/* KONFIRMASI */}
              <label className="block text-sm font-medium text-slate-700">
                Konfirmasi password
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  disabled={!isEditing || saving}
                  className="field mt-1.5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Ulangi password"
                />
              </label>
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            {!isEditing ? (
              /* TOMBOL EDIT */
              <button
                type="button"
                onClick={startEditing}
                className="action-button bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                <Pencil className="size-4" />
                Edit profil
              </button>
            ) : (
              <>
                {/* BATAL */}
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="action-button border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="size-4" />
                  Batal
                </button>

                {/* SIMPAN */}
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="action-button bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="size-4" />

                  {saving ? "Menyimpan..." : "Simpan perubahan"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
