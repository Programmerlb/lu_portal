import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { isValidIsoDate } from "@/lib/date-utils";
import { getActualScheduleForDate } from "@/lib/schedule-engine";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { ScheduleDayView } from "@/components/schedule/schedule-day-view";

type Params = { params: Promise<{ date: string }> };

export default async function ScheduleDatePage({ params }: Params) {
  const { date } = await params;
  if (!isValidIsoDate(date)) notFound();
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const sessions = await getActualScheduleForDate(supabase, date);
  return (
    <div className="space-y-6">
      <ScheduleTabs active="" />
      <ScheduleDayView date={date} sessions={sessions} />
    </div>
  );
}
