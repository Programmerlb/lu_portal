import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "@/lib/constants";

export async function getCurrentProfile(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, program_id, full_name, email")
    .eq("id", user.id)
    .single();
  return data as
    | { id: string; role: Role; program_id: string | null; full_name: string | null; email: string }
    | null;
}

export async function requireRole(
  supabase: SupabaseClient,
  allowed: Role[]
): Promise<
  | { ok: true; profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>> }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "Not authenticated" };
  if (!allowed.includes(profile.role))
    return { ok: false, error: "You do not have permission for this action" };
  return { ok: true, profile };
}

export async function canManageCourse(supabase: SupabaseClient, courseId: string): Promise<boolean> {
  const profile = await getCurrentProfile(supabase);
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.role !== "doctor") return false;
  const { data } = await supabase
    .from("course_doctors")
    .select("course_id")
    .eq("course_id", courseId)
    .eq("doctor_id", profile.id)
    .maybeSingle();
  return !!data;
}
