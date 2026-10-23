import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { updateAnnouncementAction } from "@/lib/actions/announcements";

type Params = { params: Promise<{ id: string }> };

export default async function EditAnnouncementPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: a } = await supabase.from("announcements")
    .select(`
      id, title, body, category, priority, target_audience, course_id,
      source_name, source_url, requires_acknowledgment, is_pinned,
      expires_at, status, author_id
    `).eq("id", id).single();
  if (!a) notFound();
  if (a.author_id !== profile.id && profile.role !== "admin") redirect("/announcements");

  const { data: rawCourses } = await supabase.from("courses").select("id, code, name_en").order("code");
  const courses = (rawCourses ?? []).map((c) => ({ id: c.id, label: `${c.code} · ${c.name_en}` }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit announcement</h1>
      <AnnouncementForm action={updateAnnouncementAction} role={profile.role} courses={courses}
        defaults={{
          id: a.id, category: a.category, title: a.title, body: a.body,
          priority: a.priority as "normal" | "high" | "urgent",
          target_audience: a.target_audience as "program" | "course" | "all",
          course_id: a.course_id, source_name: a.source_name, source_url: a.source_url,
          requires_acknowledgment: a.requires_acknowledgment, is_pinned: a.is_pinned,
          expires_at: a.expires_at, status: a.status as "draft" | "published",
        }}
        submitLabel="Save changes" />
    </div>
  );
}
