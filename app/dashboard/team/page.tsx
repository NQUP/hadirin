import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { Users, Mail, Hash } from "lucide-react";

export default async function TeamPage() {
  const profile = await requireProfile(["manager", "admin"]);
  const supabase = await createClient();
  const { data: team } = await supabase.from("profiles").select("employee_number, full_name, email, departments(name), positions(title)").eq("manager_id", profile.id).order("full_name");

  return (
    <section>
      <div className="slide-up mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <Users className="size-3.5" />
          Tim
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Anggota Tim Saya</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team?.map((member, index) => (
          <article key={member.employee_number} className={`card-hover slide-up stagger-${Math.min(index + 1, 8)} rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-sm">
                {member.full_name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{member.full_name}</h3>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <Hash className="size-3" />{member.employee_number}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm text-slate-600 truncate">
                <Mail className="size-3.5 shrink-0 text-slate-400" />{member.email}
              </p>
            </div>
          </article>
        ))}
        {!team?.length && (
          <div className="sm:col-span-2 xl:col-span-3 scale-in rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Users className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Belum ada anggota tim</p>
            <p className="mt-1 text-sm text-slate-500">Anggota tim yang ditetapkan akan muncul di sini.</p>
          </div>
        )}
      </div>
    </section>
  );
}
