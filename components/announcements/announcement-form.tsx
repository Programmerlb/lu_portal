"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import type { ActionResult } from "@/lib/actions/courses";
import type { Role } from "@/lib/constants";

type State = ActionResult | null;

const ALL_CATEGORIES = [
  { value: "official", label: "Official administration" },
  { value: "doctor", label: "Doctor" },
  { value: "representative", label: "Representative" },
  { value: "majles_tolab", label: "Majles al-Tolab" },
  { value: "urgent", label: "Urgent" },
  { value: "course", label: "Course" },
];

export interface CourseOption { id: string; label: string; }
export interface AnnouncementDefaults {
  id?: string; category?: string; title?: string; body?: string;
  priority?: "normal" | "high" | "urgent";
  target_audience?: "program" | "course" | "all";
  course_id?: string | null;
  source_name?: string | null; source_url?: string | null;
  requires_acknowledgment?: boolean; is_pinned?: boolean;
  expires_at?: string | null; status?: "draft" | "published";
}

export function AnnouncementForm({ action, role, courses, defaults, submitLabel }: {
  action: (fd: FormData) => Promise<ActionResult>;
  role: Role; courses: CourseOption[]; defaults?: AnnouncementDefaults; submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, fd) => action(fd), null
  );

  const allowedCategories =
    role === "admin" ? ALL_CATEGORIES
    : role === "doctor" ? ALL_CATEGORIES.filter((c) => c.value === "doctor" || c.value === "course")
    : ALL_CATEGORIES.filter((c) => c.value === "representative" || c.value === "majles_tolab");

  const [category, setCategory] = useState(defaults?.category ?? allowedCategories[0].value);
  const isMajles = category === "majles_tolab";
  const canHaveCourse = role === "admin" || role === "doctor" || category === "course";

  return (
    <form action={formAction} className="space-y-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <div>
        <Label htmlFor="category">Category *</Label>
        <select id="category" name="category" value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          {allowedCategories.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
        </select>
      </div>
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required maxLength={200} defaultValue={defaults?.title} />
      </div>
      <div>
        <Label htmlFor="body">Body *</Label>
        <Textarea id="body" name="body" required rows={6} maxLength={10000} defaultValue={defaults?.body} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <select id="priority" name="priority" defaultValue={defaults?.priority ?? "normal"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {canHaveCourse && (
          <div>
            <Label htmlFor="course_id">Course (optional)</Label>
            <select id="course_id" name="course_id" defaultValue={defaults?.course_id ?? ""}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">— Program-wide —</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
            </select>
          </div>
        )}
      </div>
      {isMajles && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="source_name">Source name</Label>
            <Input id="source_name" name="source_name" placeholder="مجلس الطلاب"
              defaultValue={defaults?.source_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="source_url">Source URL</Label>
            <Input id="source_url" name="source_url" type="url" placeholder="https://"
              defaultValue={defaults?.source_url ?? ""} />
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="attachment">Attachment (PDF or image, max 10 MB)</Label>
        <input id="attachment" name="attachment" type="file" accept=".pdf,image/png,image/jpeg,image/webp"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
      </div>
      <div>
        <Label htmlFor="expires_at">Expires at (optional)</Label>
        <Input id="expires_at" name="expires_at" type="datetime-local" defaultValue={defaults?.expires_at ?? ""} />
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requires_acknowledgment" defaultChecked={defaults?.requires_acknowledgment} />
          Requires acknowledgment
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_pinned" defaultChecked={defaults?.is_pinned} /> Pin to top
        </label>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={defaults?.status ?? "draft"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="draft">Save as draft</option>
          <option value="published">Publish immediately</option>
        </select>
      </div>
      {state && !state.ok && <FormError message={state.error} />}
      {state && state.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
