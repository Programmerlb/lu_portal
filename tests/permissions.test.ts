import { describe, it, expect } from "vitest";
import { canManageCourse, requireRole } from "@/lib/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

function fakeSupabase(opts: {
  user: { id: string } | null;
  profile?: { id: string; role: string; program_id: string | null } | null;
  courseDoctorRow?: { course_id: string } | null;
}): SupabaseClient {
  return {
    auth: { getUser: async () => ({ data: { user: opts.user }, error: null }) },
    from: (table: string) => {
      const chain = {
        select: () => chain, eq: () => chain,
        single: async () => table === "profiles" ? { data: opts.profile, error: null } : { data: null, error: null },
        maybeSingle: async () => table === "course_doctors" ? { data: opts.courseDoctorRow, error: null } : { data: null, error: null },
      };
      return chain as unknown;
    },
  } as unknown as SupabaseClient;
}

describe("requireRole", () => {
  it("fails when not authenticated", async () => {
    const r = await requireRole(fakeSupabase({ user: null }), ["admin"]);
    expect(r.ok).toBe(false);
  });
  it("fails when role not allowed", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, profile: { id: "u1", role: "student", program_id: null } });
    const r = await requireRole(sb, ["admin"]);
    expect(r.ok).toBe(false);
  });
  it("passes for allowed role", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, profile: { id: "u1", role: "admin", program_id: null } });
    expect((await requireRole(sb, ["admin"])).ok).toBe(true);
  });
});

describe("canManageCourse", () => {
  it("true for admin", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, profile: { id: "u1", role: "admin", program_id: null } });
    expect(await canManageCourse(sb, "c1")).toBe(true);
  });
  it("true for assigned doctor", async () => {
    const sb = fakeSupabase({
      user: { id: "u1" }, profile: { id: "u1", role: "doctor", program_id: null },
      courseDoctorRow: { course_id: "c1" },
    });
    expect(await canManageCourse(sb, "c1")).toBe(true);
  });
  it("false for unassigned doctor", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, profile: { id: "u1", role: "doctor", program_id: null } });
    expect(await canManageCourse(sb, "c1")).toBe(false);
  });
  it("false for student", async () => {
    const sb = fakeSupabase({
      user: { id: "u1" }, profile: { id: "u1", role: "student", program_id: null },
      courseDoctorRow: { course_id: "c1" },
    });
    expect(await canManageCourse(sb, "c1")).toBe(false);
  });
});
