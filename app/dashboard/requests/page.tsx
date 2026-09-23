import { ClipboardList } from "lucide-react";

import { LeaveForm } from "@/components/dashboard/leave-form";
import { RequestActions } from "@/components/dashboard/request-actions";
import { RequestDetailModal } from "@/components/dashboard/request-detail-modal";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function RequestsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("leave_requests")
    .select(
      "*, profiles!leave_requests_employee_id_fkey(full_name, employee_number)",
    )
    .order("created_at", { ascending: false });

  if (profile.role === "employee") {
    query = query.eq("employee_id", profile.id);
  }

  const { data: requests, error } = await query;

  /*
   * Buat signed URL untuk setiap dokumen.
   *
   * document_path disimpan di database, sedangkan
   * document_url dibuat sementara dari Supabase Storage.
   */
  const requestsWithDocuments = await Promise.all(
    (requests ?? []).map(async (request) => {
      let documentUrl: string | null = null;

      if (request.document_path) {
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage.from("leave-documents").createSignedUrl(
            request.document_path,
            60 * 10, // berlaku 10 menit
          );

        if (signedUrlError) {
          console.error("❌ SIGNED URL ERROR:", {
            path: request.document_path,
            error: signedUrlError,
          });
        } else {
          documentUrl = signedUrlData?.signedUrl ?? null;

          console.log("✅ SIGNED URL:", {
            path: request.document_path,
            url: documentUrl,
          });
        }
      }

      const employee = request.profiles as unknown as {
        full_name: string;
        employee_number?: string;
      } | null;

      return {
        ...request,
        document_url: documentUrl,
        employee_name: employee?.full_name ?? null,
      };
    }),
  );

  return (
    <section className="space-y-7">
      {/* HEADER */}
      <div>
        <p className="text-sm font-medium text-blue-600">Pengajuan</p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          {profile.role === "employee"
            ? "Ajukan Izin, Sakit, atau Cuti"
            : "Pengajuan Tim"}
        </h2>
      </div>

      {/* FORM KARYAWAN */}
      {profile.role === "employee" && <LeaveForm />}

      {/* RIWAYAT */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Riwayat pengajuan</h3>
        </div>

        {/* ERROR */}
        {error ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-700">
              Data tidak dapat dimuat
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Muat ulang halaman untuk mencoba kembali.
            </p>
          </div>
        ) : !requestsWithDocuments.length ? (
          /* EMPTY */
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto size-9 text-slate-300" />

            <p className="mt-3 font-medium text-slate-700">Belum ada data</p>

            <p className="mt-1 text-sm text-slate-500">
              Pengajuan yang dibuat akan muncul di sini.
            </p>
          </div>
        ) : (
          /* LIST */
          <div className="divide-y divide-slate-100">
            {requestsWithDocuments.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                {/* INFO PENGAJUAN */}
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    {request.leave_type === "leave"
                      ? "Cuti"
                      : request.leave_type === "sick"
                        ? "Sakit"
                        : "Izin"}

                    {profile.role !== "employee" &&
                      ` · ${request.employee_name ?? ""}`}
                  </p>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {request.start_date} s.d. {request.end_date} ·{" "}
                    {request.reason}
                  </p>

                  {/* INDICATOR DOKUMEN */}
                  {request.document_path && (
                    <p className="mt-1 text-xs font-medium text-blue-600">
                      📎 {request.document_name ?? "Dokumen pendukung"}
                    </p>
                  )}
                </div>

                {/* ACTION */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* STATUS */}
                  <span
                    className={`badge ${
                      request.status === "approved"
                        ? "badge-success"
                        : request.status === "rejected"
                          ? "badge-danger"
                          : ""
                    }`}
                  >
                    {request.status === "pending"
                      ? "Menunggu"
                      : request.status === "approved"
                        ? "Disetujui"
                        : "Ditolak"}
                  </span>

                  {/* DETAIL */}
                  <RequestDetailModal
                    request={{
                      id: request.id,
                      leave_type: request.leave_type,
                      start_date: request.start_date,
                      end_date: request.end_date,
                      reason: request.reason,
                      status: request.status,
                      note: request.note,

                      /*
                       * Ini yang sebelumnya kosong.
                       * Sekarang sudah dibuat dari createSignedUrl().
                       */
                      document_url: request.document_url,

                      document_name: request.document_name,
                      document_type: request.document_type,

                      employee_name: request.employee_name,
                    }}
                  />

                  {/* APPROVE / REJECT */}
                  {request.status === "pending" &&
                    profile.role !== "employee" && (
                      <RequestActions requestId={request.id} />
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
