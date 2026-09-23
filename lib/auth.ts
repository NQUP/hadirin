import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AppRole, Profile } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

const LOGIN_COOKIE = "hadirin_login_at";

const NORMAL_SESSION = 8 * 60 * 60 * 1000; // 8 jam
const REMEMBER_SESSION = 7 * 24 * 60 * 60 * 1000; // 7 hari

/**
 * Mengecek apakah sesi login custom masih berlaku.
 */
async function isLoginSessionValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const loginCookie = cookieStore.get(LOGIN_COOKIE);

  if (!loginCookie?.value) {
    return false;
  }

  const [loginAtString, durationString] =
    loginCookie.value.split(":");

  const loginAt = Number(loginAtString);
  const duration = Number(durationString);

  if (
    !Number.isFinite(loginAt) ||
    !Number.isFinite(duration)
  ) {
    return false;
  }

  const expired =
    Date.now() - loginAt >= duration;

  return !expired;
}

/**
 * Mengambil profile user yang sedang login.
 *
 * Data selalu diambil dari tabel profiles,
 * bukan dari cache / metadata lama.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const sessionValid = await isLoginSessionValid();

  if (!sessionValid) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(
      "GET CURRENT PROFILE ERROR:",
      profileError,
    );

    return null;
  }

  return profile as Profile;
}

/**
 * Untuk halaman Server Component.
 */
export async function requireProfile(
  allowedRoles?: AppRole[],
) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  return profile;
}

/**
 * Untuk API Route.
 */
export async function requireApiProfile(
  allowedRoles?: AppRole[],
) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    return {
      error:
        "Sesi login telah berakhir. Silakan login kembali.",
      status: 401,
    } as const;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(profile.role)
  ) {
    return {
      error: "Anda tidak memiliki akses.",
      status: 403,
    } as const;
  }

  return {
    profile,
  } as const;
}

export {
  LOGIN_COOKIE,
  NORMAL_SESSION,
  REMEMBER_SESSION,
};