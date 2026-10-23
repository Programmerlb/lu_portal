import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { todayInTz } from "@/lib/date-utils";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { MainScheduleView } from "@/components/schedule/main-schedule-view";
import type { RecurringEntryRow } from "@/lib/schedule-engine";

export default async function MainSchedulePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const today = todayInTz();
  const { data } = await supabase
    .from("schedule_entries")
    .select(`
      id, course_id, doctor_id, day_of_week, start_time, end_time, room, online_link,
      course:courses(id, code, name_en, name_ar),
      doctor:profiles!schedule_entries_doctor_id_fkey(id, full_name)
    `)
    .eq("is_active", true)
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .order("day_of_week").order("start_time");

  return (
    <div className="space-y-6">
      <ScheduleTabs active="/schedule/main" />
      <div>
        <h1 className="text-2xl font-semibold">Main semester schedule</h1>
        <p className="mt-1 text-xs text-slate-500">
          The recurring timetable. For today&apos;s actual classes see{" "}
          <a className="text-primary hover:underline" href="/schedule/today">Today</a> or{" "}
          <a className="text-primary hover:underline" href="/schedule/tomorrow">Tomorrow</a>.
        </p>
      </div>
      <MainScheduleView entries={(data ?? []) as unknown as RecurringEntryRow[]} />
    </div>
  );
}
