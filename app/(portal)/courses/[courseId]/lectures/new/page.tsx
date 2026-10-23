import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageCourse } from "@/lib/permissions";
import { LectureForm } from "@/components/courses/lecture-form";

type Params = { params: Promise<{ courseId: string }> };

export default async function NewLecturePage({ params }: Params) {
  const { courseId } = await params;
  const supabase = await createClient();
  const allowed = await canManageCourse(supabase, courseId);
  if (!allowed) redirect(`/courses/${courseId}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New lecture</h1>
      <LectureForm courseId={courseId} />
    </div>
  );
}
