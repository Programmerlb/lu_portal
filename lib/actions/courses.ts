"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, canManageCourse } from "@/lib/permissions";
import { archiveCourseSchema, createCourseSchema, updateCourseSchema } from "@/lib/validators/courses";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createCourseAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) return { ok: false, error: gate.error };

  const doctorIds = formData.getAll("doctor_ids").map(String).filter(Boolean);
  const parsed = createCourseSchema.safeParse({
    semester_id: formData.get("semester_id"),
    code: formData.get("code"),
    name_en: formData.get("name_en"),
    name_ar: formData.get("name_ar"),
    description: formData.get("description"),
    credits: formData.get("credits") || undefined,
    doctor_ids: doctorIds,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { doctor_ids, ...courseData } = parsed.data;
  const { data: inserted, error } = await supabase
    .from("courses").insert(courseData).select("id").single();
  if (error) return { ok: false, error: error.message };

  if (doctor_ids.length > 0) {
    const rows = doctor_ids.map((id, i) => ({ course_id: inserted.id, doctor_id: id, is_primary: i === 0 }));
    const { error: e2 } = await supabase.from("course_doctors").insert(rows);
    if (e2) return { ok: false, error: e2.message };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true, id: inserted.id };
}

export async function updateCourseAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) return { ok: false, error: gate.error };

  const doctorIds = formData.getAll("doctor_ids").map(String).filter(Boolean);
  const parsed = updateCourseSchema.safeParse({
    id: formData.get("id"),
    semester_id: formData.get("semester_id") || undefined,
    code: formData.get("code") || undefined,
    name_en: formData.get("name_en") || undefined,
    name_ar: formData.get("name_ar"),
    description: formData.get("description"),
    credits: formData.get("credits") || undefined,
    doctor_ids: doctorIds,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, doctor_ids, ...updates } = parsed.data;
  const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  if (Object.keys(clean).length > 0) {
    const { error } = await supabase.from("courses").update(clean).eq("id", id);
    if (error) return { ok: false, error: error.message };
  }

  await supabase.from("course_doctors").delete().eq("course_id", id);
  if (doctor_ids && doctor_ids.length > 0) {
    await supabase.from("course_doctors").insert(
      doctor_ids.map((d, i) => ({ course_id: id, doctor_id: d, is_primary: i === 0 }))
    );
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${id}`);
  return { ok: true, id };
}

export async function deleteCourseAction(courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) return { ok: false, error: gate.error };
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true };
}

export async function archiveCourseAction(courseId: string, isArchived: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) return { ok: false, error: gate.error };
  const parsed = archiveCourseSchema.safeParse({ id: courseId, is_archived: isArchived });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { error } = await supabase
    .from("courses").update({ is_archived: parsed.data.is_archived }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true };
}

export async function ensureCourseManageable(courseId: string) {
  const supabase = await createClient();
  return { supabase, allowed: await canManageCourse(supabase, courseId) };
}
