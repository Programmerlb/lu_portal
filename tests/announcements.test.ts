import { describe, it, expect } from "vitest";
import { createAnnouncementSchema } from "@/lib/validators/announcements";

const UUID = "11111111-1111-1111-1111-111111111111";

describe("createAnnouncementSchema", () => {
  it("accepts a minimal valid draft", () => {
    const r = createAnnouncementSchema.safeParse({
      category: "official", title: "Notice", body: "Read carefully.",
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty title", () => {
    const r = createAnnouncementSchema.safeParse({ category: "official", title: "", body: "Body" });
    expect(r.success).toBe(false);
  });
  it("rejects unknown category", () => {
    const r = createAnnouncementSchema.safeParse({ category: "bogus", title: "T", body: "B" });
    expect(r.success).toBe(false);
  });
  it("accepts valid course_id", () => {
    const r = createAnnouncementSchema.safeParse({
      category: "doctor", title: "T", body: "B", course_id: UUID,
    });
    expect(r.success).toBe(true);
  });
  it("rejects invalid course_id", () => {
    const r = createAnnouncementSchema.safeParse({
      category: "doctor", title: "T", body: "B", course_id: "not-a-uuid",
    });
    expect(r.success).toBe(false);
  });
  it("transforms checkbox 'on' → true", () => {
    const r = createAnnouncementSchema.safeParse({
      category: "official", title: "T", body: "B", requires_acknowledgment: "on",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.requires_acknowledgment).toBe(true);
  });
  it("rejects invalid source_url", () => {
    const r = createAnnouncementSchema.safeParse({
      category: "majles_tolab", title: "T", body: "B", source_url: "not a url",
    });
    expect(r.success).toBe(false);
  });
});
