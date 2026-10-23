"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  full_name_ar: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  student_id: z.string().trim().max(60),
});

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(_prev: ProfileActionResult | null, formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Your session has expired. Please sign in again." };

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    full_name_ar: formData.get("full_name_ar") ?? "",
    phone: formData.get("phone") ?? "",
    student_id: formData.get("student_id") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your profile details." };

  const { error } = await supabase.from("profiles").update({
    full_name: parsed.data.full_name,
    full_name_ar: parsed.data.full_name_ar || null,
    phone: parsed.data.phone || null,
    student_id: parsed.data.student_id || null,
  }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
