"use client";

import { useEffect, useState } from "react";
import { Camera, Lock, Mail, Pencil, Save, User, X, Shield } from "lucide-react";
import { showError, showSuccess } from "@/components/ui/sweet-alert";
import { createClient } from "@/utils/supabase/client";

type Profile = { id: string; full_name: string; email: string; role: string; is_active: boolean; avatar_url?: string | null };

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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, role, is_active, avatar_url").eq("id", user.id).single();
      if (error) throw error;
      setProfile(data); setFullName(data.full_name ?? ""); setEmail(data.email ?? ""); setAvatarPreview(data.avatar_url ?? "");
    } catch (error) {
      console.error("LOAD PROFILE ERROR:", error);
      await showError("Gagal memuat profil", "Data profil tidak dapat dimuat.");
    } finally { setLoading(false); }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { void showError("Format tidak valid", "Foto profil harus berupa gambar."); return; }
    if (file.size > 2 * 1024 * 1024) { void showError("File terlalu besar", "Ukuran foto maksimal 2 MB."); return; }
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
  }

  function removeAvatar() { setAvatarFile(null); setAvatarPreview(profile?.avatar_url ?? ""); }

  function startEditing() {
    if (!profile) return;
    setFullName(profile.full_name ?? ""); setEmail(profile.email ?? ""); setAvatarPreview(profile.avatar_url ?? "");
    setAvatarFile(null); setPassword(""); setPasswordConfirmation(""); setIsEditing(true);
  }

  function cancelEditing() {
    if (!profile) return;
    setFullName(profile.full_name ?? ""); setEmail(profile.email ?? ""); setAvatarPreview(profile.avatar_url ?? "");
    setAvatarFile(null); setPassword(""); setPasswordConfirmation(""); setIsEditing(false);
  }

  async function saveProfile() {
    if (saving) return;
    if (!fullName.trim()) { await showError("Nama belum diisi", "Nama lengkap wajib diisi."); return; }
    if (password && password.length < 6) { await showError("Password terlalu pendek", "Password minimal 6 karakter."); return; }
    if (password !== passwordConfirmation) { await showError("Password tidak cocok", "Konfirmasi password harus sama."); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      if (avatarFile) formData.append("avatar", avatarFile);
      if (password) formData.append("password", password);
      const response = await fetch("/api/profile", { method: "PATCH", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Profil gagal diperbarui.");
      if (result.profile) {
        setProfile((current) => current ? { ...current, ...result.profile } : result.profile);
        setFullName(result.profile.full_name ?? ""); setEmail(result.profile.email ?? "");
        setAvatarPreview(result.profile.avatar_url ?? "");
      }
      setPassword(""); setPasswordConfirmation(""); setAvatarFile(null); setIsEditing(false);
      await showSuccess("Profil diperbarui", "Perubahan berhasil disimpan.");
    } catch (error) {
      await showError("Gagal menyimpan", error instanceof Error ? error.message : "Profil tidak dapat diperbarui.");
    } finally { setSaving(false); }
  }

  if (loading) return (
    <section className="space-y-6">
      <div className="slide-up"><div className="skeleton h-5 w-20 rounded-full" /><div className="skeleton mt-3 h-8 w-48" /></div>
      <div className="slide-up stagger-1 skeleton h-80 rounded-2xl" />
    </section>
  );

  if (!profile) return null;

  const initials = profile.full_name?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "U";

  return (
    <section className="space-y-7">
      <div className="slide-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <User className="size-3.5" />
          Profil
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Profil Saya</h2>
      </div>

      <div className="scale-in rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-6 py-8">
          <div className="floating-dot right-[10%] top-[20%] size-24 opacity-20" style={{ animationDelay: "0s" }} />
          <div className="floating-dot left-[5%] bottom-[10%] size-16 opacity-15" style={{ animationDelay: "2s" }} />

          <div className="relative z-10 flex items-center gap-5">
            <div className="group relative">
              <div className="size-20 overflow-hidden rounded-2xl bg-white/20 shadow-lg ring-4 ring-white/20 transition-transform duration-300 group-hover:scale-105">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Foto profil" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-2xl font-bold text-white">{initials}</div>
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 z-20 grid cursor-pointer place-items-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={saving} />
                </label>
              )}
            </div>
            <div className="text-white">
              <h3 className="text-xl font-bold">{profile.full_name}</h3>
              <p className="mt-1 text-sm text-blue-200">{profile.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Shield className="size-3" />
                  {profile.role === "admin" ? "Administrator" : profile.role === "manager" ? "Manager" : "Karyawan"}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${profile.is_active ? "bg-emerald-400/20 text-emerald-200" : "bg-rose-400/20 text-rose-200"}`}>
                  {profile.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Informasi akun</h3>
            <div className="mt-4 grid gap-5">
              <label className="block text-sm font-medium text-slate-700">
                Nama lengkap
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing || saving} className="field !pl-12 !pr-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="Nama lengkap" />
                </div>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} disabled className="field !pl-12 !pr-4 cursor-not-allowed bg-slate-50 text-slate-500" placeholder="nama@perusahaan.com" />
                </div>
                <p className="mt-1 text-xs text-slate-400">Email tidak dapat diubah dari halaman ini.</p>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Ubah password</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">Kosongkan jika tidak ingin mengubah password.</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Password baru
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!isEditing || saving} className="field mt-1.5 disabled:cursor-not-allowed disabled:bg-slate-50" placeholder="Minimal 6 karakter" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Konfirmasi password
                <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} disabled={!isEditing || saving} className="field mt-1.5 disabled:cursor-not-allowed disabled:bg-slate-50" placeholder="Ulangi password" />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            {!isEditing ? (
              <button type="button" onClick={startEditing} className="action-button bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-blue-800">
                <Pencil className="size-4" />
                Edit profil
              </button>
            ) : (
              <>
                <button type="button" onClick={cancelEditing} disabled={saving} className="action-button border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <X className="size-4" /> Batal
                </button>
                <button type="button" onClick={saveProfile} disabled={saving} className="action-button bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Save className="size-4" /> {saving ? "Menyimpan..." : "Simpan perubahan"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
