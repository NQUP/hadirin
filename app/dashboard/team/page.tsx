import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function TeamPage() {
  const profile = await requireProfile(["manager", "admin"]); const supabase = await createClient(); const { data: team } = await supabase.from("profiles").select("employee_number, full_name, email, departments(name), positions(title)").eq("manager_id", profile.id).order("full_name");
  return <section><p className="text-sm font-medium text-blue-600">Tim</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Anggota Tim Saya</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{team?.map((member) => <article key={member.employee_number} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="grid size-10 place-items-center rounded-full bg-blue-50 font-semibold text-blue-700">{member.full_name.slice(0, 1)}</div><h3 className="mt-4 font-semibold text-slate-900">{member.full_name}</h3><p className="mt-1 text-sm text-slate-500">{member.employee_number} · {member.email}</p></article>)}{!team?.length && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">Belum ada anggota tim yang ditetapkan.</p>}</div></section>;
}
