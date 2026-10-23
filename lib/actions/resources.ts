"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canManageCourse, getCurrentProfile } from "@/lib/permissions";
import { resourceMetaSchema, sanitizeFileName, validateUploadFile } from "@/lib/validators/resources";
import { buildStoragePath, RESOURCE_BUCKET } from "@/lib/storage";
import type { ActionResult } from "./courses";

export async function uploadResourceAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };

  const parsed = resourceMetaSchema.safeParse({
    course_id: formData.get("course_id"),
    lecture_id: formData.get("lecture_id") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    external_url: formData.get("external_url") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const meta = parsed.data;

  const allowed = await canManageCourse(supabase, meta.course_id);
  if (!allowed) return { ok: false, error: "You cannot upload to this course" };

  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !meta.external_url) return { ok: false, error: "Provide a file or an external URL" };

  let storagePath: string | null = null;
  let mimeType: string | null = null;
  let fileSize: number | null = null;

  if (hasFile) {
    const f = file as File;
    const check = validateUploadFile(f);
    if (!check.ok) return { ok: false, error: check.error };
    storagePath = buildStoragePath(meta.course_id, meta.lecture_id ?? null, sanitizeFileName(f.name));
    const { error: upErr } = await supabase.storage
      .from(RESOURCE_BUCKET).upload(storagePath, f, { contentType: f.type, upsert: false });
    if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };
    mimeType = f.type;
    fileSize = f.size;
  }

  const { data, error } = await supabase
    .from("resources").insert({
      course_id: meta.course_id,
      lecture_id: meta.lecture_id ?? null,
      title: meta.title,
      description: meta.description ?? null,
      external_url: meta.external_url ?? null,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size_bytes: fileSize,
      uploaded_by: profile.id,
    }).select("id").single();

  if (error) {
    if (storagePath) await supabase.storage.from(RESOURCE_BUCKET).remove([storagePath]);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/courses/${meta.course_id}`);
  return { ok: true, id: data.id };
}

export async function deleteResourceAction(resourceId: string, courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await canManageCourse(supabase, courseId))) return { ok: false, error: "Not allowed" };
  const { data: row } = await supabase.from("resources").select("storage_path").eq("id", resourceId).single();
  const { error } = await supabase.from("resources").delete().eq("id", resourceId);
  if (error) return { ok: false, error: error.message };
  if (row?.storage_path) await supabase.storage.from(RESOURCE_BUCKET).remove([row.storage_path]);
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

export async function getSignedUrlAction(resourceId: string):
  Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("resources").select("storage_path, external_url").eq("id", resourceId).single();
  if (error || !row) return { ok: false, error: "Resource not found" };
  if (!row.storage_path && row.external_url) return { ok: true, url: row.external_url };
  if (!row.storage_path) return { ok: false, error: "No file associated" };
  const { data, error: sErr } = await supabase.storage
    .from(RESOURCE_BUCKET).createSignedUrl(row.storage_path, 60 * 60);
  if (sErr || !data) return { ok: false, error: sErr?.message ?? "Could not sign URL" };
  return { ok: true, url: data.signedUrl };
}
