"use client";

import { useActionState, useState } from "react";
import { createChangeRequestAction } from "@/lib/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import type { ActionResult } from "@/lib/actions/courses";

type State = ActionResult | null;

export interface EntryOption {
  id: string; courseId: string; label: string;
  dayOfWeek: number; startTime: string; endTime: string;
}
export interface DoctorOption { id: string; label: string; }

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ChangeRequestForm({ entries, doctors }: {
  entries: EntryOption[]; doctors: DoctorOption[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, fd) => createChangeRequestAction(fd), null
  );
  const [entryId, setEntryId] = useState("");
  const [type, setType] = useState<
    "reschedule" | "cancel" | "room_change" | "doctor_change" | "replacement" | "additional"
  >("reschedule");
  const selected = entries.find((e) => e.id === entryId);
  const needsNewTimes = type === "reschedule" || type === "replacement" || type === "additional";

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="schedule_entry_id">Schedule entry *</Label>
        <select id="schedule_entry_id" name="schedule_entry_id" required
          value={entryId} onChange={(e) => setEntryId(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">— Select —</option>
          {entries.map((e) => (<option key={e.id} value={e.id}>{e.label}</option>))}
        </select>
        {selected && (
          <>
            <input type="hidden" name="course_id" value={selected.courseId} />
            <input type="hidden" name="original_start_time" value={selected.startTime} />
            <input type="hidden" name="original_end_time" value={selected.endTime} />
            <p className="mt-1 text-xs text-slate-500">
              Base slot: {DAY_NAMES[selected.dayOfWeek]} {selected.startTime.slice(0, 5)}–{selected.endTime.slice(0, 5)}
            </p>
          </>
        )}
      </div>

      <div>
        <Label htmlFor="request_type">Change type *</Label>
        <select id="request_type" name="request_type" required value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="reschedule">Reschedule (time / date)</option>
          <option value="cancel">Cancel class</option>
          <option value="room_change">Room change</option>
          <option value="doctor_change">Doctor change</option>
          <option value="replacement">Replacement class</option>
          <option value="additional">Additional session</option>
        </select>
      </div>

      <div>
        <Label htmlFor="original_date">
          {type === "additional" ? "Session date *" : "Original class date *"}
        </Label>
        <Input id="original_date" name="original_date" type="date" required defaultValue="" />
      </div>

      {needsNewTimes && (
        <>
          {type !== "additional" && (
            <div>
              <Label htmlFor="proposed_date">New date (leave empty for same day)</Label>
              <Input id="proposed_date" name="proposed_date" type="date" />
            </div>
          )}
          {type === "additional" && <input type="hidden" name="proposed_date" value="" />}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="proposed_start_time">New start time *</Label>
              <Input id="proposed_start_time" name="proposed_start_time" type="time" required />
            </div>
            <div>
              <Label htmlFor="proposed_end_time">New end time *</Label>
              <Input id="proposed_end_time" name="proposed_end_time" type="time" required />
            </div>
          </div>
        </>
      )}

      {type === "room_change" && (
        <div>
          <Label htmlFor="proposed_room">New room *</Label>
          <Input id="proposed_room" name="proposed_room" required maxLength={100} />
        </div>
      )}

      {type === "doctor_change" && (
        <div>
          <Label htmlFor="proposed_doctor_id">Replacement doctor *</Label>
          <select id="proposed_doctor_id" name="proposed_doctor_id" required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">— Select —</option>
            {doctors.map((d) => (<option key={d.id} value={d.id}>{d.label}</option>))}
          </select>
        </div>
      )}

      {(type === "reschedule" || type === "replacement" || type === "additional") && (
        <div>
          <Label htmlFor="proposed_room">Room (optional)</Label>
          <Input id="proposed_room" name="proposed_room" maxLength={100} />
        </div>
      )}

      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Textarea id="reason" name="reason" required rows={3} maxLength={2000} />
      </div>

      {state && !state.ok && <FormError message={state.error} />}
      {state && state.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Request submitted. Waiting for doctor confirmation.
        </p>
      )}

      <Button type="submit" disabled={pending || !entryId}>
        {pending ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
