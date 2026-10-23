"use client";

import { useActionState } from "react";
import { createCalendarEventAction } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import type { ActionResult } from "@/lib/actions/courses";
import type { Role } from "@/lib/constants";

type State = ActionResult | null;
const ALL_CATEGORIES = ["lecture","exam","quiz","assignment","holiday","closure","schedule_change","council","registration","other"] as const;

export function CalendarEventForm({ role, courses }: {
  role: Role; courses: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, fd) => createCalendarEventAction(fd), null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <select id="category" name="category" required
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          {ALL_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="starts_at">Starts *</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div>
          <Label htmlFor="ends_at">Ends</Label>
          <Input id="ends_at" name="ends_at" type="datetime-local" />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" maxLength={200} />
      </div>
      <div>
        <Label htmlFor="course_id">{role === "doctor" ? "Course *" : "Course (optional)"}</Label>
        <select id="course_id" name="course_id" required={role === "doctor"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">— Program-wide —</option>
          {courses.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
        </select>
      </div>
      {role === "admin" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_program_wide" defaultChecked /> Show to all programs
        </label>
      )}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} maxLength={4000} />
      </div>
      {state && !state.ok && <FormError message={state.error} />}
      {state && state.ok && (
        <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Event created.</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Create event"}</Button>
    </form>
  );
}
