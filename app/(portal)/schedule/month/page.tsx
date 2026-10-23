import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { dowFromDateString, monthDates, todayInTz } from "@/lib/date-utils";
import { getActualScheduleForDate } from "@/lib/schedule-engine";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
type Search = { searchParams: Promise<{ year?: string; month?: string }> };

export default async function MonthPage({ searchParams }: Search) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const sp = await searchParams;
  const today = todayInTz();
  const [ty, tm] = today.split("-").map(Number);
  const year = sp.year ? Number(sp.year) : ty;
  const month = sp.month ? Number(sp.month) : tm;
  const dates = monthDates(year, month);
  const counts = await Promise.all(
    dates.map(async (d) => (await getActualScheduleForDate(supabase, d)).length)
  );
  const firstDow = dowFromDateString(dates[0]);
  const blanks = firstDow === 0 ? 6 : firstDow - 1;

  return (
    <div className="space-y-6">
      <ScheduleTabs active="/schedule/month" />
      <h1 className="text-2xl font-semibold">{MONTH_NAMES[month - 1]} {year}</h1>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (<div key={d} className="py-1">{d}</div>))}
        {Array.from({ length: blanks }).map((_, i) => (<div key={`blank-${i}`} />))}
        {dates.map((d, i) => {
          const n = counts[i];
          const isToday = d === today;
          return (
            <Link key={d} href={`/schedule/date/${d}`}
              className={`block rounded-md border p-2 text-left hover:bg-slate-50 ${
                isToday ? "border-primary bg-primary/5" : "border-slate-200 bg-white"
              }`}>
              <div className="text-sm font-medium">{Number(d.slice(-2))}</div>
              {n > 0 && (
                <div className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  {n} session{n === 1 ? "" : "s"}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
