import { ClipboardList } from "lucide-react";
import { LeaveForm } from "@/components/dashboard/leave-form";
import { RequestActions } from "@/components/dashboard/request-actions";
import { RequestDetailModal } from "@/components/dashboard/request-detail-modal";
import { EmployeeCombobox } from "@/components/reports/employee-combobox";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function LeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; status?: string }>;
}) {
  const { employeeId = "", status = "" } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const employeeFilter = UUID_RE.test(employeeId) ? employeeId : "";
  const statusFilter = ["pending", "approved", "rejected"].includes(status)
    ? status
    : "";

  // Employee list for combobox (admin: all, manager: own team)
  let employeeOptions: { id: string; name: string; number: string }[] = [];
  if (profile.role !== "employee") {
    let employeesQuery = supabase
      .from("profiles")
      .select("id, full_name, employee_number")
      .eq("role", "employee")
      .order("full_name");
    if (profile.role === "manager")
      employeesQuery = employeesQuery.eq("manager_id", profile.id);
    const { data } = await employeesQuery;
    employeeOptions = (data ?? []).map((e) => ({
      id: e.id,
      name: e.full_name,
      number: e.employee_number ?? "",
    }));
  }

  let query = supabase
    .from("leave_requests")
    .select(
      "*, profiles!leave_requests_employee_id_fkey(full_name, employee_number)",
    )
    .order("created_at", { ascending: false });
  if (profile.role === "employee") query = query.eq("employee_id", profile.id);

  // Manager: scope leave_requests to own team
  if (profile.role === "manager") {
    const { data: team } = await supabase
      .from("profiles")
      .select("id")
      .eq("manager_id", profile.id);
    const ids = (team ?? []).map((m) => m.id);
    query = query.in("employee_id", ids.length ? ids : [ZERO_UUID]);
  }

  if (employeeFilter) query = query.eq("employee_id", employeeFilter);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: requests, error } = await query;

  const requestsWithDocuments = await Promise.all(
    (requests ?? []).map(async (request) => {
      let documentUrl: string | null = null;
      if (request.document_path) {
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from("leave-documents")
            .createSignedUrl(request.document_path, 60 * 10);
        if (signedUrlError)
          console.error("SIGNED URL ERROR:", {
            path: request.document_path,
            error: signedUrlError,
          });
        else {
          documentUrl = signedUrlData?.signedUrl ?? null;
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
      <div className="slide-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <ClipboardList className="size-3.5" />
          Pengajuan
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {profile.role === "employee"
            ? "Ajukan Izin, Sakit, dan Cuti"
            : "Pengajuan Izin & Cuti"}
        </h2>
      </div>

      {profile.role === "employee" && (
        <div className="slide-up stagger-1">
          <LeaveForm />
        </div>
      )}

      {profile.role !== "employee" && (
        <form
          method="get"
          className="slide-up relative z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <div className="min-w-56 flex-1">
            <EmployeeCombobox
              employees={employeeOptions}
              defaultValue={employeeFilter}
              placeholder="Semua karyawan"
              className=""
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="field w-44"
          >
            <option value="">Semua status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          <button className="action-button bg-blue-600 text-white hover:bg-blue-700">
            Terapkan
          </button>
          {(employeeFilter || statusFilter) && (
            <a
              href="?"
              className="action-button border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              Reset
            </a>
          )}
        </form>
      )}

      <div className="scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h3 className="font-semibold text-slate-900">Riwayat pengajuan</h3>
        </div>

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
          <div className="p-16 text-center">
            <ClipboardList className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              {employeeFilter || statusFilter
                ? "Tidak ada pengajuan yang cocok"
                : "Belum ada data"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Pengajuan yang dibuat akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requestsWithDocuments.map((request, index) => (
              <div
                key={request.id}
                className="table-row-hover slide-up flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ animationDelay: `${index * 40}ms` }}
              >
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
                  {request.document_path && (
                    <p className="mt-1 text-xs font-medium text-blue-600">
                      📎 {request.document_name ?? "Dokumen pendukung"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`badge ${request.status === "approved" ? "badge-success" : request.status === "rejected" ? "badge-danger" : ""}`}
                  >
                    {request.status === "pending"
                      ? "Menunggu"
                      : request.status === "approved"
                        ? "Disetujui"
                        : "Ditolak"}
                  </span>
                  <RequestDetailModal
                    request={{
                      id: request.id,
                      leave_type: request.leave_type,
                      start_date: request.start_date,
                      end_date: request.end_date,
                      reason: request.reason,
                      status: request.status,
                      note: request.note,
                      document_url: request.document_url,
                      document_name: request.document_name,
                      document_type: request.document_type,
                      employee_name: request.employee_name,
                    }}
                  />
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
