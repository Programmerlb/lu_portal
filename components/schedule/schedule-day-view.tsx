import { formatLongDate } from "@/lib/date-utils";
import type { ScheduleSession } from "@/lib/schedule-engine";
import { SessionCard } from "./session-card";
import { EmptyState } from "@/components/ui/empty-state";

export function ScheduleDayView({ date, sessions }: { date: string; sessions: ScheduleSession[] }) {
  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{formatLongDate(date)}</h2>
        <span className="text-xs text-slate-500">{sessions.length} session{sessions.length === 1 ? "" : "s"}</span>
      </header>
      {sessions.length === 0 ? (
        <EmptyState title="No sessions" description="Nothing is scheduled for this day." />
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (<li key={s.id}><SessionCard session={s} /></li>))}
        </ul>
      )}
    </section>
  );
}
