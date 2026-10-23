"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";

const semesterSchema = z.object({
  program_id: z.string().uuid("Select an academic program"),
  academic_year_id: z.string().uuid("Select an academic year"),
  number: z.coerce.number().int().min(1).max(4),
  name_en: z.string().trim().min(2).max(160),
  name_ar: z.string().trim().min(2).max(160),
  start_date: z.string().date(),
  end_date: z.string().date(),
  registration_start: z.string().optional(),
  registration_end: z.string().optional(),
  exam_start: z.string().optional(),
  exam_end: z.string().optional(),
  status: z.enum(["upcoming", "active", "archived"]),
}).superRefine((v, ctx) => {
  if (v.end_date <= v.start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["end_date"], message: "End date must be after start date" });
  }
  if (v.registration_start && v.registration_end && v.registration_end < v.registration_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["registration_end"], message: "Registration end must not be before its start" });
  }
  if (v.exam_start && v.exam_end && v.exam_end < v.exam_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["exam_end"], message: "Exam end must not be before its start" });
  }
});

export type SemesterActionResult = { ok: true; id?: string } | { ok: false; error: string };

function readForm(formData: FormData) {
  const optionalDate = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || undefined;
  };
  return semesterSchema.safeParse({
    program_id: formData.get("program_id"),
    academic_year_id: formData.get("academic_year_id"),
    number: formData.get("number"),
    name_en: formData.get("name_en"),
    name_ar: formData.get("name_ar"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    registration_start: optionalDate("registration_start"),
    registration_end: optionalDate("registration_end"),
    exam_start: optionalDate("exam_start"),
    exam_end: optionalDate("exam_end"),
    status: formData.get("status"),
  });
}

function databaseValues(value: z.infer<typeof semesterSchema>) {
  return {
    ...value,
    registration_start: value.registration_start || null,
    registration_end: value.registration_end || null,
    exam_start: value.exam_start || null,
    exam_end: value.exam_end || null,
  };
}

export async function createSemesterAction(_prev: SemesterActionResult | null, formData: FormData): Promise<SemesterActionResult> {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) return { ok: false, error: gate.error };
  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the semester details." };

  const { data, error } = await supabase.from("semesters").insert(databaseValues(parsed.data)).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/semesters");
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true, id: data.id };
}

export async function updateSemesterAction(_prev: SemesterActionResult | null, formData: FormData): Promise<SemesterActionResult> {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) return { ok: false, error: gate.error };
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid semester ID." };
  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the semester details." };

  const { data, error } = await supabase.from("semesters").update(databaseValues(parsed.data)).eq("id", id.data).select("id").maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Semester was not found or you do not have permission to update it." };
  revalidatePath("/admin/semesters");
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true, id: data.id };
}
