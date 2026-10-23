"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { SemesterActionResult } from "@/lib/actions/semesters";

type Option = { id: string; label: string };
type Values = {
  id?: string; program_id?: string; academic_year_id?: string; number?: number;
  name_en?: string; name_ar?: string; start_date?: string; end_date?: string;
  registration_start?: string | null; registration_end?: string | null;
  exam_start?: string | null; exam_end?: string | null; status?: string;
};

export function SemesterForm({ action, programs, years, defaults, submitLabel }: {
  action: (prev: SemesterActionResult | null, data: FormData) => Promise<SemesterActionResult>;
  programs: Option[]; years: Option[]; defaults?: Values; submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<SemesterActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor={`program-${defaults?.id ?? "new"}`}>Academic program *</Label>
          <Select id={`program-${defaults?.id ?? "new"}`} name="program_id" required defaultValue={defaults?.program_id ?? ""}>
            <option value="">Select program</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </Select>
        </div>
        <div><Label htmlFor={`year-${defaults?.id ?? "new"}`}>Academic year *</Label>
          <Select id={`year-${defaults?.id ?? "new"}`} name="academic_year_id" required defaultValue={defaults?.academic_year_id ?? ""}>
            <option value="">Select academic year</option>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}
          </Select>
        </div>
        <div><Label htmlFor={`number-${defaults?.id ?? "new"}`}>Semester number *</Label>
          <Select id={`number-${defaults?.id ?? "new"}`} name="number" required defaultValue={String(defaults?.number ?? 1)}>
            {[1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>
        <div><Label htmlFor={`status-${defaults?.id ?? "new"}`}>Status *</Label>
          <Select id={`status-${defaults?.id ?? "new"}`} name="status" required defaultValue={defaults?.status ?? "upcoming"}>
            <option value="upcoming">Upcoming</option><option value="active">Active</option><option value="archived">Archived</option>
          </Select>
        </div>
        <div><Label htmlFor={`name-en-${defaults?.id ?? "new"}`}>Name (English) *</Label>
          <Input id={`name-en-${defaults?.id ?? "new"}`} name="name_en" required minLength={2} maxLength={160} defaultValue={defaults?.name_en ?? ""} />
        </div>
        <div><Label htmlFor={`name-ar-${defaults?.id ?? "new"}`}>Name (Arabic) *</Label>
          <Input id={`name-ar-${defaults?.id ?? "new"}`} name="name_ar" required minLength={2} maxLength={160} dir="rtl" defaultValue={defaults?.name_ar ?? ""} />
        </div>
        <div><Label htmlFor={`start-${defaults?.id ?? "new"}`}>Start date *</Label>
          <Input id={`start-${defaults?.id ?? "new"}`} name="start_date" type="date" required defaultValue={defaults?.start_date ?? ""} />
        </div>
        <div><Label htmlFor={`end-${defaults?.id ?? "new"}`}>End date *</Label>
          <Input id={`end-${defaults?.id ?? "new"}`} name="end_date" type="date" required defaultValue={defaults?.end_date ?? ""} />
        </div>
        <div><Label htmlFor={`reg-start-${defaults?.id ?? "new"}`}>Registration opens</Label>
          <Input id={`reg-start-${defaults?.id ?? "new"}`} name="registration_start" type="date" defaultValue={defaults?.registration_start ?? ""} />
        </div>
        <div><Label htmlFor={`reg-end-${defaults?.id ?? "new"}`}>Registration closes</Label>
          <Input id={`reg-end-${defaults?.id ?? "new"}`} name="registration_end" type="date" defaultValue={defaults?.registration_end ?? ""} />
        </div>
        <div><Label htmlFor={`exam-start-${defaults?.id ?? "new"}`}>Exams start</Label>
          <Input id={`exam-start-${defaults?.id ?? "new"}`} name="exam_start" type="date" defaultValue={defaults?.exam_start ?? ""} />
        </div>
        <div><Label htmlFor={`exam-end-${defaults?.id ?? "new"}`}>Exams end</Label>
          <Input id={`exam-end-${defaults?.id ?? "new"}`} name="exam_end" type="date" defaultValue={defaults?.exam_end ?? ""} />
        </div>
      </div>
      {state && !state.ok && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Semester saved successfully.</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
