import type { RecurringEntryRow } from "@/lib/schedule-engine";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function MainScheduleView({ entries }: { entries: RecurringEntryRow[] }) {
  const grouped = new Map<number, RecurringEntryRow[]>();
  for (const e of entries) {
    if (!grouped.has(e.day_of_week)) grouped.set(e.day_of_week, []);
    grouped.get(e.day_of_week)!.push(e);
  }

  return (
    <div className="space-y-4">
      {ORDER.map((dow) => {
        const list = (grouped.get(dow) ?? []).sort((a, b) => a.start_time.localeCompare(b.start_time));
        return (
          <section key={dow} className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-100 px-4 py-2">
              <h3 className="text-sm font-semibold text-slate-700">{DAY_NAMES[dow]}</h3>
            </header>
            {list.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-400">No classes</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{e.course.name_en}</p>
                      <p className="text-xs text-slate-500">
                        {e.course.code} · Dr. {e.doctor.full_name ?? "—"}{e.room ? ` · ${e.room}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs">
                      {e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
