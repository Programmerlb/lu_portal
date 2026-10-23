"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./courses";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const isoTime = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM");

const createSchema = z.object({
  schedule_entry_id: z.string().uuid(),
  course_id: z.string().uuid(),
  request_type: z.enum(["reschedule", "cancel", "room_change", "doctor_change", "replacement", "additional"]),
  original_date: isoDate,
  original_start_time: isoTime.optional(),
  original_end_time: isoTime.optional(),
  proposed_date: isoDate.optional(),
  proposed_start_time: isoTime.optional(),
  proposed_end_time: isoTime.optional(),
  proposed_room: z.string().trim().max(100).optional(),
  proposed_doctor_id: z.string().uuid().optional(),
  proposed_online_link: z.string().url().optional(),
  reason: z.string().trim().min(3).max(2000),
});

export async function createChangeRequestAction(fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const emptyToUndef = (v: FormDataEntryValue | null) =>
    v === null || v === "" ? undefined : String(v);

  const parsed = createSchema.safeParse({
    schedule_entry_id: fd.get("schedule_entry_id"),
    course_id: fd.get("course_id"),
    request_type: fd.get("request_type"),
    original_date: fd.get("original_date"),
    original_start_time: emptyToUndef(fd.get("original_start_time")),
    original_end_time: emptyToUndef(fd.get("original_end_time")),
    proposed_date: emptyToUndef(fd.get("proposed_date")),
    proposed_start_time: emptyToUndef(fd.get("proposed_start_time")),
    proposed_end_time: emptyToUndef(fd.get("proposed_end_time")),
    proposed_room: emptyToUndef(fd.get("proposed_room")),
    proposed_doctor_id: emptyToUndef(fd.get("proposed_doctor_id")),
    proposed_online_link: emptyToUndef(fd.get("proposed_online_link")),
    reason: fd.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { request_type, proposed_date, proposed_start_time, proposed_end_time } = parsed.data;
  if ((request_type === "reschedule" || request_type === "replacement")
      && (!proposed_start_time || !proposed_end_time)) {
    return { ok: false, error: "Proposed start and end times are required" };
  }
  if (request_type === "additional" && (!proposed_date || !proposed_start_time || !proposed_end_time)) {
    return { ok: false, error: "Date, start and end times are required for additional sessions" };
  }

  const { data, error } = await supabase
    .from("schedule_change_requests")
    .insert({ ...parsed.data, requested_by: user.id, status: "pending_doctor" })
    .select("id").single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/schedule/changes");
  return { ok: true, id: data.id };
}

type RpcResult = { ok: true } | { ok: false; error: string };

export async function confirmChangeRequestAction(id: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_schedule_change", { request_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/schedule/changes");
  revalidatePath(`/schedule/changes/${id}`);
  revalidatePath("/schedule/today");
  revalidatePath("/schedule/tomorrow");
  return { ok: true };
}

export async function approveChangeRequestAction(id: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_schedule_change", { request_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/schedule/changes");
  revalidatePath(`/schedule/changes/${id}`);
  return { ok: true };
}

export async function publishChangeRequestAction(id: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_schedule_change", { request_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/schedule/changes");
  revalidatePath(`/schedule/changes/${id}`);
  revalidatePath("/schedule/today");
  revalidatePath("/schedule/tomorrow");
  return { ok: true };
}

export async function rejectChangeRequestAction(id: string, reason: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_schedule_change", { request_id: id, reason });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/schedule/changes");
  revalidatePath(`/schedule/changes/${id}`);
  return { ok: true };
}
