"use client";

import { useActionState } from "react";
import { createLectureAction } from "@/lib/actions/lectures";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import type { ActionResult } from "@/lib/actions/courses";

type State = ActionResult | null;

export function LectureForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, fd) => createLectureAction(fd), null
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="course_id" value={courseId} />
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div>
        <Label htmlFor="title_ar">Title (Arabic)</Label>
        <Input id="title_ar" name="title_ar" maxLength={200} dir="rtl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="week_number">Week</Label>
          <Input id="week_number" name="week_number" type="number" min={1} max={52} />
        </div>
        <div>
          <Label htmlFor="lecture_date">Lecture date</Label>
          <Input id="lecture_date" name="lecture_date" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} maxLength={4000} />
      </div>
      {state && !state.ok && <FormError message={state.error} />}
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create lecture"}</Button>
    </form>
  );
}
