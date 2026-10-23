import { describe, it, expect } from "vitest";
import { createCourseSchema } from "@/lib/validators/courses";
import { createLectureSchema } from "@/lib/validators/lectures";
import { validateUploadFile, sanitizeFileName, MAX_FILE_SIZE_BYTES, resourceMetaSchema } from "@/lib/validators/resources";

const UUID = "11111111-1111-1111-1111-111111111111";

describe("createCourseSchema", () => {
  it("accepts a minimal valid payload", () => {
    const r = createCourseSchema.safeParse({ semester_id: UUID, code: "MBA501", name_en: "X", doctor_ids: [] });
    expect(r.success).toBe(true);
  });
  it("rejects lowercase codes", () => {
    const r = createCourseSchema.safeParse({ semester_id: UUID, code: "mba 501!", name_en: "X", doctor_ids: [] });
    expect(r.success).toBe(false);
  });
  it("coerces credits from string", () => {
    const r = createCourseSchema.safeParse({ semester_id: UUID, code: "C1", name_en: "Course", credits: "3", doctor_ids: [] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.credits).toBe(3);
  });
});

describe("createLectureSchema", () => {
  it("turns empty date string into undefined", () => {
    const r = createLectureSchema.safeParse({ course_id: UUID, title: "Lecture", lecture_date: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lecture_date).toBeUndefined();
  });
  it("rejects malformed date", () => {
    const r = createLectureSchema.safeParse({ course_id: UUID, title: "L", lecture_date: "01/15/2026" });
    expect(r.success).toBe(false);
  });
});

describe("validateUploadFile", () => {
  it("accepts small PDF", () => {
    expect(validateUploadFile({ name: "n.pdf", size: 1024, type: "application/pdf" }).ok).toBe(true);
  });
  it("rejects empty", () => {
    expect(validateUploadFile({ name: "x.pdf", size: 0, type: "application/pdf" }).ok).toBe(false);
  });
  it("rejects over limit", () => {
    const c = validateUploadFile({ name: "big.pdf", size: MAX_FILE_SIZE_BYTES + 1, type: "application/pdf" });
    expect(c.ok).toBe(false);
  });
  it("rejects disallowed mime", () => {
    expect(validateUploadFile({ name: "e.exe", size: 10, type: "application/x-msdownload" }).ok).toBe(false);
  });
});

describe("sanitizeFileName", () => {
  it("strips path separators", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe(".._.._etc_passwd");
  });
});

describe("resourceMetaSchema", () => {
  it("accepts external URL only", () => {
    const r = resourceMetaSchema.safeParse({ course_id: UUID, title: "V", external_url: "https://example.com/v" });
    expect(r.success).toBe(true);
  });
  it("rejects bad URL", () => {
    const r = resourceMetaSchema.safeParse({ course_id: UUID, title: "V", external_url: "not-a-url" });
    expect(r.success).toBe(false);
  });
});
