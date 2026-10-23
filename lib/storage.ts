export const RESOURCE_BUCKET = "course-resources";

export function buildStoragePath(
  courseId: string,
  lectureId: string | null,
  originalName: string
): string {
  const folder = lectureId ?? "general";
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
  return `${courseId}/${folder}/${crypto.randomUUID()}-${safe}`;
}

export const SIGNED_URL_TTL_SECONDS = 60 * 60;
