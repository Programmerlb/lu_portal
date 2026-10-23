import { Badge } from "@/components/ui/badge";
import type { ScheduleSession } from "@/lib/schedule-engine";

const statusVariant: Record<ScheduleSession["status"], "success" | "warning" | "primary" | "neutral"> = {
  confirmed: "success", changed: "warning", replacement: "primary", additional: "primary",
};

const statusLabel: Record<ScheduleSession["status"], string> = {
  confirmed: "Confirmed", changed: "Changed", replacement: "Replacement", additional: "Additional",
};

export function SessionCard({ session }: { session: ScheduleSession }) {
  const hasTimeChange = session.originalStart !== null &&
    (session.originalStart !== session.start || session.originalEnd !== session.end);
  const hasRoomChange = session.originalRoom !== null && session.originalRoom !== session.room;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{session.courseNameEn}</h3>
            <Badge variant={statusVariant[session.status]}>{statusLabel[session.status]}</Badge>
            {session.conflicts.length > 0 && <Badge variant="danger">Conflict</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{session.courseCode}</p>
        </div>
        <div className="shrink-0 text-right">
          {hasTimeChange ? (
            <>
              <p className="text-xs text-slate-400 line-through">{session.originalStart}–{session.originalEnd}</p>
              <p className="text-sm font-medium text-primary">{session.start}–{session.end}</p>
            </>
          ) : (
            <p className="text-sm font-medium">{session.start}–{session.end}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {session.doctorName && <span>Dr. {session.doctorName}</span>}
        {session.room && (
          <span>Room: <strong>{session.room}</strong>
            {hasRoomChange && <span className="text-slate-400"> (was {session.originalRoom})</span>}
          </span>
        )}
        {session.onlineLink && (
          <a href={session.onlineLink} target="_blank" rel="noopener noreferrer"
            className="text-primary hover:underline">Online link</a>
        )}
      </div>
    </div>
  );
}
