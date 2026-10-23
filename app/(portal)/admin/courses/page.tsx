import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteCourseAction } from "@/lib/actions/courses";
import { DeleteButton } from "@/components/courses/delete-button";
import { ArchiveButton } from "@/components/courses/archive-button";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) redirect("/dashboard");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, code, name_en, semesters(name_en,status)")
    .order("code");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses (Admin)</h1>
        <Link href="/admin/courses/new"><Button>New course</Button></Link>
      </div>

      {(courses ?? []).length === 0 ? (
        <EmptyState title="No courses yet" description="Create the first course." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Semester</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(courses ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-2">{c.name_en}</td>
                  <td className="px-4 py-2">
                    {(c as unknown as { semesters: { name_en: string } | null }).semesters?.name_en ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="neutral">
                      {(c as unknown as { semesters: { status: string } | null }).semesters?.status ?? "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/courses/${c.id}`}><Button size="sm" variant="ghost">Open</Button></Link>
                      <Link href={`/admin/courses/${c.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
                      <ArchiveButton courseId={c.id} isArchived={false} />
                      <DeleteButton action={async () => { "use server"; await deleteCourseAction(c.id); }} label="Delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
