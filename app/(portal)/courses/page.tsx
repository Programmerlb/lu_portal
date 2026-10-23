import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CoursesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  type Row = { id: string; code: string; name_en: string; name_ar: string | null;
    semesters: { name_en: string; status: string } | null };
  let courses: Row[] = [];

  if (profile.role === "student") {
    const { data } = await supabase
      .from("course_enrollments")
      .select("courses(id, code, name_en, name_ar, semesters(name_en,status))")
      .eq("student_id", profile.id);
    courses = (data ?? []).map((r) => (r as unknown as { courses: Row }).courses).filter(Boolean);
  } else if (profile.role === "doctor") {
    const { data } = await supabase
      .from("course_doctors")
      .select("courses(id, code, name_en, name_ar, semesters(name_en,status))")
      .eq("doctor_id", profile.id);
    courses = (data ?? []).map((r) => (r as unknown as { courses: Row }).courses).filter(Boolean);
  } else {
    redirect("/admin/courses");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {profile.role === "doctor" && (
          <p className="text-xs text-slate-500">Courses you are assigned to</p>
        )}
      </div>
      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description={
          profile.role === "student" ? "You are not enrolled in any course." : "You have not been assigned any course yet."
        } />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{c.name_en}</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">{c.code} · {c.semesters?.name_en ?? "—"}</p>
                </div>
                <Badge variant={c.semesters?.status === "active" ? "success" : "neutral"}>
                  {c.semesters?.status ?? "—"}
                </Badge>
              </CardHeader>
              <CardBody className="flex items-center justify-between">
                <p className="text-sm text-slate-600">{c.name_ar ?? ""}</p>
                <Link href={`/courses/${c.id}`}><Button variant="outline" size="sm">Open</Button></Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
