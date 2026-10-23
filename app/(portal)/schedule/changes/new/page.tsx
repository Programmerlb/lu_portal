import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { ChangeRequestForm, type DoctorOption, type EntryOption } from "@/components/schedule/change-request-form";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function NewChangeRequestPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  if (!["admin", "doctor", "representative"].includes(profile.role)) redirect("/schedule/changes");

  const [{ data: entries }, { data: doctors }] = await Promise.all([
    supabase.from("schedule_entries")
      .select(`id, course_id, day_of_week, start_time, end_time, course:courses(code, name_en)`)
      .eq("is_active", true)
      .order("course_id").order("day_of_week").order("start_time"),
    supabase.from("profiles").select("id, full_name, email")
      .eq("role", "doctor").eq("is_active", true),
  ]);

  const entryOptions: EntryOption[] = (entries ?? []).map((e) => {
    const course = (e as unknown as { course: { code: string; name_en: string } }).course;
    return {
      id: e.id, courseId: e.course_id,
      label: `${course?.code ?? ""} ${course?.name_en ?? ""} — ${DAY_NAMES[e.day_of_week]} ${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)}`,
      dayOfWeek: e.day_of_week, startTime: e.start_time, endTime: e.end_time,
    };
  });
  const doctorOptions: DoctorOption[] = (doctors ?? []).map((d) => ({
    id: d.id, label: d.full_name ?? d.email,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ScheduleTabs active="/schedule/changes" />
      <div>
        <h1 className="text-2xl font-semibold">New schedule change request</h1>
        <p className="mt-1 text-xs text-slate-500">
          Routed to the course doctor for confirmation, then to the administrator for approval.
        </p>
      </div>
      <ChangeRequestForm entries={entryOptions} doctors={doctorOptions} />
    </div>
  );
}
