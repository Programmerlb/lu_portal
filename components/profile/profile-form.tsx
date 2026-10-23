"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { ProfileActionResult } from "@/lib/actions/profile";

export function ProfileForm({ action, defaults }: {
  action: (prev: ProfileActionResult | null, data: FormData) => Promise<ProfileActionResult>;
  defaults: { full_name: string; full_name_ar: string; phone: string; student_id: string };
}) {
  const [state, formAction, pending] = useActionState<ProfileActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <div><Label htmlFor="full_name">Full name *</Label><Input id="full_name" name="full_name" required minLength={2} maxLength={120} defaultValue={defaults.full_name} /></div>
      <div><Label htmlFor="full_name_ar">Arabic name</Label><Input id="full_name_ar" name="full_name_ar" maxLength={120} dir="rtl" defaultValue={defaults.full_name_ar} /></div>
      <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" maxLength={40} defaultValue={defaults.phone} /></div>
      <div><Label htmlFor="student_id">Student ID</Label><Input id="student_id" name="student_id" maxLength={60} defaultValue={defaults.student_id} /></div>
      {state && !state.ok && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profile updated successfully.</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
