import { createAdminClient } from "@/utils/supabase/admin";

type RequestKind = "leave" | "overtime";
type LeaveType = "permission" | "sick" | "leave";

const leaveLabels: Record<LeaveType, string> = { permission: "izin", sick: "sakit", leave: "cuti" };

export async function notifyRequestSubmitted({ kind, requestId, employeeId, date, leaveType }: { kind: RequestKind; requestId: string; employeeId: string; date: string; leaveType?: LeaveType }) {
  try {
    const admin = createAdminClient();
    const { data: employee } = await admin.from("profiles").select("full_name, manager_id").eq("id", employeeId).single();
    if (!employee) return;

    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin").eq("is_active", true);
    const recipientIds = [...new Set([employee.manager_id, ...(admins ?? []).map((item) => item.id)].filter((id): id is string => Boolean(id)))];
    const label = kind === "overtime" ? "lembur" : leaveLabels[leaveType ?? "permission"];
    await insertNotifications(recipientIds.map((recipientId) => ({
      recipient_id: recipientId,
      type: `${kind}.submitted`,
      title: `Pengajuan ${label} baru`,
      message: `${employee.full_name} mengajukan ${label} untuk ${formatDate(date)}.`,
      body: `${employee.full_name} mengajukan ${label} untuk ${formatDate(date)}.`,
      link: "/dashboard/requests",
      href: "/dashboard/requests",
      event_key: `${kind}:${requestId}:submitted`,
    })));
  } catch (error) {
    console.error("Create request notification:", error);
  }
}

export async function notifyRequestReviewed({ kind, requestId, employeeId, status, date, leaveType }: { kind: RequestKind; requestId: string; employeeId: string; status: "approved" | "rejected"; date: string; leaveType?: LeaveType }) {
  try {
    const label = kind === "overtime" ? "lembur" : leaveLabels[leaveType ?? "permission"];
    const approved = status === "approved";
    await insertNotifications([{
      recipient_id: employeeId,
      type: `${kind}.${status}`,
      title: `Pengajuan ${label} ${approved ? "disetujui" : "ditolak"}`,
      message: `${label[0].toUpperCase()}${label.slice(1)} tanggal ${formatDate(date)} telah ${approved ? "disetujui" : "ditolak"}.`,
      body: `${label[0].toUpperCase()}${label.slice(1)} tanggal ${formatDate(date)} telah ${approved ? "disetujui" : "ditolak"}.`,
      link: "/dashboard/requests",
      href: "/dashboard/requests",
      event_key: `${kind}:${requestId}:${status}`,
    }]);
  } catch (error) {
    console.error("Create review notification:", error);
  }
}

async function insertNotifications(rows: Array<{ recipient_id: string; type: string; title: string; message: string; body: string; link: string; href: string; event_key: string }>) {
  if (!rows.length) return;
  const admin = createAdminClient();
  const eventKeys = rows.map((row) => row.event_key);
  const { data: existing, error: existingError } = await admin.from("notifications").select("recipient_id, event_key").in("event_key", eventKeys);
  if (existingError) throw existingError;

  const existingKeys = new Set((existing ?? []).map((row) => `${row.recipient_id}:${row.event_key}`));
  const newRows = rows.filter((row) => !existingKeys.has(`${row.recipient_id}:${row.event_key}`));
  if (!newRows.length) return;

  const { error } = await admin.from("notifications").insert(newRows);
  if (error) throw error;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T00:00:00+07:00`));
}