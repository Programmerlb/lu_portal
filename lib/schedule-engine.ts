import type { SupabaseClient } from "@supabase/supabase-js";
import { dowFromDateString, timeToMinutes, addDaysToDateString } from "./date-utils";

export type SessionStatus = "confirmed" | "changed" | "replacement" | "additional";

export interface ScheduleSession {
  id: string;
  scheduleEntryId: string | null;
  courseId: string;
  courseCode: string;
  courseNameEn: string;
  courseNameAr: string | null;
  doctorId: string;
  doctorName: string | null;
  room: string | null;
  onlineLink: string | null;
  start: string;
  end: string;
  status: SessionStatus;
  originalStart: string | null;
  originalEnd: string | null;
  originalRoom: string | null;
  exceptionIds: string[];
  conflicts: string[];
}

export interface RecurringEntryRow {
  id: string;
  course_id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  online_link: string | null;
  course: { id: string; code: string; name_en: string; name_ar: string | null };
  doctor: { id: string; full_name: string | null };
}

export type ExceptionType =
  | "rescheduled" | "cancelled" | "room_changed"
  | "doctor_changed" | "replacement" | "additional";

export interface ExceptionRow {
  id: string;
  schedule_entry_id: string | null;
  course_id: string;
  exception_date: string;
  new_date: string | null;
  exception_type: ExceptionType;
  original_start_time: string | null;
  original_end_time: string | null;
  new_start_time: string | null;
  new_end_time: string | null;
  new_room: string | null;
  new_doctor_id: string | null;
  new_online_link: string | null;
  course: { id: string; code: string; name_en: string; name_ar: string | null };
}

export function computeActualSessions(
  targetDate: string,
  recurring: RecurringEntryRow[],
  exceptions: ExceptionRow[],
  extraEntryInfo?: Map<string, RecurringEntryRow>
): ScheduleSession[] {
  const sessions = new Map<string, ScheduleSession>();

  for (const e of recurring) {
    sessions.set(e.id, {
      id: e.id,
      scheduleEntryId: e.id,
      courseId: e.course_id,
      courseCode: e.course.code,
      courseNameEn: e.course.name_en,
      courseNameAr: e.course.name_ar,
      doctorId: e.doctor_id,
      doctorName: e.doctor.full_name,
      room: e.room,
      onlineLink: e.online_link,
      start: e.start_time.slice(0, 5),
      end: e.end_time.slice(0, 5),
      status: "confirmed",
      originalStart: null,
      originalEnd: null,
      originalRoom: null,
      exceptionIds: [],
      conflicts: [],
    });
  }

  for (const exc of exceptions) {
    const isSource = exc.exception_date === targetDate;
    const isTarget = exc.new_date === targetDate;
    const isMoveAway = isSource && exc.new_date !== null && exc.new_date !== targetDate;
    const isMoveTo = isTarget && exc.exception_date !== targetDate;

    if (isMoveAway) {
      if (exc.schedule_entry_id) sessions.delete(exc.schedule_entry_id);
      continue;
    }

    if (isMoveTo) {
      if (!exc.new_start_time || !exc.new_end_time) continue;
      const entry = extraEntryInfo?.get(exc.schedule_entry_id ?? "");
      sessions.set(`exc:${exc.id}`, {
        id: `exc:${exc.id}`,
        scheduleEntryId: exc.schedule_entry_id,
        courseId: exc.course_id,
        courseCode: exc.course.code,
        courseNameEn: exc.course.name_en,
        courseNameAr: exc.course.name_ar,
        doctorId: exc.new_doctor_id ?? entry?.doctor_id ?? "",
        doctorName: entry?.doctor.full_name ?? null,
        room: exc.new_room ?? entry?.room ?? null,
        onlineLink: exc.new_online_link ?? entry?.online_link ?? null,
        start: exc.new_start_time.slice(0, 5),
        end: exc.new_end_time.slice(0, 5),
        status: exc.exception_type === "replacement" ? "replacement" : "changed",
        originalStart: exc.original_start_time?.slice(0, 5) ?? entry?.start_time.slice(0, 5) ?? null,
        originalEnd: exc.original_end_time?.slice(0, 5) ?? entry?.end_time.slice(0, 5) ?? null,
        originalRoom: entry?.room ?? null,
        exceptionIds: [exc.id],
        conflicts: [],
      });
      continue;
    }

    if (!isSource) continue;

    if (exc.exception_type === "cancelled") {
      if (exc.schedule_entry_id) sessions.delete(exc.schedule_entry_id);
      continue;
    }

    if (exc.exception_type === "rescheduled") {
      const s = exc.schedule_entry_id ? sessions.get(exc.schedule_entry_id) : null;
      if (s) {
        if (!s.originalStart) s.originalStart = s.start;
        if (!s.originalEnd) s.originalEnd = s.end;
        s.start = (exc.new_start_time ?? s.start).slice(0, 5);
        s.end = (exc.new_end_time ?? s.end).slice(0, 5);
        if (exc.new_room) {
          if (!s.originalRoom) s.originalRoom = s.room;
          s.room = exc.new_room;
        }
        if (exc.new_doctor_id) s.doctorId = exc.new_doctor_id;
        if (exc.new_online_link) s.onlineLink = exc.new_online_link;
        s.status = "changed";
        s.exceptionIds.push(exc.id);
      }
      continue;
    }

    if (exc.exception_type === "room_changed") {
      const s = exc.schedule_entry_id ? sessions.get(exc.schedule_entry_id) : null;
      if (s) {
        if (!s.originalRoom) s.originalRoom = s.room;
        s.room = exc.new_room ?? s.room;
        if (s.status === "confirmed") s.status = "changed";
        s.exceptionIds.push(exc.id);
      }
      continue;
    }

    if (exc.exception_type === "doctor_changed") {
      const s = exc.schedule_entry_id ? sessions.get(exc.schedule_entry_id) : null;
      if (s) {
        s.doctorId = exc.new_doctor_id ?? s.doctorId;
        if (s.status === "confirmed") s.status = "changed";
        s.exceptionIds.push(exc.id);
      }
      continue;
    }

    if (exc.exception_type === "replacement" || exc.exception_type === "additional") {
      if (!exc.new_start_time || !exc.new_end_time) continue;
      sessions.set(`exc:${exc.id}`, {
        id: `exc:${exc.id}`,
        scheduleEntryId: exc.schedule_entry_id,
        courseId: exc.course_id,
        courseCode: exc.course.code,
        courseNameEn: exc.course.name_en,
        courseNameAr: exc.course.name_ar,
        doctorId: exc.new_doctor_id ?? extraEntryInfo?.get(exc.schedule_entry_id ?? "")?.doctor_id ?? "",
        doctorName: extraEntryInfo?.get(exc.schedule_entry_id ?? "")?.doctor.full_name ?? null,
        room: exc.new_room,
        onlineLink: exc.new_online_link,
        start: exc.new_start_time.slice(0, 5),
        end: exc.new_end_time.slice(0, 5),
        status: exc.exception_type === "replacement" ? "replacement" : "additional",
        originalStart: null,
        originalEnd: null,
        originalRoom: null,
        exceptionIds: [exc.id],
        conflicts: [],
      });
      continue;
    }
  }

  const list = Array.from(sessions.values()).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]; const b = list[j];
      const overlap = timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end);
      if (overlap) { a.conflicts.push(b.id); b.conflicts.push(a.id); }
    }
  }

  return list;
}

const ENTRY_SELECT = `
  id, course_id, doctor_id, day_of_week, start_time, end_time, room, online_link,
  course:courses(id, code, name_en, name_ar),
  doctor:profiles!schedule_entries_doctor_id_fkey(id, full_name)
`;

const EXCEPTION_SELECT = `
  id, schedule_entry_id, course_id, exception_date, new_date, exception_type,
  original_start_time, original_end_time, new_start_time, new_end_time,
  new_room, new_doctor_id, new_online_link,
  course:courses(id, code, name_en, name_ar)
`;

export async function fetchRecurringEntries(
  supabase: SupabaseClient, targetDate: string, opts: { courseId?: string } = {}
): Promise<RecurringEntryRow[]> {
  const dow = dowFromDateString(targetDate);
  let q = supabase
    .from("schedule_entries")
    .select(ENTRY_SELECT)
    .eq("day_of_week", dow)
    .eq("is_active", true)
    .lte("effective_from", targetDate)
    .or(`effective_to.is.null,effective_to.gte.${targetDate}`);
  if (opts.courseId) q = q.eq("course_id", opts.courseId);
  const { data, error } = await q;
  if (error) throw new Error(`fetchRecurringEntries: ${error.message}`);
  return (data ?? []) as unknown as RecurringEntryRow[];
}

export async function fetchExceptionsForDate(
  supabase: SupabaseClient, targetDate: string, opts: { courseId?: string } = {}
): Promise<ExceptionRow[]> {
  let q = supabase
    .from("schedule_exceptions")
    .select(EXCEPTION_SELECT)
    .or(`exception_date.eq.${targetDate},new_date.eq.${targetDate}`);
  if (opts.courseId) q = q.eq("course_id", opts.courseId);
  const { data, error } = await q;
  if (error) throw new Error(`fetchExceptionsForDate: ${error.message}`);
  return (data ?? []) as unknown as ExceptionRow[];
}

async function fetchExtraEntries(
  supabase: SupabaseClient, entryIds: string[]
): Promise<Map<string, RecurringEntryRow>> {
  if (entryIds.length === 0) return new Map();
  const { data, error } = await supabase.from("schedule_entries").select(ENTRY_SELECT).in("id", entryIds);
  if (error) throw new Error(`fetchExtraEntries: ${error.message}`);
  const map = new Map<string, RecurringEntryRow>();
  for (const row of (data ?? []) as unknown as RecurringEntryRow[]) map.set(row.id, row);
  return map;
}

export async function getActualScheduleForDate(
  supabase: SupabaseClient, targetDate: string, opts: { courseId?: string } = {}
): Promise<ScheduleSession[]> {
  const [recurring, exceptions] = await Promise.all([
    fetchRecurringEntries(supabase, targetDate, opts),
    fetchExceptionsForDate(supabase, targetDate, opts),
  ]);
  const recurringIds = new Set(recurring.map((r) => r.id));
  const extraIds = new Set<string>();
  for (const exc of exceptions) {
    if (exc.schedule_entry_id && !recurringIds.has(exc.schedule_entry_id)) extraIds.add(exc.schedule_entry_id);
  }
  const extraEntries = await fetchExtraEntries(supabase, Array.from(extraIds));
  return computeActualSessions(targetDate, recurring, exceptions, extraEntries);
}

export async function getActualScheduleForRange(
  supabase: SupabaseClient, startDate: string, endDate: string,
  opts: { courseId?: string } = {}
): Promise<Map<string, ScheduleSession[]>> {
  let entriesQ = supabase
    .from("schedule_entries")
    .select(ENTRY_SELECT)
    .eq("is_active", true)
    .lte("effective_from", endDate)
    .or(`effective_to.is.null,effective_to.gte.${startDate}`);
  if (opts.courseId) entriesQ = entriesQ.eq("course_id", opts.courseId);

  const [entriesRes, excOnSource, excOnTarget] = await Promise.all([
    entriesQ,
    supabase.from("schedule_exceptions").select(EXCEPTION_SELECT)
      .gte("exception_date", startDate).lte("exception_date", endDate),
    supabase.from("schedule_exceptions").select(EXCEPTION_SELECT)
      .gte("new_date", startDate).lte("new_date", endDate).not("new_date", "is", null),
  ]);

  const entries = (entriesRes.data ?? []) as unknown as RecurringEntryRow[];
  const excMap = new Map<string, ExceptionRow>();
  for (const row of [
    ...((excOnSource.data ?? []) as unknown as ExceptionRow[]),
    ...((excOnTarget.data ?? []) as unknown as ExceptionRow[]),
  ]) excMap.set(row.id, row);
  const exceptions = Array.from(excMap.values());

  const recurringIds = new Set(entries.map((e) => e.id));
  const extraIds = new Set<string>();
  for (const exc of exceptions) {
    if (exc.schedule_entry_id && !recurringIds.has(exc.schedule_entry_id)) extraIds.add(exc.schedule_entry_id);
  }
  const extraEntries = await fetchExtraEntries(supabase, Array.from(extraIds));

  const result = new Map<string, ScheduleSession[]>();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    const dow = dowFromDateString(ds);
    const recurringForDay = entries.filter((e) => e.day_of_week === dow);
    const exceptionsForDay = exceptions.filter((e) => e.exception_date === ds || e.new_date === ds);
    result.set(ds, computeActualSessions(ds, recurringForDay, exceptionsForDay, extraEntries));
  }
  return result;
}
