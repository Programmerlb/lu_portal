import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

type Params = { params: Promise<{ courseId: string; lectureId: string }> };

export default async function LectureDetailPage({ params }: Params) {
  const { courseId, lectureId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: lecture } = await supabase
    .from("lectures")
    .select("id, title, title_ar, description, week_number, lecture_date, course_id")
    .eq("id", lectureId).eq("course_id", courseId).single();
  if (!lecture) notFound();

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, storage_path, external_url, mime_type")
    .eq("lecture_id", lectureId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/courses/${courseId}`} className="text-xs text-primary hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{lecture.title}</h1>
        {lecture.title_ar && <p className="text-sm text-slate-700">{lecture.title_ar}</p>}
        <p className="mt-1 text-xs text-slate-500">
          {lecture.lecture_date ?? ""}{lecture.week_number ? ` · Week ${lecture.week_number}` : ""}
        </p>
      </div>

      {lecture.description && (
        <Card><CardBody className="text-sm text-slate-700 whitespace-pre-wrap">{lecture.description}</CardBody></Card>
      )}

      <Card>
        <CardHeader><CardTitle>Attached resources</CardTitle></CardHeader>
        <CardBody>
          {(resources ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No resources attached to this lecture.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(resources ?? []).map((r) => (
                <li key={r.id} className="py-2 text-sm">
                  {r.title}
                  {r.external_url && (
                    <a href={r.external_url} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-xs text-primary hover:underline">(external link)</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
