import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { todayInTz, tomorrowInTz } from "@/lib/date-utils";
import { getActualScheduleForDate } from "@/lib/schedule-engine";
import { SessionCard } from "@/components/schedule/session-card";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  if (profile.role !== "student") {
    if (profile.role === "admin") redirect("/admin");
    if (profile.role === "doctor") redirect("/doctor");
    if (profile.role === "representative") redirect("/rep");
  }
  const { t } = await getT();
  const today = todayInTz();
  const tomorrow = tomorrowInTz();

  const [todaySessions, tomorrowSessions, anns, exams, courses] = await Promise.all([
    getActualScheduleForDate(supabase, today),
    getActualScheduleForDate(supabase, tomorrow),
    supabase.from("announcements")
      .select("id, title, priority, published_at, requires_acknowledgment")
      .eq("status", "published").order("published_at", { ascending: false }).limit(5),
    supabase.from("calendar_events")
      .select("id, title, category, starts_at").in("category", ["exam", "quiz", "assignment"])
      .gte("starts_at", today + "T00:00:00").order("starts_at").limit(5),
    supabase.from("course_enrollments")
      .select("courses(id, code, name_en)").eq("student_id", profile.id).limit(6),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.welcome")}, {profile.full_name ?? profile.email}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t("dashboard.todaySchedule")} href="/schedule/today">
          {todaySessions.length === 0 ? (
            <p className="text-xs text-slate-500">{t("schedule.noSessions")}</p>
          ) : (
            <ul className="space-y-2">
              {todaySessions.map((s) => (<li key={s.id}><SessionCard session={s} /></li>))}
            </ul>
          )}
        </Section>
        <Section title={t("dashboard.tomorrowSchedule")} href="/schedule/tomorrow">
          {tomorrowSessions.length === 0 ? (
            <p className="text-xs text-slate-500">{t("schedule.noSessions")}</p>
          ) : (
            <ul className="space-y-2">
              {tomorrowSessions.map((s) => (<li key={s.id}><SessionCard session={s} /></li>))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t("dashboard.latestAnnouncements")} href="/announcements">
          {(anns.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <ul className="space-y-1">
              {(anns.data ?? []).map((a) => (
                <li key={a.id}>
                  <Link href={`/announcements/${a.id}`} className="text-sm hover:text-primary">
                    {a.title}
                    {a.priority === "urgent" && (
                      <span className="ms-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                        {t("common.urgent")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title={t("dashboard.upcomingExams")} href="/calendar?view=agenda">
          {(exams.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <ul className="space-y-1">
              {(exams.data ?? []).map((e) => (
                <li key={e.id} className="flex justify-between text-sm">
                  <Link href={`/calendar/event/${e.id}`} className="hover:text-primary">{e.title}</Link>
                  <span className="text-xs text-slate-500">{new Date(e.starts_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title={t("dashboard.quickLinks")} href="/courses">
        {(courses.data ?? []).length === 0 ? (
          <p className="text-xs text-slate-500">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(courses.data ?? []).map((row) => {
              const c = (row as unknown as { courses: { id: string; code: string; name_en: string } }).courses;
              return (
                <Link key={c.id} href={`/courses/${c.id}`}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  {c.code} · {c.name_en}
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-300">{title}</h2>
        {href && (<Link href={href} className="text-xs text-primary hover:underline">→</Link>)}
      </div>
      {children}
    </section>
  );
}
