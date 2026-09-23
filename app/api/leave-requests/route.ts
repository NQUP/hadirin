import { NextResponse } from "next/server";

import { requireApiProfile } from "@/lib/auth";
import { leaveRequestSchema } from "@/lib/validations/leave-request";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const access = await requireApiProfile();

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from("leave_requests")
    .select(
      "*, profiles!leave_requests_employee_id_fkey(full_name, employee_number)",
    )
    .order("created_at", { ascending: false });

  if (access.profile.role === "employee") {
    query = query.eq("employee_id", access.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET leave requests:", error);

    return NextResponse.json(
      { error: "Gagal mengambil pengajuan." },
      { status: 500 },
    );
  }

  return NextResponse.json({ requests: data });
}

export async function POST(request: Request) {
  const access = await requireApiProfile();

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    /*
     * Karena sekarang ada upload file,
     * request harus dibaca sebagai FormData.
     */
    const formData = await request.formData();

    const leaveType = formData.get("leaveType");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const reason = formData.get("reason");

    const fileValue = formData.get("document");

    const file =
      fileValue instanceof File && fileValue.size > 0
        ? fileValue
        : null;

    /*
     * Validasi dasar.
     */
    if (
      typeof leaveType !== "string" ||
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      typeof reason !== "string"
    ) {
      return NextResponse.json(
        { error: "Data pengajuan tidak lengkap." },
        { status: 422 },
      );
    }

    /*
     * Upload dokumen hanya untuk SAKIT.
     */
    let documentPath: string | null = null;
    let documentName: string | null = null;
    let documentType: string | null = null;

    if (leaveType === "sick") {
      if (!file) {
        return NextResponse.json(
          {
            error:
              "Dokumen pendukung wajib dilampirkan untuk pengajuan sakit.",
          },
          { status: 422 },
        );
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Dokumen hanya boleh berupa PDF, JPG, JPEG, atau PNG.",
          },
          { status: 422 },
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: "Ukuran dokumen maksimal 5 MB.",
          },
          { status: 422 },
        );
      }

      const supabase = await createClient();

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "file";

      const filePath = `${access.profile.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("leave-documents")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload leave document:", uploadError);

        return NextResponse.json(
          {
            error:
              "Dokumen gagal diunggah. Pastikan policy bucket leave-documents sudah tersedia.",
          },
          { status: 500 },
        );
      }

      documentPath = filePath;
      documentName = file.name;
      documentType = file.type;

      /*
       * Simpan data pengajuan.
       */
      const { data, error } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: access.profile.id,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          document_path: documentPath,
          document_name: documentName,
          document_type: documentType,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert leave request:", error);

        /*
         * Kalau insert gagal setelah file berhasil upload,
         * hapus kembali file supaya tidak menjadi file yatim.
         */
        await supabase.storage
          .from("leave-documents")
          .remove([documentPath]);

        return NextResponse.json(
          { error: "Gagal membuat pengajuan." },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          request: data,
        },
        { status: 201 },
      );
    }

    /*
     * Untuk izin / cuti tanpa dokumen.
     */
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id: access.profile.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        document_path: null,
        document_name: null,
        document_type: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert leave request:", error);

      return NextResponse.json(
        { error: "Gagal membuat pengajuan." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        request: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST leave request:", error);

    return NextResponse.json(
      {
        error: "Pengajuan tidak dapat diproses.",
      },
      { status: 500 },
    );
  }
}