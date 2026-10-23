import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { todayInTz } from "@/lib/date-utils";
import { getActualScheduleForDate } from "@/lib/schedule-engine";
import { SessionCard } from "@/components/schedule/session-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RepDashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  if (profile.role !== "representative") redirect("/dashboard");
  const { t } = await getT();
  const today = todayInTz();

  const [todaySessions, pending, drafts] = await Promise.all([
    getActualScheduleForDate(supabase, today),
    supabase.from("schedule_change_requests")
      .select("id, request_type, status, original_date, course:courses(code, name_en)")
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("announcements")
      .select("id, title, status, created_at").eq("author_id", profile.id)
      .eq("status", "draft").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard.welcome")}, {profile.full_name ?? profile.email}</h1>

      <Card>
        <CardHeader><CardTitle>{t("dashboard.todaySchedule")}</CardTitle></CardHeader>
        <CardBody>
          {todaySessions.length === 0 ? (
            <p className="text-xs text-slate-500">{t("schedule.noSessions")}</p>
          ) : (
            <ul className="space-y-2">
              {todaySessions.map((s) => (<li key={s.id}><SessionCard session={s} /></li>))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("nav.changeRequests")}</CardTitle></CardHeader>
        <CardBody>
          {(pending.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(pending.data ?? []).map((r) => {
                const c = (r as unknown as { course: { code: string; name_en: string } }).course;
                return (
                  <li key={r.id} className="flex justify-between">
                    <Link href={`/schedule/changes/${r.id}`} className="hover:text-primary">
                      {c?.code} — {r.request_type}
                    </Link>
                    <span className="text-xs text-slate-500">{r.status}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Drafts</CardTitle></CardHeader>
        <CardBody>
          {(drafts.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(drafts.data ?? []).map((a) => (
                <li key={a.id}>
                  <Link href={`/announcements/${a.id}/edit`} className="hover:text-primary">{a.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
