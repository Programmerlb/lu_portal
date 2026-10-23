import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DoctorDashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  if (profile.role !== "doctor") redirect("/dashboard");
  const { t } = await getT();

  const [{ data: courses }, { data: pending }, { data: anns }] = await Promise.all([
    supabase.from("course_doctors").select("courses(id, code, name_en)").eq("doctor_id", profile.id),
    supabase.from("schedule_change_requests")
      .select("id, request_type, original_date, course:courses(code, name_en)")
      .eq("status", "pending_doctor").order("created_at", { ascending: false }).limit(5),
    supabase.from("announcements")
      .select("id, title, category, published_at").eq("author_id", profile.id)
      .eq("status", "published").order("published_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard.welcome")}, {profile.full_name ?? profile.email}</h1>

      <Card>
        <CardHeader><CardTitle>{t("dashboard.assignedCourses")}</CardTitle></CardHeader>
        <CardBody>
          {(courses ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(courses ?? []).map((row) => {
                const c = (row as unknown as { courses: { id: string; code: string; name_en: string } }).courses;
                return (
                  <Link key={c.id} href={`/courses/${c.id}`}
                    className="rounded-md border bg-white px-3 py-1.5 text-xs hover:bg-slate-50 dark:bg-slate-800">
                    {c.code} · {c.name_en}
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("dashboard.pendingConfirmations")}</CardTitle></CardHeader>
        <CardBody>
          {(pending ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(pending ?? []).map((r) => {
                const c = (r as unknown as { course: { code: string; name_en: string } }).course;
                return (
                  <li key={r.id} className="flex justify-between">
                    <Link href={`/schedule/changes/${r.id}`} className="hover:text-primary">
                      {c?.code} — {r.request_type}
                    </Link>
                    <span className="text-xs text-slate-500">{r.original_date}</span>
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
          {(anns ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(anns ?? []).map((a) => (
                <li key={a.id}>
                  <Link href={`/announcements/${a.id}`} className="hover:text-primary">{a.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
