"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import type { ActionResult } from "./courses";

const isoDateTime = z.string().min(1);

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("").transform(() => undefined)),
  category: z.enum(["lecture","exam","quiz","assignment","holiday","closure","schedule_change","council","registration","other"]),
  starts_at: isoDateTime,
  ends_at: isoDateTime.optional().or(z.literal("").transform(() => undefined)),
  location: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  course_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  is_program_wide: z.union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional().transform((v) => v === "on" || v === "true"),
});

export async function createCalendarEventAction(fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  if (!["admin", "doctor"].includes(profile.role)) {
    return { ok: false, error: "Only admins and doctors can create calendar events" };
  }

  const parsed = createSchema.safeParse({
    title: fd.get("title"),
    description: fd.get("description"),
    category: fd.get("category"),
    starts_at: fd.get("starts_at"),
    ends_at: fd.get("ends_at"),
    location: fd.get("location"),
    course_id: fd.get("course_id") || "",
    is_program_wide: fd.get("is_program_wide"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  if (profile.role === "doctor") {
    if (!data.course_id) return { ok: false, error: "A course is required" };
    const { data: owns } = await supabase.from("course_doctors")
      .select("course_id").eq("course_id", data.course_id).eq("doctor_id", profile.id).maybeSingle();
    if (!owns) return { ok: false, error: "You do not teach this course" };
    data.is_program_wide = false;
  }

  const { data: inserted, error } = await supabase.from("calendar_events")
    .insert({
      ...data,
      starts_at: new Date(data.starts_at).toISOString(),
      ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
      created_by: profile.id,
    }).select("id").single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendar");
  return { ok: true, id: inserted.id };
}

export async function deleteCalendarEventAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  if (profile.role !== "admin") return { ok: false, error: "Admins only" };
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendar");
  return { ok: true };
}
