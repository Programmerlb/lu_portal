import Link from "next/link";
import type { Route } from "next";
import { dowFromDateString, formatLongDate, monthDates, weekDates } from "@/lib/date-utils";
import type { ScheduleSession } from "@/lib/schedule-engine";

export interface CalendarItem {
  id: string; kind: "session" | "event"; title: string; subtitle: string | null;
  category: string; date: string; start: string | null; end: string | null;
  status?: ScheduleSession["status"]; href: string;
}

const CATEGORY_STYLE: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  changed: "bg-amber-100 text-amber-800 border-amber-200",
  replacement: "bg-purple-100 text-purple-800 border-purple-200",
  additional: "bg-indigo-100 text-indigo-800 border-indigo-200",
  lecture: "bg-sky-100 text-sky-800 border-sky-200",
  exam: "bg-red-100 text-red-800 border-red-200",
  quiz: "bg-orange-100 text-orange-800 border-orange-200",
  assignment: "bg-amber-100 text-amber-800 border-amber-200",
  holiday: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closure: "bg-slate-200 text-slate-700 border-slate-300",
  schedule_change: "bg-amber-100 text-amber-800 border-amber-200",
  council: "bg-purple-100 text-purple-800 border-purple-200",
  registration: "bg-blue-100 text-blue-800 border-blue-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

export function EventChip({ item, compact = false }: { item: CalendarItem; compact?: boolean }) {
  const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.other;
  return (
    <Link href={item.href as Route}
      className={`block rounded border px-2 py-1 text-xs hover:brightness-95 ${style}`}
      title={item.subtitle ?? item.title}>
      <span className="font-medium">{item.start ?? ""} </span>
      <span className="truncate">{compact ? item.title : item.title}</span>
    </Link>
  );
}

export function MonthGrid({ monthAnchor, itemsByDate, today }: {
  monthAnchor: string; itemsByDate: Map<string, CalendarItem[]>; today: string;
}) {
  const [y, m] = monthAnchor.split("-").map(Number);
  const dates = monthDates(y, m);
  const firstDow = dowFromDateString(dates[0]);
  const blanks = firstDow === 0 ? 6 : firstDow - 1;
  const monthName = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "long", year: "numeric", timeZone: "UTC",
  });
  const dows = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">{monthName}</h2>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {dows.map((d) => (<div key={d} className="py-1">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`b-${i}`} className="min-h-24 rounded border border-transparent" />
        ))}
        {dates.map((d) => {
          const items = itemsByDate.get(d) ?? [];
          const isToday = d === today;
          const shown = items.slice(0, 3);
          const more = items.length - shown.length;
          return (
            <div key={d} className={`min-h-24 rounded border p-1 text-xs ${
              isToday ? "border-primary bg-primary/5" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            }`}>
              <Link href={`/schedule/date/${d}`}
                className="mb-1 block text-end text-[11px] font-medium text-slate-600 hover:text-primary dark:text-slate-300">
                {Number(d.slice(-2))}
              </Link>
              <div className="space-y-1">
                {shown.map((it) => (<EventChip key={it.id} item={it} compact />))}
                {more > 0 && (
                  <Link href={`/schedule/date/${d}`} className="block text-[10px] text-primary hover:underline">
                    +{more} more
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WeekGrid({ weekStart, itemsByDate, today }: {
  weekStart: string; itemsByDate: Map<string, CalendarItem[]>; today: string;
}) {
  const days = weekDates(weekStart);
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Week of {formatLongDate(weekStart)}</h2>
      <div className="grid gap-2 md:grid-cols-7">
        {days.map((d) => {
          const items = itemsByDate.get(d) ?? [];
          const isToday = d === today;
          return (
            <div key={d} className={`rounded border p-2 text-xs ${
              isToday ? "border-primary bg-primary/5" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            }`}>
              <div className="mb-2 font-medium text-slate-700 dark:text-slate-200">
                {new Date(d + "T12:00:00Z").toLocaleDateString(undefined, {
                  weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
                })}
              </div>
              <div className="space-y-1">
                {items.length === 0 && (<p className="text-[10px] text-slate-400">—</p>)}
                {items.map((it) => (<EventChip key={it.id} item={it} compact />))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DayAgenda({ date, items }: { date: string; items: CalendarItem[] }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">{formatLongDate(date)}</h2>
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Nothing scheduled.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (<li key={it.id}><EventChip item={it} /></li>))}
        </ul>
      )}
    </div>
  );
}

export function AgendaList({ items, today }: { items: CalendarItem[]; today: string }) {
  const groups = new Map<string, CalendarItem[]>();
  for (const it of items) {
    if (!groups.has(it.date)) groups.set(it.date, []);
    groups.get(it.date)!.push(it);
  }
  const dates = Array.from(groups.keys()).sort();
  if (dates.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        No upcoming events.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {dates.map((d) => (
        <section key={d}>
          <h3 className={`mb-1 text-sm font-semibold ${d === today ? "text-primary" : "text-slate-700 dark:text-slate-200"}`}>
            {formatLongDate(d)}
          </h3>
          <ul className="space-y-1">
            {(groups.get(d) ?? []).map((it) => (<li key={it.id}><EventChip item={it} /></li>))}
          </ul>
        </section>
      ))}
    </div>
  );
}
