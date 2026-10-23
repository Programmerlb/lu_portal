import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { startOfWeek, todayInTz, weekDates } from "@/lib/date-utils";
import { getActualScheduleForDate } from "@/lib/schedule-engine";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { ScheduleDayView } from "@/components/schedule/schedule-day-view";

type Search = { searchParams: Promise<{ start?: string }> };

export default async function WeekPage({ searchParams }: Search) {
  const { start } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const startDate = start ?? startOfWeek(todayInTz());
  const dates = weekDates(startDate);
  const days = await Promise.all(
    dates.map(async (d) => ({ date: d, sessions: await getActualScheduleForDate(supabase, d) }))
  );
  return (
    <div className="space-y-6">
      <ScheduleTabs active="/schedule/week" />
      <div>
        <h1 className="text-2xl font-semibold">Week schedule</h1>
        <p className="mt-1 text-xs text-slate-500">
          Week starting {startDate} · actual sessions with exceptions applied
        </p>
      </div>
      {days.map((d) => (<ScheduleDayView key={d.date} date={d.date} sessions={d.sessions} />))}
    </div>
  );
}
