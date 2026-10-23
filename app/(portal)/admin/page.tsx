import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) redirect("/dashboard");
  const { t } = await getT();

  const [
    { count: userCount }, { count: doctorCount }, { count: studentCount },
    { count: courseCount }, { count: pendingApprovals },
    { data: recentChanges }, { data: recentAnnouncements },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "doctor"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("schedule_change_requests").select("*", { count: "exact", head: true })
      .in("status", ["pending_doctor", "pending_approval", "approved"]),
    supabase.from("schedule_change_requests")
      .select("id, request_type, status, created_at, course:courses(code, name_en)")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("announcements").select("id, title, category, published_at")
      .eq("status", "published").order("published_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("nav.dashboard")} — Admin</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active users" value={userCount ?? 0} />
        <Stat label="Doctors" value={doctorCount ?? 0} />
        <Stat label="Students" value={studentCount ?? 0} />
        <Stat label="Courses" value={courseCount ?? 0} />
        <Stat label={t("dashboard.pendingApprovals")} value={pendingApprovals ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.scheduleChanges")}</CardTitle></CardHeader>
          <CardBody>
            {(recentChanges ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(recentChanges ?? []).map((r) => {
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
          <CardHeader><CardTitle>{t("dashboard.latestAnnouncements")}</CardTitle></CardHeader>
          <CardBody>
            {(recentAnnouncements ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(recentAnnouncements ?? []).map((a) => (
                  <li key={a.id}>
                    <Link href={`/announcements/${a.id}`} className="hover:text-primary">{a.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/courses" className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:bg-slate-800">
          {t("nav.courses")}
        </Link>
        <Link href="/schedule/changes" className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:bg-slate-800">
          {t("nav.changeRequests")}
        </Link>
        <Link href="/admin/announcements" className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:bg-slate-800">
          {t("nav.announcements")}
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
