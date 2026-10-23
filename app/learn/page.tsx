import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLearningPage() {
  const supabase = await createClient();
  const [{ data: courses, error }, { data: semesters }] = await Promise.all([
    supabase.from("courses").select("id, code, name_en, name_ar, description, semester_id").order("name_en"),
    supabase.from("semesters").select("id, name_en, status"),
  ]);
  const semesterById = new Map((semesters ?? []).map((s) => [s.id, s]));
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><div className="mx-auto max-w-6xl space-y-8">
    <header className="space-y-3"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Open learning library</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Courses and study materials</h1><p className="max-w-2xl text-slate-600">Browse course sessions and open or download lecture PDFs and PowerPoint files. No student account is required.</p></header>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load courses: {error.message}</p>}
    {!error && !(courses ?? []).length && <p className="rounded-lg border bg-white p-6 text-slate-600">No courses have been published yet.</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(courses ?? []).map((course) => <article key={course.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{course.code}</p><h2 className="mt-2 text-lg font-semibold">{course.name_en}</h2>{course.name_ar && <p dir="rtl" className="mt-1 text-sm text-slate-600">{course.name_ar}</p>}
      {course.description && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{course.description}</p>}<p className="mt-3 text-xs text-slate-500">{semesterById.get(course.semester_id)?.name_en ?? "Semester not set"}</p>
      <Link href={`/learn/${course.id}`} className="mt-5 inline-flex w-fit rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800">View sessions</Link></article>)}</div>
    <footer className="border-t pt-5 text-xs text-slate-500">Learning materials are publicly accessible. Uploading and editing content requires an authorized account.</footer>
  </div></main>;
}
