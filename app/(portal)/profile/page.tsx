import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/profile-form";
import { updateProfileAction } from "@/lib/actions/profile";

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: full, error } = await supabase.from("profiles")
    .select("full_name, full_name_ar, email, role, student_id, phone, program_id, is_active, created_at, academic_programs(name_en, name_ar)")
    .eq("id", profile.id).single();

  const program = (full as unknown as { academic_programs: { name_en: string; name_ar: string } | null } | null)?.academic_programs;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {error || !full ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">Could not load your profile. Please refresh or contact the administrator.</p> : (
        <>
          <Card>
            <CardHeader><CardTitle>{full.full_name ?? full.email}</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              <Row label="Email" value={full.email ?? "—"} />
              <Row label="Role" value={<Badge variant="primary">{full.role ?? "—"}</Badge>} />
              <Row label="Program" value={program?.name_en ?? "—"} />
              <Row label="Active" value={full.is_active ? "Yes" : "No"} />
              <Row label="Member since" value={full.created_at ? new Date(full.created_at).toLocaleDateString() : "—"} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
            <CardBody>
              <p className="mb-4 text-sm text-slate-500">You can update your contact and display details. Email, role, and academic program are managed separately for security.</p>
              <ProfileForm action={updateProfileAction} defaults={{
                full_name: full.full_name ?? "",
                full_name_ar: full.full_name_ar ?? "",
                phone: full.phone ?? "",
                student_id: full.student_id ?? "",
              }} />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1 last:border-0 dark:border-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="text-end">{value}</span>
    </div>
  );
}
