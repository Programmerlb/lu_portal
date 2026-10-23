import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoMarkRead } from "@/components/announcements/auto-mark-read";
import { AcknowledgeButton, AttachmentButton, PublishButton, ArchiveButton } from "@/components/announcements/announcement-actions";

type Params = { params: Promise<{ id: string }> };

const categoryLabel: Record<string, string> = {
  official: "Official", doctor: "Doctor", representative: "Representative",
  majles_tolab: "Majles al-Tolab", urgent: "Urgent", course: "Course",
};

export default async function AnnouncementDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: a } = await supabase.from("announcements")
    .select(`
      id, title, body, category, priority, status, source_name, source_url,
      published_at, expires_at, attachment_path,
      is_pinned, requires_acknowledgment, course_id, author_id,
      course:courses(code, name_en),
      author:profiles!announcements_author_id_fkey(full_name)
    `).eq("id", id).single();
  if (!a) notFound();

  const { data: read } = await supabase.from("announcement_reads")
    .select("acknowledged").eq("announcement_id", id).eq("user_id", profile.id).maybeSingle();

  const isAuthor = a.author_id === profile.id;
  const isAdmin = profile.role === "admin";
  const canPublish = (isAuthor || isAdmin) && a.status === "draft";
  const canArchive = (isAuthor || isAdmin) && a.status === "published";
  const showAck = a.requires_acknowledgment && ["student", "representative"].includes(profile.role) && !read?.acknowledged;
  const course = (a as unknown as { course: { code: string; name_en: string } | null }).course;
  const author = (a as unknown as { author: { full_name: string | null } | null }).author;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AutoMarkRead announcementId={id} />
      <div><Link href="/announcements" className="text-xs text-primary hover:underline">← All announcements</Link></div>
      <div className="flex flex-wrap items-center gap-2">
        {a.is_pinned && <Badge variant="primary">Pinned</Badge>}
        <Badge variant={a.priority === "urgent" ? "danger" : "neutral"}>{categoryLabel[a.category] ?? a.category}</Badge>
        {a.priority !== "normal" && (
          <Badge variant={a.priority === "urgent" ? "danger" : "warning"}>
            {a.priority === "urgent" ? "Urgent" : "High priority"}
          </Badge>
        )}
        {a.status === "draft" && <Badge variant="warning">Draft</Badge>}
        {a.status === "archived" && <Badge variant="neutral">Archived</Badge>}
        {a.requires_acknowledgment && <Badge variant="warning">Acknowledgment required</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{a.title}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            {author?.full_name ? `By ${author.full_name}` : ""}
            {a.published_at ? ` · ${new Date(a.published_at).toLocaleString()}` : ""}
            {course ? ` · ${course.code} — ${course.name_en}` : ""}
          </p>
        </CardHeader>
        <CardBody>
          <div className="whitespace-pre-wrap text-sm text-slate-800">{a.body}</div>
        </CardBody>
      </Card>

      {a.category === "majles_tolab" && (a.source_name || a.source_url) && (
        <Card>
          <CardHeader><CardTitle>Source</CardTitle></CardHeader>
          <CardBody className="text-sm">
            {a.source_name && <p>From: {a.source_name}</p>}
            {a.source_url && (
              <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {a.source_url}
              </a>
            )}
          </CardBody>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {a.attachment_path && <AttachmentButton announcementId={id} />}
        {showAck && <AcknowledgeButton announcementId={id} />}
        {canPublish && <PublishButton announcementId={id} />}
        {canArchive && <ArchiveButton announcementId={id} />}
        {(isAuthor || isAdmin) && (
          <>
            <Link href={`/announcements/${id}/edit`}>
              <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50">Edit</button>
            </Link>
            <Link href={`/announcements/${id}/receipts`}>
              <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50">View receipts</button>
            </Link>
          </>
        )}
      </div>

      {a.expires_at && (
        <p className="text-xs text-slate-500">Expires {new Date(a.expires_at).toLocaleString()}</p>
      )}
    </div>
  );
}
