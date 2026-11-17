import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireApiProfile } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(request: Request) {
    const access = await requireApiProfile();

    if ("error" in access) {
        return NextResponse.json(
            { error: access.error },
            { status: access.status },
        );
    }

    try {
        const formData = await request.formData();

        const fullNameValue = formData.get("fullName");
        const fileValue = formData.get("avatar");
        const currentPasswordValue = formData.get("currentPassword");
        const passwordValue = formData.get("password");
        const passwordConfirmationValue = formData.get("passwordConfirmation");

        // =========================
        // VALIDASI NAMA
        // =========================

        if (typeof fullNameValue !== "string") {
            return NextResponse.json(
                { error: "Nama lengkap tidak valid." },
                { status: 422 },
            );
        }

        const fullName = fullNameValue.trim();

        if (!fullName) {
            return NextResponse.json(
                { error: "Nama lengkap wajib diisi." },
                { status: 422 },
            );
        }

        if (fullName.length < 2) {
            return NextResponse.json(
                { error: "Nama lengkap minimal 2 karakter." },
                { status: 422 },
            );
        }

        // =========================
        // VALIDASI PASSWORD (opsional)
        // =========================

        const currentPassword =
            typeof currentPasswordValue === "string"
                ? currentPasswordValue
                : "";

        const password =
            typeof passwordValue === "string"
                ? passwordValue
                : "";

        const passwordConfirmation =
            typeof passwordConfirmationValue === "string"
                ? passwordConfirmationValue
                : "";

        if (password) {
            if (!currentPassword) {
                return NextResponse.json(
                    {
                        error: "Password saat ini wajib diisi untuk mengubah password.",
                    },
                    { status: 422 },
                );
            }

            if (password.length < 8) {
                return NextResponse.json(
                    {
                        error: "Password baru minimal 8 karakter.",
                    },
                    { status: 422 },
                );
            }

            if (password !== passwordConfirmation) {
                return NextResponse.json(
                    {
                        error: "Konfirmasi password tidak cocok.",
                    },
                    { status: 422 },
                );
            }

            // Verifikasi password saat ini dengan Supabase Auth client terpisah
            // yang TIDAK menyimpan sesi/cookie (agar sesi aktif tidak tertimpa).
            const verifyClient = createAdminClient();

            const { error: signInError } =
                await verifyClient.auth.signInWithPassword({
                    email: access.profile.email,
                    password: currentPassword,
                });

            if (signInError) {
                return NextResponse.json(
                    {
                        error: "Password saat ini salah.",
                    },
                    { status: 400 },
                );
            }
        }

        const adminSupabase = createAdminClient();

        let avatarUrl: string | null = null;

        // =========================
        // UPLOAD AVATAR
        // =========================

        if (fileValue instanceof File && fileValue.size > 0) {
            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ];

            if (!allowedTypes.includes(fileValue.type)) {
                return NextResponse.json(
                    {
                        error:
                            "Foto profil hanya boleh JPG, PNG, atau WEBP.",
                    },
                    { status: 422 },
                );
            }

            if (fileValue.size > 2 * 1024 * 1024) {
                return NextResponse.json(
                    {
                        error: "Ukuran foto maksimal 2 MB.",
                    },
                    { status: 422 },
                );
            }

            const extension =
                fileValue.name.split(".").pop()?.toLowerCase() || "png";

            const filePath = `${access.profile.id}/avatar.${extension}`;

            const { error: uploadError } =
                await adminSupabase.storage
                    .from("avatars")
                    .upload(filePath, fileValue, {
                        contentType: fileValue.type,
                        upsert: true,
                    });

            if (uploadError) {
                console.error("UPLOAD AVATAR ERROR:", uploadError);

                return NextResponse.json(
                    {
                        error: "Foto profil gagal diunggah.",
                    },
                    { status: 500 },
                );
            }

            // =========================
            // SIGNED URL
            // =========================

            const { data: signedData, error: signedError } =
                await adminSupabase.storage
                    .from("avatars")
                    .createSignedUrl(
                        filePath,
                        60 * 60 * 24 * 30,
                    );

            if (signedError || !signedData?.signedUrl) {
                console.error(
                    "SIGNED AVATAR ERROR:",
                    signedError,
                );

                return NextResponse.json(
                    {
                        error: "Gagal membuat URL foto profil.",
                    },
                    { status: 500 },
                );
            }

            avatarUrl = signedData.signedUrl;
        }

        // =========================
        // UPDATE PASSWORD (jika diisi)
        // =========================

        if (password) {
            const { error: authError } =
                await adminSupabase.auth.admin.updateUserById(
                    access.profile.id,
                    { password },
                );

            if (authError) {
                console.error(
                    "UPDATE PASSWORD ERROR:",
                    authError.message,
                );

                return NextResponse.json(
                    {
                        error: "Gagal mengubah password.",
                    },
                    { status: 500 },
                );
            }
        }

        // =========================
        // UPDATE PROFILE
        // =========================

        const updateData: {
            full_name: string;
            avatar_url?: string;
        } = {
            full_name: fullName,
        };

        if (avatarUrl) {
            updateData.avatar_url = avatarUrl;
        }

        const {
            data: updatedProfile,
            error: updateError,
        } = await adminSupabase
            .from("profiles")
            .update(updateData)
            .eq("id", access.profile.id)
            .select(
                "id, full_name, email, role, avatar_url",
            )
            .maybeSingle();

        // =========================
        // UPDATE ERROR
        // =========================

        if (updateError) {
            console.error(
                "UPDATE PROFILE ERROR:",
                updateError,
            );

            return NextResponse.json(
                {
                    error: updateError.message,
                },
                { status: 500 },
            );
        }

        // =========================
        // PROFILE TIDAK DITEMUKAN
        // =========================

        if (!updatedProfile) {
            console.error(
                "PROFILE TIDAK DITEMUKAN:",
                access.profile.id,
            );

            return NextResponse.json(
                {
                    error:
                        "Profil tidak ditemukan atau tidak dapat diperbarui.",
                },
                { status: 404 },
            );
        }

        // =========================
        // REFRESH CACHE
        // =========================

        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/profile");

        // =========================
        // RESPONSE
        // =========================

        return NextResponse.json({
            success: true,
            message: password
                ? "Profil dan password berhasil diperbarui."
                : "Profil berhasil diperbarui.",
            profile: {
                id: updatedProfile.id,
                full_name: updatedProfile.full_name,
                email: updatedProfile.email,
                role: updatedProfile.role,
                avatar_url: updatedProfile.avatar_url,
            },
        });
    } catch (error) {
        console.error(
            "PATCH PROFILE ERROR:",
            error,
        );

        return NextResponse.json(
            {
                error: "Gagal memperbarui profil.",
            },
            { status: 500 },
        );
    }
}
