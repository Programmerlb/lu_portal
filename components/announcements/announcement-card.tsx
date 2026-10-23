import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const categoryLabel: Record<string, string> = {
  official: "Official", doctor: "Doctor", representative: "Representative",
  majles_tolab: "Majles al-Tolab", urgent: "Urgent", course: "Course",
};

export interface AnnouncementRow {
  id: string; title: string; body: string; category: string;
  priority: "normal" | "high" | "urgent";
  published_at: string | null; created_at: string;
  is_pinned: boolean; requires_acknowledgment: boolean;
  course_id: string | null;
  course: { code: string; name_en: string } | null;
  author: { full_name: string | null } | null;
  is_read: boolean; is_acknowledged: boolean; is_unread_urgent: boolean;
}

export function AnnouncementCard({ a }: { a: AnnouncementRow }) {
  const isUrgent = a.priority === "urgent";
  const needsAck = a.requires_acknowledgment && !a.is_acknowledged;
  return (
    <article className={`rounded-lg border bg-white p-4 shadow-sm transition ${
      isUrgent && !a.is_read ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
    }`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {a.is_pinned && <Badge variant="primary">Pinned</Badge>}
          <Badge variant={isUrgent ? "danger" : "neutral"}>{categoryLabel[a.category] ?? a.category}</Badge>
          {isUrgent && <Badge variant="danger">Urgent</Badge>}
          {needsAck && <Badge variant="warning">Acknowledgment required</Badge>}
          {!a.is_read && <Badge variant="primary">Unread</Badge>}
        </div>
        <time className="text-xs text-slate-500">
          {a.published_at ? new Date(a.published_at).toLocaleString() : "—"}
        </time>
      </header>
      <h3 className="mt-2 text-base font-semibold">
        <Link href={`/announcements/${a.id}`} className="hover:text-primary">{a.title}</Link>
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-slate-600">{a.body}</p>
      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap gap-3">
          {a.author?.full_name && <span>By {a.author.full_name}</span>}
          {a.course && <span>{a.course.code} · {a.course.name_en}</span>}
        </div>
        <Link href={`/announcements/${a.id}`} className="text-primary hover:underline">Read →</Link>
      </footer>
    </article>
  );
}
