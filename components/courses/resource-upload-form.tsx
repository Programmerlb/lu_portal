"use client";

import { useActionState } from "react";
import { uploadResourceAction } from "@/lib/actions/resources";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import type { ActionResult } from "@/lib/actions/courses";

type State = ActionResult | null;

export function ResourceUploadForm({ courseId, lectures }: {
  courseId: string;
  lectures: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, fd) => uploadResourceAction(fd), null
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="course_id" value={courseId} />
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div>
        <Label htmlFor="lecture_id">Link to lecture (optional)</Label>
        <select id="lecture_id" name="lecture_id"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">— None (general resource) —</option>
          {lectures.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} maxLength={2000} />
      </div>
      <div>
        <Label htmlFor="file">File (PDF, DOCX, PPTX, XLSX, images — up to 25 MB)</Label>
        <input id="file" name="file" type="file"
          accept=".pdf,.pptx,.docx,.ppt,.doc,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
      </div>
      <div>
        <Label htmlFor="external_url">Or external URL</Label>
        <Input id="external_url" name="external_url" type="url" placeholder="https://" />
      </div>
      {state && !state.ok && <FormError message={state.error} />}
      {state && state.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Resource uploaded successfully.
        </p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload resource"}</Button>
    </form>
  );
}
