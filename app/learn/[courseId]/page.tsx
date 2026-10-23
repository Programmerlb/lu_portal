import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ courseId: string }> };

export default async function PublicCoursePage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id, code, name_en, name_ar, description, semester_id").eq("id", courseId).maybeSingle();
  if (!course) notFound();
  const [{ data: semester }, { data: sessions }, { data: resources }] = await Promise.all([
    supabase.from("semesters").select("name_en").eq("id", course.semester_id).maybeSingle(),
    supabase.from("lectures").select("id, title, title_ar, description, week_number, lecture_date").eq("course_id", courseId).order("lecture_date", { ascending: true, nullsFirst: false }),
    supabase.from("resources").select("id, title, description, lecture_id, storage_path, external_url, mime_type").eq("course_id", courseId).order("created_at", { ascending: true }),
  ]);
  const filesBySession = new Map<string, NonNullable<typeof resources>>();
  for (const resource of resources ?? []) if (resource.lecture_id) filesBySession.set(resource.lecture_id, [...(filesBySession.get(resource.lecture_id) ?? []), resource]);
  const generalFiles = (resources ?? []).filter((r) => !r.lecture_id);
  const urlFor = (path: string) => supabase.storage.from("course-resources").getPublicUrl(path).data.publicUrl;
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><div className="mx-auto max-w-4xl space-y-7">
    <Link href="/learn" className="text-sm font-medium text-indigo-700 hover:underline">← All courses</Link>
    <header className="rounded-xl border bg-white p-6"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{course.code} · {semester?.name_en ?? "Course"}</p><h1 className="mt-2 text-3xl font-bold">{course.name_en}</h1>{course.name_ar && <p dir="rtl" className="mt-2 text-lg text-slate-600">{course.name_ar}</p>}{course.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{course.description}</p>}</header>
    <section className="space-y-4"><div><h2 className="text-xl font-semibold">Sessions</h2><p className="mt-1 text-sm text-slate-600">{(sessions ?? []).length} sessions</p></div>
      {!(sessions ?? []).length && <p className="rounded-lg border bg-white p-5 text-sm text-slate-600">No sessions have been added yet.</p>}
      {(sessions ?? []).map((session, index) => <article key={session.id} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase text-indigo-700">Session {session.week_number ?? index + 1}{session.lecture_date ? ` · ${session.lecture_date}` : ""}</p><h3 className="mt-1 text-lg font-semibold">{session.title}</h3>{session.title_ar && <p dir="rtl" className="text-sm text-slate-600">{session.title_ar}</p>}{session.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{session.description}</p>}<ResourceList resources={filesBySession.get(session.id) ?? []} urlFor={urlFor}/></article>)}
    </section>
    {!!generalFiles.length && <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Course materials</h2><ResourceList resources={generalFiles} urlFor={urlFor}/></section>}
  </div></main>;
}

type Resource = { id: string; title: string; description: string | null; storage_path: string | null; external_url: string | null; mime_type: string | null };
function ResourceList({ resources, urlFor }: { resources: Resource[]; urlFor: (path: string) => string }) {
  if (!resources.length) return <p className="mt-3 text-sm text-slate-500">No files attached.</p>;
  return <ul className="mt-3 divide-y divide-slate-100">{resources.map((r) => { const href = r.storage_path ? urlFor(r.storage_path) : r.external_url; if (!href) return null; return <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-medium">{r.title}</p>{r.description && <p className="text-sm text-slate-600">{r.description}</p>}<p className="text-xs text-slate-500">{r.mime_type ?? (r.storage_path ? "File" : "External link")}</p></div><a href={href} target="_blank" rel="noopener noreferrer" className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800">{r.storage_path ? "Open / download" : "Open link"}</a></li>; })}</ul>;
}
