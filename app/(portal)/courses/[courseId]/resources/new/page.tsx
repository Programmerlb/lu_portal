import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageCourse } from "@/lib/permissions";
import { ResourceUploadForm } from "@/components/courses/resource-upload-form";

type Params = { params: Promise<{ courseId: string }> };

export default async function NewResourcePage({ params }: Params) {
  const { courseId } = await params;
  const supabase = await createClient();
  const allowed = await canManageCourse(supabase, courseId);
  if (!allowed) redirect(`/courses/${courseId}`);

  const { data: lectures } = await supabase
    .from("lectures").select("id, title").eq("course_id", courseId)
    .order("lecture_date", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Upload resource</h1>
      <ResourceUploadForm courseId={courseId} lectures={lectures ?? []} />
    </div>
  );
}
