import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageCourse, getCurrentProfile } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceDownloadButton } from "./resource-download-button";

type Params = { params: Promise<{ courseId: string }> };

export default async function CourseDetailPage({ params }: Params) {
  const { courseId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, code, name_en, name_ar, description, credits, semester_id, semesters(name_en,status)")
    .eq("id", courseId).single();
  if (!course) notFound();

  const [{ data: doctors }, { data: lectures }, { data: resources }] = await Promise.all([
    supabase.from("course_doctors")
      .select("profiles!course_doctors_doctor_id_fkey(id, full_name, email)")
      .eq("course_id", courseId),
    supabase.from("lectures")
      .select("id, title, week_number, lecture_date")
      .eq("course_id", courseId)
      .order("lecture_date", { ascending: false, nullsFirst: false }),
    supabase.from("resources")
      .select("id, title, lecture_id, storage_path, external_url, mime_type")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  const canManage = await canManageCourse(supabase, courseId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{course.name_en}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {course.code} · {course.semesters?.[0]?.name_en ?? "—"}
            {course.credits ? ` · ${course.credits} credits` : ""}
          </p>
          {course.name_ar && <p className="mt-1 text-sm text-slate-700">{course.name_ar}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={course.semesters?.[0]?.status === "active" ? "success" : "neutral"}>
            {course.semesters?.[0]?.status ?? "—"}
          </Badge>
          {canManage && (
            <>
              <Link href={`/courses/${courseId}/lectures/new`}>
                <Button size="sm">New lecture</Button>
              </Link>
              <Link href={`/courses/${courseId}/resources/new`}>
                <Button size="sm" variant="outline">Upload resource</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {course.description && (
        <Card><CardBody className="text-sm text-slate-700 whitespace-pre-wrap">{course.description}</CardBody></Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Doctors</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            {(doctors ?? []).length === 0 && <p className="text-slate-500">No doctors assigned</p>}
            {(doctors ?? []).map((d) => {
              const p = (d as unknown as { profiles: { full_name: string | null; email: string } }).profiles;
              return (
                <div key={p.email}>
                  <p className="font-medium">{p.full_name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Lectures</CardTitle>
            <span className="text-xs text-slate-500">{(lectures ?? []).length}</span>
          </CardHeader>
          <CardBody className="space-y-2">
            {(lectures ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No lectures yet.</p>
            ) : (lectures ?? []).map((l) => (
              <Link key={l.id} href={`/courses/${courseId}/lectures/${l.id}`}
                className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{l.title}</span>
                  <span className="text-xs text-slate-500">
                    {l.lecture_date ?? ""}{l.week_number ? ` · W${l.week_number}` : ""}
                  </span>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
        <CardBody>
          {(resources ?? []).length === 0 ? (
            <EmptyState title="No resources yet" description={
              canManage ? "Upload files or external links." : "The doctor has not uploaded any resource yet."
            } />
          ) : (
            <ul className="divide-y divide-slate-100">
              {(resources ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.storage_path ? r.mime_type ?? "file" : r.external_url ?? "external link"}
                    </p>
                  </div>
                  <ResourceDownloadButton resourceId={r.id} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
        {canManage && (
          <CardFooter className="text-xs text-slate-500">
            Uploads are private. Download links are signed and expire after 1 hour.
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
