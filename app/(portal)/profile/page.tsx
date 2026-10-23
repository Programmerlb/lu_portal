import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: full } = await supabase.from("profiles")
    .select("full_name, full_name_ar, email, role, student_id, phone, program_id, is_active, created_at, academic_programs(name_en, name_ar)")
    .eq("id", profile.id).single();

  const program = (full as unknown as { academic_programs: { name_en: string; name_ar: string } | null })?.academic_programs;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card>
        <CardHeader><CardTitle>{full?.full_name ?? full?.email}</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label="Email" value={full?.email ?? "—"} />
          <Row label="Arabic name" value={full?.full_name_ar ?? "—"} />
          <Row label="Role" value={<Badge variant="primary">{full?.role ?? "—"}</Badge>} />
          <Row label="Student ID" value={full?.student_id ?? "—"} />
          <Row label="Phone" value={full?.phone ?? "—"} />
          <Row label="Program" value={program?.name_en ?? "—"} />
          <Row label="Active" value={full?.is_active ? "Yes" : "No"} />
          <Row label="Member since" value={full?.created_at ? new Date(full.created_at).toLocaleDateString() : "—"} />
        </CardBody>
      </Card>
      <p className="text-xs text-slate-500">To update your profile, contact the administration.</p>
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
