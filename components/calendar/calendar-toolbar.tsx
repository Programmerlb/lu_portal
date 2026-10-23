import Link from "next/link";
import { addDaysToDateString } from "@/lib/date-utils";

export type CalendarView = "month" | "week" | "day" | "agenda";

export interface ToolbarProps {
  view: CalendarView; date: string; today: string;
  labels: { month: string; week: string; day: string; agenda: string; today: string };
}

function nextMonth(date: string, delta: number): string {
  const [y, m] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

export function CalendarToolbar({ view, date, today, labels }: ToolbarProps) {
  const url = (v: CalendarView, d: string) => `/calendar?view=${v}&date=${d}`;
  let prev = date; let next = date;
  if (view === "month") { prev = nextMonth(date, -1); next = nextMonth(date, 1); }
  else if (view === "week") { prev = addDaysToDateString(date, -7); next = addDaysToDateString(date, 7); }
  else if (view === "day") { prev = addDaysToDateString(date, -1); next = addDaysToDateString(date, 1); }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        {(Object.keys(labels) as (keyof typeof labels)[]).filter((k) => k !== "today").map((k) => (
          <Link key={k} href={url(k as CalendarView, date)}
            className={`rounded-md px-3 py-1.5 ${view === k ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            {labels[k]}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        {view !== "agenda" && (
          <>
            <Link href={url(view, prev)} aria-label="Previous"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">‹</Link>
            <Link href={url(view, today)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{labels.today}</Link>
            <Link href={url(view, next)} aria-label="Next"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">›</Link>
          </>
        )}
      </div>
    </div>
  );
}
