import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { createAnnouncementAction } from "@/lib/actions/announcements";

export default async function NewAnnouncementPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  if (!["admin", "doctor", "representative"].includes(profile.role)) redirect("/announcements");

  let courses: { id: string; label: string }[] = [];
  if (profile.role === "doctor") {
    const { data } = await supabase.from("course_doctors")
      .select("courses(id, code, name_en)").eq("doctor_id", profile.id);
    courses = (data ?? []).map((r) => {
      const c = (r as unknown as { courses: { id: string; code: string; name_en: string } }).courses;
      return { id: c.id, label: `${c.code} · ${c.name_en}` };
    });
  } else {
    const { data } = await supabase.from("courses").select("id, code, name_en").order("code");
    courses = (data ?? []).map((c) => ({ id: c.id, label: `${c.code} · ${c.name_en}` }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New announcement</h1>
      <AnnouncementForm action={createAnnouncementAction} role={profile.role}
        courses={courses} submitLabel="Save announcement" />
    </div>
  );
}
