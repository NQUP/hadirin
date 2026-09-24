import { ClipboardList, Clock3 } from "lucide-react";
import { LeaveForm } from "@/components/dashboard/leave-form";
import { OvertimeActions } from "@/components/dashboard/overtime-actions";
import { OvertimeForm } from "@/components/dashboard/overtime-form";
import { RequestActions } from "@/components/dashboard/request-actions";
import { RequestDetailModal } from "@/components/dashboard/request-detail-modal";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function RequestsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase.from("leave_requests").select("*, profiles!leave_requests_employee_id_fkey(full_name, employee_number)").order("created_at", { ascending: false });
  if (profile.role === "employee") query = query.eq("employee_id", profile.id);
  const { data: requests, error } = await query;

  let overtimeQuery = supabase.from("overtime_requests").select("*, profiles!overtime_requests_employee_id_fkey(full_name, employee_number)").order("overtime_date", { ascending: false }).order("created_at", { ascending: false });
  if (profile.role === "employee") {
    overtimeQuery = overtimeQuery.eq("employee_id", profile.id);
  }

  if (profile.role === "manager") {
    const { data: team } = await supabase.from("profiles").select("id").eq("manager_id", profile.id);
    const employeeIds = (team ?? []).map((member) => member.id);
    overtimeQuery = overtimeQuery.in("employee_id", employeeIds.length ? employeeIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: overtimeRequests } = await overtimeQuery;

  const requestsWithDocuments = await Promise.all(
    (requests ?? []).map(async (request) => {
      let documentUrl: string | null = null;
      if (request.document_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("leave-documents").createSignedUrl(request.document_path, 60 * 10);
        if (signedUrlError) console.error("SIGNED URL ERROR:", { path: request.document_path, error: signedUrlError });
        else { documentUrl = signedUrlData?.signedUrl ?? null; console.log("SIGNED URL:", { path: request.document_path, url: documentUrl }); }
      }
      const employee = request.profiles as unknown as { full_name: string; employee_number?: string } | null;
      return { ...request, document_url: documentUrl, employee_name: employee?.full_name ?? null };
    })
  );

  return (
    <section className="space-y-7">
      <div className="slide-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <ClipboardList className="size-3.5" />
          Pengajuan
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {profile.role === "employee" ? "Ajukan Izin, Sakit, Cuti, dan Lembur" : "Pengajuan Tim"}
        </h2>
      </div>

      {profile.role === "employee" && (
        <div className="space-y-5">
          <div className="slide-up stagger-1"><LeaveForm /></div>
          <div className="slide-up stagger-2"><OvertimeForm /></div>
        </div>
      )}

      <div className="scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h3 className="font-semibold text-slate-900">Riwayat pengajuan</h3>
        </div>

        {error ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-700">Data tidak dapat dimuat</p>
            <p className="mt-1 text-sm text-slate-500">Muat ulang halaman untuk mencoba kembali.</p>
          </div>
        ) : !requestsWithDocuments.length ? (
          <div className="p-16 text-center">
            <ClipboardList className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Belum ada data</p>
            <p className="mt-1 text-sm text-slate-500">Pengajuan yang dibuat akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requestsWithDocuments.map((request, index) => (
              <div key={request.id} className={`table-row-hover slide-up flex flex-wrap items-center justify-between gap-3 px-5 py-4`} style={{ animationDelay: `${index * 40}ms` }}>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    {request.leave_type === "leave" ? "Cuti" : request.leave_type === "sick" ? "Sakit" : "Izin"}
                    {profile.role !== "employee" && ` · ${request.employee_name ?? ""}`}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {request.start_date} s.d. {request.end_date} · {request.reason}
                  </p>
                  {request.document_path && (
                    <p className="mt-1 text-xs font-medium text-blue-600">📎 {request.document_name ?? "Dokumen pendukung"}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`badge ${request.status === "approved" ? "badge-success" : request.status === "rejected" ? "badge-danger" : ""}`}>
                    {request.status === "pending" ? "Menunggu" : request.status === "approved" ? "Disetujui" : "Ditolak"}
                  </span>
                  <RequestDetailModal request={{ id: request.id, leave_type: request.leave_type, start_date: request.start_date, end_date: request.end_date, reason: request.reason, status: request.status, note: request.note, document_url: request.document_url, document_name: request.document_name, document_type: request.document_type, employee_name: request.employee_name }} />
                  {request.status === "pending" && profile.role !== "employee" && <RequestActions requestId={request.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 className="size-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Riwayat lembur</h3>
          </div>
        </div>

        {!overtimeRequests?.length ? (
          <div className="p-16 text-center">
            <Clock3 className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Belum ada pengajuan lembur</p>
            <p className="mt-1 text-sm text-slate-500">Data lembur yang diajukan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {overtimeRequests.map((request, index) => {
              const employeeName = (request.profiles as unknown as { full_name?: string } | null)?.full_name ?? null;
              const durationHours = calculateDuration(request.start_time, request.end_time);

              return (
                <div key={request.id} className={`table-row-hover slide-up flex flex-wrap items-center justify-between gap-3 px-5 py-4`} style={{ animationDelay: `${index * 40}ms` }}>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {profile.role === "employee" ? "Lembur" : `Lembur · ${employeeName ?? "Karyawan"}`}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {request.overtime_date} · {request.start_time} s.d. {request.end_time} · {durationHours} jam · {request.reason}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`badge ${request.status === "approved" ? "badge-success" : request.status === "rejected" ? "badge-danger" : ""}`}>
                      {request.status === "pending" ? "Menunggu" : request.status === "approved" ? "Disetujui" : "Ditolak"}
                    </span>
                    {request.status === "pending" && profile.role !== "employee" && <OvertimeActions requestId={request.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function calculateDuration(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "0";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const diff = Math.max(0, endMinutes - startMinutes);

  return (diff / 60).toFixed(1);
}
