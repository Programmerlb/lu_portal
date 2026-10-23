import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { createSemesterAction, updateSemesterAction } from "@/lib/actions/semesters";
import { SemesterForm } from "@/components/semesters/semester-form";

export default async function AdminSemestersPage() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) redirect("/dashboard");

  const [{ data: semesters, error: semesterError }, { data: programs }, { data: years }] = await Promise.all([
    supabase.from("semesters").select("id, program_id, academic_year_id, number, name_en, name_ar, start_date, end_date, registration_start, registration_end, exam_start, exam_end, status, academic_programs(name_en), academic_years(label)").order("start_date", { ascending: false }),
    supabase.from("academic_programs").select("id, name_en, name_ar").eq("is_active", true).order("name_en"),
    supabase.from("academic_years").select("id, label").order("start_date", { ascending: false }),
  ]);

  const programOptions = (programs ?? []).map((p) => ({ id: p.id, label: `${p.name_en} / ${p.name_ar}` }));
  const yearOptions = (years ?? []).map((y) => ({ id: y.id, label: y.label }));
  const rows = (semesters ?? []) as Array<{
    id: string; program_id: string; academic_year_id: string; number: number; name_en: string; name_ar: string;
    start_date: string; end_date: string; registration_start: string | null; registration_end: string | null;
    exam_start: string | null; exam_end: string | null; status: "upcoming" | "active" | "archived";
    academic_programs: { name_en: string } | null; academic_years: { label: string } | null;
  }>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-semibold">Semester management</h1>
        <p className="mt-1 text-sm text-slate-500">Create and update semester dates, academic year, program and status.</p>
      </div>
      {semesterError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">Could not load semesters: {semesterError.message}</p>}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create semester</h2>
        {programOptions.length === 0 || yearOptions.length === 0
          ? <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Create at least one active academic program and one academic year before adding a semester.</p>
          : <SemesterForm action={createSemesterAction} programs={programOptions} years={yearOptions} submitLabel="Create semester" />}
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Existing semesters ({rows.length})</h2>
        {rows.length === 0 && <p className="text-sm text-slate-500">No semesters found.</p>}
        {rows.map((s) => (
          <details key={s.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <summary className="cursor-pointer font-medium">{s.name_en} — {s.academic_years?.label ?? "Unknown year"} · {s.academic_programs?.name_en ?? "Unknown program"} · {s.status}</summary>
            <div className="mt-4">
              <SemesterForm action={updateSemesterAction} programs={programOptions} years={yearOptions}
                submitLabel="Save changes" defaults={{...s, registration_start: s.registration_start, registration_end: s.registration_end, exam_start: s.exam_start, exam_end: s.exam_end}} />
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
