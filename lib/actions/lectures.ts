"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canManageCourse, getCurrentProfile } from "@/lib/permissions";
import { createLectureSchema } from "@/lib/validators/lectures";
import type { ActionResult } from "./courses";

export async function createLectureAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };

  const parsed = createLectureSchema.safeParse({
    course_id: formData.get("course_id"),
    title: formData.get("title"),
    title_ar: formData.get("title_ar"),
    description: formData.get("description"),
    week_number: formData.get("week_number") || undefined,
    lecture_date: formData.get("lecture_date") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { course_id, ...lectureData } = parsed.data;
  const allowed = await canManageCourse(supabase, course_id);
  if (!allowed) return { ok: false, error: "You cannot add lectures to this course" };

  const { data, error } = await supabase
    .from("lectures").insert({ ...lectureData, course_id, created_by: profile.id })
    .select("id").single();
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/courses/${course_id}`);
  return { ok: true, id: data.id };
}

export async function deleteLectureAction(lectureId: string, courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await canManageCourse(supabase, courseId))) return { ok: false, error: "Not allowed" };
  const { error } = await supabase.from("lectures").delete().eq("id", lectureId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}
