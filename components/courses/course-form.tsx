"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import type { ActionResult } from "@/lib/actions/courses";

type State = ActionResult | null;

export function CourseForm({ action, semesters, doctors, defaults, submitLabel }: {
  action: (fd: FormData) => Promise<ActionResult>;
  semesters: { id: string; label: string }[];
  doctors: { id: string; label: string }[];
  defaults?: {
    id?: string; semester_id?: string; code?: string; name_en?: string;
    name_ar?: string | null; description?: string | null; credits?: number | null;
    doctor_ids?: string[];
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, fd) => action(fd), null
  );

  return (
    <form action={formAction} className="space-y-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <div>
        <Label htmlFor="semester_id">Semester *</Label>
        <select id="semester_id" name="semester_id" required defaultValue={defaults?.semester_id}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">— Select —</option>
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="code">Code *</Label>
          <Input id="code" name="code" required defaultValue={defaults?.code}
            placeholder="MBA501" pattern="[A-Z0-9\-]+" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="name_en">Name (EN) *</Label>
          <Input id="name_en" name="name_en" required defaultValue={defaults?.name_en} />
        </div>
      </div>
      <div>
        <Label htmlFor="name_ar">Name (AR)</Label>
        <Input id="name_ar" name="name_ar" defaultValue={defaults?.name_ar ?? ""} dir="rtl" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={defaults?.description ?? ""} />
      </div>
      <div>
        <Label htmlFor="credits">Credits</Label>
        <Input id="credits" name="credits" type="number" min={1} max={30}
          defaultValue={defaults?.credits ?? ""} />
      </div>
      <div>
        <Label>Assigned doctors</Label>
        <div className="space-y-1 rounded-md border border-slate-200 p-2">
          {doctors.length === 0 && <p className="text-xs text-slate-500">No doctors in the system yet.</p>}
          {doctors.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="doctor_ids" value={d.id}
                defaultChecked={defaults?.doctor_ids?.includes(d.id)} />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </div>
      {state && !state.ok && <FormError message={state.error} />}
      {state && state.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
