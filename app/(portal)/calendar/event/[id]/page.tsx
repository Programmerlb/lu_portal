import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteCalendarEventButton } from "./delete-button";

type Params = { params: Promise<{ id: string }> };

export default async function CalendarEventPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const { t } = await getT();

  const { data: ev } = await supabase.from("calendar_events")
    .select("id, title, description, category, starts_at, ends_at, location, course_id, is_program_wide, created_by, course:courses(code, name_en)")
    .eq("id", id).single();
  if (!ev) notFound();
  const isAdmin = profile.role === "admin";
  const course = (ev as unknown as { course: { code: string; name_en: string } | null }).course;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/calendar" className="text-xs text-primary hover:underline">← {t("calendar.title")}</Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{ev.title}</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="primary">{t(`calendar.categories.${ev.category}` as const)}</Badge>
            {course && <Badge variant="neutral">{course.code} · {course.name_en}</Badge>}
            {ev.is_program_wide && <Badge variant="neutral">Program-wide</Badge>}
          </div>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <p><span className="text-slate-500">Starts: </span>{new Date(ev.starts_at).toLocaleString()}</p>
          {ev.ends_at && (<p><span className="text-slate-500">Ends: </span>{new Date(ev.ends_at).toLocaleString()}</p>)}
          {ev.location && (<p><span className="text-slate-500">Location: </span>{ev.location}</p>)}
          {ev.description && (
            <p className="whitespace-pre-wrap pt-2 text-slate-800 dark:text-slate-200">{ev.description}</p>
          )}
        </CardBody>
      </Card>
      {isAdmin && <DeleteCalendarEventButton eventId={ev.id} />}
    </div>
  );
}
