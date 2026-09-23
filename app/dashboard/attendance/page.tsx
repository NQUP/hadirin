import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
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

  // Buat signed URL untuk selfie
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

      return {
        ...record,
        clockInPhoto,
        clockOutPhoto,
      };
    }),
  );

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600">Absensi</p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          {profile.role === "employee"
            ? "Riwayat Absensi Saya"
            : "Riwayat Absensi"}
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-250 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Tanggal</th>

                {profile.role !== "employee" && (
                  <th className="px-5 py-4">Karyawan</th>
                )}

                <th className="px-5 py-4">Masuk</th>

                <th className="px-5 py-4 text-center">Selfie Masuk</th>

                <th className="px-5 py-4">Pulang</th>

                <th className="px-5 py-4 text-center">Selfie Pulang</th>

                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recordsWithPhotos.map((record) => (
                <tr key={record.id} className="text-slate-700">
                  <td className="px-5 py-4">{record.attendance_date}</td>

                  {profile.role !== "employee" && (
                    <td className="px-5 py-4">
                      {(
                        record.profiles as unknown as {
                          full_name: string;
                        } | null
                      )?.full_name ?? "—"}
                    </td>
                  )}

                  {/* MASUK */}
                  <td className="px-5 py-4">
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

                  {/* SELFIE MASUK */}
                  <td className="px-5 py-4">
                    {record.clockInPhoto ? (
                      <SelfieActions
                        url={record.clockInPhoto}
                        title="Selfie Clock In"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* PULANG */}
                  <td className="px-5 py-4">
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

                  {/* SELFIE PULANG */}
                  <td className="px-5 py-4">
                    {record.clockOutPhoto ? (
                      <SelfieActions
                        url={record.clockOutPhoto}
                        title="Selfie Clock Out"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-4">
                    <span className="badge">
                      {record.status === "late" ? "Terlambat" : "Hadir"}
                    </span>
                  </td>
                </tr>
              ))}

              {!recordsWithPhotos.length && (
                <tr>
                  <td
                    colSpan={profile.role === "employee" ? 6 : 7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Belum ada data absensi.
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
