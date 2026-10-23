import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { addDaysToDateString, isValidIsoDate, startOfWeek, todayInTz, weekDates } from "@/lib/date-utils";
import { getActualScheduleForRange } from "@/lib/schedule-engine";
import { CalendarToolbar, type CalendarView } from "@/components/calendar/calendar-toolbar";
import {
  AgendaList, DayAgenda, MonthGrid, WeekGrid, type CalendarItem,
} from "@/components/calendar/calendar-views";
import { Button } from "@/components/ui/button";

type Search = { searchParams: Promise<{ view?: string; date?: string }> };

function toItems(
  sessionMap: Map<string, import("@/lib/schedule-engine").ScheduleSession[]>,
  events: { id: string; title: string; category: string; starts_at: string; ends_at: string | null; course_id: string | null; description: string | null }[],
  courseMap: Map<string, { code: string; name_en: string }>
): Map<string, CalendarItem[]> {
  const out = new Map<string, CalendarItem[]>();
  const push = (date: string, item: CalendarItem) => {
    if (!out.has(date)) out.set(date, []);
    out.get(date)!.push(item);
  };
  for (const [date, sessions] of sessionMap.entries()) {
    for (const s of sessions) {
      push(date, {
        id: s.id, kind: "session", title: s.courseNameEn,
        subtitle: `${s.start}–${s.end}${s.room ? ` · ${s.room}` : ""}`,
        category: s.status, date, start: s.start, end: s.end, status: s.status,
        href: `/schedule/date/${date}`,
      });
    }
  }
  for (const e of events) {
    const d = e.starts_at.slice(0, 10);
    const start = new Date(e.starts_at).toISOString().slice(11, 16);
    const end = e.ends_at ? new Date(e.ends_at).toISOString().slice(11, 16) : null;
    push(d, {
      id: `ev-${e.id}`, kind: "event", title: e.title,
      subtitle: e.course_id ? courseMap.get(e.course_id)?.code ?? null : null,
      category: e.category, date: d, start, end, href: `/calendar/event/${e.id}`,
    });
  }
  for (const [, list] of out) list.sort((a, b) => (a.start ?? "00:00").localeCompare(b.start ?? "00:00"));
  return out;
}

export default async function CalendarPage({ searchParams }: Search) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { t } = await getT();
  const today = todayInTz();
  const sp = await searchParams;
  const view = (sp.view as CalendarView | undefined) ?? "month";
  const reference = sp.date && isValidIsoDate(sp.date) ? sp.date : today;

  let rangeStart = today; let rangeEnd = today;
  if (view === "month") {
    const [y, m] = reference.split("-").map(Number);
    rangeStart = `${y}-${String(m).padStart(2, "0")}-01`;
    rangeEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  } else if (view === "week") {
    rangeStart = startOfWeek(reference);
    const ds = weekDates(rangeStart);
    rangeEnd = ds[ds.length - 1];
  } else if (view === "day") {
    rangeStart = reference; rangeEnd = reference;
  } else {
    rangeStart = today; rangeEnd = addDaysToDateString(today, 30);
  }

  const [sessionMap, eventsRes, coursesRes] = await Promise.all([
    getActualScheduleForRange(supabase, rangeStart, rangeEnd),
    supabase.from("calendar_events")
      .select("id, title, category, starts_at, ends_at, course_id, description")
      .gte("starts_at", rangeStart + "T00:00:00").lte("starts_at", rangeEnd + "T23:59:59")
      .order("starts_at"),
    supabase.from("courses").select("id, code, name_en"),
  ]);

  const courseMap = new Map((coursesRes.data ?? []).map((c) => [c.id, { code: c.code, name_en: c.name_en }]));
  const itemsByDate = toItems(sessionMap, eventsRes.data ?? [], courseMap);
  const canCreate = ["admin", "doctor"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("calendar.title")}</h1>
        {canCreate && (<Link href="/calendar/new"><Button>{t("calendar.newEvent")}</Button></Link>)}
      </div>

      <CalendarToolbar view={view} date={reference} today={today}
        labels={{
          month: t("calendar.month"), week: t("calendar.week"),
          day: t("calendar.day"), agenda: t("calendar.agenda"),
          today: t("common.today"),
        }} />

      {view === "month" && (<MonthGrid monthAnchor={reference} itemsByDate={itemsByDate} today={today} />)}
      {view === "week" && (<WeekGrid weekStart={startOfWeek(reference)} itemsByDate={itemsByDate} today={today} />)}
      {view === "day" && (<DayAgenda date={reference} items={itemsByDate.get(reference) ?? []} />)}
      {view === "agenda" && (
        <AgendaList items={Array.from(itemsByDate.values()).flat().sort((a, b) => {
          const ka = a.date + " " + (a.start ?? "");
          const kb = b.date + " " + (b.start ?? "");
          return ka.localeCompare(kb);
        })} today={today} />
      )}
    </div>
  );
}
