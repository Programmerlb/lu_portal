import { z } from "zod";
import { optionalTrimmed, trimmedString, uuidSchema } from "./common";

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

export function validateUploadFile(
  file: Pick<File, "size" | "type" | "name">
): { ok: true } | { ok: false; error: string } {
  if (!file.name || file.name.length > 255) return { ok: false, error: "Invalid file name" };
  if (file.size === 0) return { ok: false, error: "File is empty" };
  if (file.size > MAX_FILE_SIZE_BYTES)
    return { ok: false, error: `File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit` };
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMime))
    return { ok: false, error: `Unsupported file type: ${file.type || "unknown"}` };
  return { ok: true };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
}

export const resourceMetaSchema = z.object({
  course_id: uuidSchema,
  lecture_id: uuidSchema.optional(),
  title: trimmedString(2, 200),
  description: optionalTrimmed(2000),
  external_url: z.string().trim().url("Must be a valid URL").optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ResourceMetaInput = z.infer<typeof resourceMetaSchema>;
