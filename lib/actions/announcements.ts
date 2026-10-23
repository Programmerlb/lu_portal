"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { createAnnouncementSchema } from "@/lib/validators/announcements";
import { sanitizeFileName, validateUploadFile } from "@/lib/validators/resources";
import type { ActionResult } from "./courses";

const ATTACHMENT_BUCKET = "announcement-attachments";

async function isCourseDoctor(
  supabase: Awaited<ReturnType<typeof createClient>>, courseId: string, doctorId: string
): Promise<boolean> {
  const { data } = await supabase.from("course_doctors")
    .select("course_id").eq("course_id", courseId).eq("doctor_id", doctorId).maybeSingle();
  return !!data;
}

export async function createAnnouncementAction(fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  if (!["admin", "doctor", "representative"].includes(profile.role)) {
    return { ok: false, error: "You are not authorized to publish announcements" };
  }

  const parsed = createAnnouncementSchema.safeParse({
    category: fd.get("category"),
    title: fd.get("title"),
    body: fd.get("body"),
    priority: fd.get("priority") || "normal",
    target_audience: fd.get("target_audience") || "program",
    course_id: fd.get("course_id") || undefined,
    source_name: fd.get("source_name") || "",
    source_url: fd.get("source_url") || "",
    requires_acknowledgment: fd.get("requires_acknowledgment"),
    is_pinned: fd.get("is_pinned"),
    expires_at: fd.get("expires_at") || "",
    status: fd.get("status") || "draft",
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (profile.role === "doctor") {
    if (data.category !== "doctor") return { ok: false, error: "Doctors may only publish course announcements" };
    if (!data.course_id) return { ok: false, error: "A course is required" };
    if (!(await isCourseDoctor(supabase, data.course_id, profile.id))) {
      return { ok: false, error: "You do not teach this course" };
    }
    data.target_audience = "course";
  } else if (profile.role === "representative") {
    if (!["representative", "majles_tolab"].includes(data.category)) {
      return { ok: false, error: "Representatives may only publish class or Majles al-Tolab announcements" };
    }
  }
  if (data.course_id) data.target_audience = "course";
  if (data.category === "urgent" && profile.role !== "admin") {
    return { ok: false, error: "Only administrators can mark announcements as urgent" };
  }

  const { data: inserted, error } = await supabase.from("announcements")
    .insert({
      ...data, author_id: profile.id,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    }).select("id").single();
  if (error) return { ok: false, error: error.message };

  const file = fd.get("attachment");
  if (file instanceof File && file.size > 0) {
    const check = validateUploadFile(file);
    if (!check.ok) {
      await supabase.from("announcements").delete().eq("id", inserted.id);
      return { ok: false, error: check.error };
    }
    const path = `${inserted.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from(ATTACHMENT_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      await supabase.from("announcements").delete().eq("id", inserted.id);
      return { ok: false, error: `Upload failed: ${upErr.message}` };
    }
    await supabase.from("announcements").update({ attachment_path: path }).eq("id", inserted.id);
  }

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  return { ok: true, id: inserted.id };
}

export async function updateAnnouncementAction(fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  const id = String(fd.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing id" };

  const { data: existing } = await supabase.from("announcements")
    .select("author_id, status").eq("id", id).single();
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.author_id !== profile.id && profile.role !== "admin") {
    return { ok: false, error: "Not authorized" };
  }

  const parsed = createAnnouncementSchema.safeParse({
    category: fd.get("category"),
    title: fd.get("title"),
    body: fd.get("body"),
    priority: fd.get("priority") || "normal",
    target_audience: fd.get("target_audience") || "program",
    course_id: fd.get("course_id") || undefined,
    source_name: fd.get("source_name") || "",
    source_url: fd.get("source_url") || "",
    requires_acknowledgment: fd.get("requires_acknowledgment"),
    is_pinned: fd.get("is_pinned"),
    expires_at: fd.get("expires_at") || "",
    status: fd.get("status") || existing.status,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  if (data.course_id) data.target_audience = "course";
  const becamePublished = data.status === "published" && existing.status !== "published";

  const { error } = await supabase.from("announcements")
    .update({ ...data, published_at: becamePublished ? new Date().toISOString() : undefined })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/announcements");
  revalidatePath(`/announcements/${id}`);
  revalidatePath("/admin/announcements");
  return { ok: true, id };
}

export async function publishAnnouncementAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  const { data: existing } = await supabase.from("announcements")
    .select("author_id, status").eq("id", id).single();
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.author_id !== profile.id && profile.role !== "admin") {
    return { ok: false, error: "Not authorized" };
  }
  if (existing.status === "published") return { ok: true };
  const { error } = await supabase.from("announcements")
    .update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${id}`);
  revalidatePath("/admin/announcements");
  return { ok: true };
}

export async function archiveAnnouncementAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  const { error } = await supabase.from("announcements").update({ status: "archived" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  if (profile.role !== "admin") return { ok: false, error: "Admins only" };
  const { data: row } = await supabase.from("announcements").select("attachment_path").eq("id", id).single();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (row?.attachment_path) await supabase.storage.from(ATTACHMENT_BUCKET).remove([row.attachment_path]);
  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  return { ok: true };
}

export async function markAnnouncementReadAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  if (!["student", "representative"].includes(profile.role)) return { ok: true };
  await supabase.from("announcement_reads").upsert(
    { announcement_id: id, user_id: profile.id },
    { onConflict: "announcement_id,user_id", ignoreDuplicates: true }
  );
  revalidatePath("/announcements");
  return { ok: true };
}

export async function acknowledgeAnnouncementAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  const { error } = await supabase.from("announcement_reads").upsert(
    { announcement_id: id, user_id: profile.id, acknowledged: true, acknowledged_at: new Date().toISOString() },
    { onConflict: "announcement_id,user_id" }
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${id}`);
  return { ok: true };
}

export async function getAnnouncementAttachmentUrlAction(announcementId: string):
  Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("announcements")
    .select("attachment_path").eq("id", announcementId).single();
  if (!row?.attachment_path) return { ok: false, error: "No attachment" };
  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET).createSignedUrl(row.attachment_path, 60 * 60);
  if (error || !data) return { ok: false, error: error?.message ?? "Could not sign URL" };
  return { ok: true, url: data.signedUrl };
}
