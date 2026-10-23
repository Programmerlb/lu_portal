import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { CourseForm } from "@/components/courses/course-form";
import { updateCourseAction } from "@/lib/actions/courses";

type Params = { params: Promise<{ courseId: string }> };

export default async function EditCoursePage({ params }: Params) {
  const { courseId } = await params;
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) redirect("/dashboard");

  const [{ data: course }, { data: assignments }, { data: semesters }, { data: doctors }] =
    await Promise.all([
      supabase.from("courses")
        .select("id, semester_id, code, name_en, name_ar, description, credits")
        .eq("id", courseId).single(),
      supabase.from("course_doctors").select("doctor_id").eq("course_id", courseId),
      supabase.from("semesters")
        .select("id, name_en, academic_years(label), academic_programs(name_en)")
        .order("start_date", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email")
        .eq("role", "doctor").eq("is_active", true),
    ]);

  if (!course) notFound();

  const semesterOptions = (semesters ?? []).map((s) => {
    const ay = (s as unknown as { academic_years: { label: string } | null }).academic_years;
    const prog = (s as unknown as { academic_programs: { name_en: string } | null }).academic_programs;
    return { id: s.id, label: `${prog?.name_en ?? "?"} — ${s.name_en} (${ay?.label ?? ""})` };
  });
  const doctorOptions = (doctors ?? []).map((d) => ({ id: d.id, label: d.full_name ?? d.email }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit course</h1>
      <CourseForm action={updateCourseAction} semesters={semesterOptions}
        doctors={doctorOptions}
        defaults={{
          id: course.id, semester_id: course.semester_id, code: course.code,
          name_en: course.name_en, name_ar: course.name_ar,
          description: course.description, credits: course.credits,
          doctor_ids: (assignments ?? []).map((a) => a.doctor_id),
        }}
        submitLabel="Save changes" />
    </div>
  );
}
