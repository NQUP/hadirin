import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations/employee";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const access = await requireApiProfile(["admin"]);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*, departments(name), positions(title)")
    .order("full_name");

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Gagal mengambil data karyawan." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    employees: data,
  });
}

export async function POST(request: Request) {
  const access = await requireApiProfile(["admin"]);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const body = await request.json().catch(() => null);

  const parsed = employeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data karyawan tidak valid.",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  const {
    employeeNumber,
    fullName,
    email,
    role,
    departmentId,
    positionId,
    managerId,
    isActive,
  } = parsed.data;

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    /*
     * 1. Cek nomor karyawan
     */
    const { data: existingEmployee } = await supabase
      .from("profiles")
      .select("id")
      .eq("employee_number", employeeNumber)
      .maybeSingle();

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Nomor karyawan sudah digunakan." },
        { status: 409 }
      );
    }

    /*
     * 2. Cek email di profiles
     */
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email sudah digunakan." },
        { status: 409 }
      );
    }

    /*
     * 3. Buat user Supabase Auth
     *
     * Password awal bisa diganti sesuai kebutuhan.
     */
    const temporaryPassword =
      typeof body?.password === "string" && body.password.length >= 6
        ? body.password
        : "Hadirin@123";

    const {
      data: authData,
      error: authError,
    } = await adminSupabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        employee_number: employeeNumber,
      },
    });

    if (authError || !authData.user) {
      console.error("Supabase Auth error:", authError);

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Gagal membuat akun karyawan.",
        },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    /*
     * 4. Buat profile
     */
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: userId,
        employee_number: employeeNumber,
        full_name: fullName,
        email,
        role,
        department_id: departmentId ?? null,
        position_id: positionId ?? null,
        manager_id: managerId ?? null,
        is_active: isActive ?? true,
      });

    /*
     * Kalau insert profile gagal,
     * hapus kembali user Auth supaya tidak ada
     * akun yatim.
     */
    if (profileError) {
      console.error("Profile insert error:", profileError);

      await adminSupabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error: "Gagal membuat data profil karyawan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        employee: {
          id: userId,
          employeeNumber,
          fullName,
          email,
          role,
        },
        temporaryPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create employee error:", error);

    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat membuat karyawan.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const access = await requireApiProfile(["admin"]);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const body = await request.json().catch(() => null);

  const id =
    typeof body?.id === "string"
      ? body.id
      : null;

  const parsed = employeeSchema.safeParse(body);

  if (!id || !parsed.success) {
    return NextResponse.json(
      { error: "Data karyawan tidak valid." },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      employee_number: parsed.data.employeeNumber,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      role: parsed.data.role,
      department_id: parsed.data.departmentId ?? null,
      position_id: parsed.data.positionId ?? null,
      manager_id: parsed.data.managerId ?? null,
      is_active: parsed.data.isActive ?? true,
    })
    .eq("id", id);

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Gagal memperbarui karyawan." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}