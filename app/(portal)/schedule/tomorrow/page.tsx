import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { tomorrowInTz } from "@/lib/date-utils";
import { getActualScheduleForDate } from "@/lib/schedule-engine";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { ScheduleDayView } from "@/components/schedule/schedule-day-view";

export default async function TomorrowPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const date = tomorrowInTz();
  const sessions = await getActualScheduleForDate(supabase, date);
  return (
    <div className="space-y-6">
      <ScheduleTabs active="/schedule/tomorrow" />
      <ScheduleDayView date={date} sessions={sessions} />
    </div>
  );
}
