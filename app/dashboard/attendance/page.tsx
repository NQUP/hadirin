import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { CalendarClock } from "lucide-react";
import SelfieActions from "./selfie-actions";

export default async function AttendancePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("attendance")
    .select(
      "*, profiles!attendance_employee_id_fkey(full_name, employee_number)",
    )
    .order("attendance_date", { ascending: false })
    .limit(50);

  if (profile.role === "employee") {
    query = query.eq("employee_id", profile.id);
  }

  const { data: records } = await query;

  const recordsWithPhotos = await Promise.all(
    (records ?? []).map(async (record) => {
      let clockInPhoto = null;
      let clockOutPhoto = null;
      if (record.clock_in_selfie_url) {
        const { data } = await supabase.storage
          .from("attendance-selfies")
          .createSignedUrl(record.clock_in_selfie_url, 60 * 60);
        clockInPhoto = data?.signedUrl ?? null;
      }
      if (record.clock_out_selfie_url) {
        const { data } = await supabase.storage
          .from("attendance-selfies")
          .createSignedUrl(record.clock_out_selfie_url, 60 * 60);
        clockOutPhoto = data?.signedUrl ?? null;
      }
      return { ...record, clockInPhoto, clockOutPhoto };
    }),
  );

  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <CalendarClock className="size-3.5" />
          Absensi
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {profile.role === "employee"
            ? "Riwayat Absensi Saya"
            : "Riwayat Absensi"}
        </h2>
      </div>

      <div className="scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-250 text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-white text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Tanggal</th>
                {profile.role !== "employee" && (
                  <th className="px-5 py-4 font-semibold">Karyawan</th>
                )}
                <th className="px-5 py-4 text-center font-semibold">Masuk</th>
                <th className="px-5 py-4 text-center font-semibold">
                  Selfie Masuk
                </th>
                <th className="px-5 py-4 text-center font-semibold">Pulang</th>
                <th className="px-5 py-4 text-center font-semibold">
                  Selfie Pulang
                </th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recordsWithPhotos.map((record, index) => (
                <tr
                  key={record.id}
                  className={`table-row-hover slide-up text-slate-700`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-5 py-4 font-medium">
                    {record.attendance_date}
                  </td>
                  {profile.role !== "employee" && (
                    <td className="px-5 py-4">
                      {(
                        record.profiles as unknown as {
                          full_name: string;
                        } | null
                      )?.full_name ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-4 text-center">
                    {record.clock_in_at
                      ? new Date(record.clock_in_at).toLocaleTimeString(
                          "id-ID",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          },
                        )
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {record.clockInPhoto ? (
                      <SelfieActions
                        url={record.clockInPhoto}
                        title="Selfie Clock In"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {record.clock_out_at
                      ? new Date(record.clock_out_at).toLocaleTimeString(
                          "id-ID",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          },
                        )
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {record.clockOutPhoto ? (
                      <SelfieActions
                        url={record.clockOutPhoto}
                        title="Selfie Clock Out"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`badge ${record.status === "late" ? "badge-warning" : "badge-success"}`}
                    >
                      {record.status === "late" ? "Terlambat" : "Hadir"}
                    </span>
                  </td>
                </tr>
              ))}
              {!recordsWithPhotos.length && (
                <tr>
                  <td
                    colSpan={profile.role === "employee" ? 6 : 7}
                    className="px-5 py-16 text-center"
                  >
                    <CalendarClock className="mx-auto size-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">
                      Belum ada data absensi
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Riwayat absensi akan muncul di sini.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
