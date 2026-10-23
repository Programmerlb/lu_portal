import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { AnnouncementCard, type AnnouncementRow } from "@/components/announcements/announcement-card";
import { AnnouncementFilters } from "@/components/announcements/announcement-filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Search = { searchParams: Promise<{ category?: string; course?: string; q?: string }> };

export default async function AnnouncementsPage({ searchParams }: Search) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const { category, course, q } = await searchParams;

  let query = supabase.from("announcements")
    .select(`
      id, title, body, category, priority, published_at, created_at,
      is_pinned, requires_acknowledgment, course_id, status,
      course:courses(code, name_en),
      author:profiles!announcements_author_id_fkey(full_name)
    `)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(100);
  if (category) query = query.eq("category", category);
  if (course) query = query.eq("course_id", course);
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);

  const { data: anns } = await query;
  const ids = (anns ?? []).map((a) => a.id);

  const readMap = new Map<string, { acknowledged: boolean }>();
  if (ids.length > 0) {
    const { data: reads } = await supabase.from("announcement_reads")
      .select("announcement_id, acknowledged").eq("user_id", profile.id).in("announcement_id", ids);
    for (const r of reads ?? []) readMap.set(r.announcement_id, { acknowledged: r.acknowledged });
  }

  const rows: AnnouncementRow[] = (anns ?? []).map((a) => {
    const read = readMap.get(a.id);
    return {
      id: a.id, title: a.title, body: a.body, category: a.category,
      priority: a.priority as "normal" | "high" | "urgent",
      published_at: a.published_at, created_at: a.created_at,
      is_pinned: a.is_pinned, requires_acknowledgment: a.requires_acknowledgment,
      course_id: a.course_id,
      course: (a as unknown as { course: { code: string; name_en: string } | null }).course,
      author: (a as unknown as { author: { full_name: string | null } | null }).author,
      is_read: readMap.has(a.id), is_acknowledged: read?.acknowledged ?? false,
      is_unread_urgent: a.priority === "urgent" && !readMap.has(a.id),
    };
  });

  const canCreate = ["admin", "doctor", "representative"].includes(profile.role);
  const { data: courseOptions } = await supabase.from("courses")
    .select("id, code, name_en").order("code").limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        {canCreate && (<Link href="/announcements/new"><Button>New announcement</Button></Link>)}
      </div>
      <AnnouncementFilters courses={courseOptions ?? []} />
      {rows.length === 0 ? (
        <EmptyState title="No announcements" description="Nothing matches the current filters." />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (<AnnouncementCard key={a.id} a={a} />))}
        </div>
      )}
    </div>
  );
}
