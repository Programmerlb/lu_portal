import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { CourseForm } from "@/components/courses/course-form";
import { createCourseAction } from "@/lib/actions/courses";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) redirect("/dashboard");

  const [{ data: semesters }, { data: doctors }] = await Promise.all([
    supabase.from("semesters")
      .select("id, name_en, academic_years(label), academic_programs(name_en)")
      .order("start_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email")
      .eq("role", "doctor").eq("is_active", true),
  ]);

  const semesterOptions = (semesters ?? []).map((s) => {
    const ay = (s as unknown as { academic_years: { label: string } | null }).academic_years;
    const prog = (s as unknown as { academic_programs: { name_en: string } | null }).academic_programs;
    return { id: s.id, label: `${prog?.name_en ?? "?"} — ${s.name_en} (${ay?.label ?? ""})` };
  });
  const doctorOptions = (doctors ?? []).map((d) => ({ id: d.id, label: d.full_name ?? d.email }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New course</h1>
      <CourseForm action={createCourseAction} semesters={semesterOptions}
        doctors={doctorOptions} submitLabel="Create course" />
    </div>
  );
}
