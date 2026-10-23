import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

type Params = { params: Promise<{ id: string }> };

export default async function ReceiptsPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: a } = await supabase.from("announcements")
    .select("id, title, author_id, course_id, target_audience, requires_acknowledgment")
    .eq("id", id).single();
  if (!a) notFound();

  const isAuthor = a.author_id === profile.id;
  const isAdmin = profile.role === "admin";
  const isCourseDoctor = profile.role === "doctor" && a.course_id !== null &&
    (await supabase.from("course_doctors").select("course_id")
      .eq("course_id", a.course_id).eq("doctor_id", profile.id).maybeSingle()).data !== null;
  if (!isAuthor && !isAdmin && !isCourseDoctor) redirect(`/announcements/${id}`);

  type AudienceEntry = { id: string; full_name: string | null; email: string };
  let audience: AudienceEntry[] = [];
  if (a.course_id) {
    const { data } = await supabase.from("course_enrollments")
      .select("student:profiles!course_enrollments_student_id_fkey(id, full_name, email)")
      .eq("course_id", a.course_id);
    audience = (data ?? []).map((r) => (r as unknown as { student: AudienceEntry }).student);
  } else if (a.target_audience === "all") {
    const { data } = await supabase.from("profiles")
      .select("id, full_name, email").eq("role", "student").eq("is_active", true);
    audience = (data ?? []) as AudienceEntry[];
  } else {
    const { data: author } = await supabase.from("profiles").select("program_id").eq("id", a.author_id).single();
    if (author?.program_id) {
      const { data } = await supabase.from("profiles")
        .select("id, full_name, email").eq("role", "student")
        .eq("is_active", true).eq("program_id", author.program_id);
      audience = (data ?? []) as AudienceEntry[];
    }
  }

  const { data: reads } = await supabase.from("announcement_reads")
    .select("user_id, read_at, acknowledged, acknowledged_at").eq("announcement_id", id);
  const readMap = new Map((reads ?? []).map((r) => [r.user_id, r]));

  const total = audience.length;
  const readCount = audience.filter((s) => readMap.has(s.id)).length;
  const ackCount = audience.filter((s) => readMap.get(s.id)?.acknowledged).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><Link href={`/announcements/${id}`} className="text-xs text-primary hover:underline">← Back</Link></div>
      <h1 className="text-2xl font-semibold">Read receipts</h1>
      <p className="text-sm text-slate-600">{a.title}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Audience" value={total} />
        <Stat label="Read" value={`${readCount} / ${total}`} />
        {a.requires_acknowledgment && <Stat label="Acknowledged" value={`${ackCount} / ${total}`} />}
      </div>

      <Card>
        <CardHeader><CardTitle>Per-student status</CardTitle></CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Read at</th>
                {a.requires_acknowledgment && <th className="px-4 py-2">Acknowledged</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audience.map((s) => {
                const r = readMap.get(s.id);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{s.full_name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      {r ? <Badge variant="success">Read</Badge> : <Badge variant="neutral">Unread</Badge>}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {r?.read_at ? new Date(r.read_at).toLocaleString() : "—"}
                    </td>
                    {a.requires_acknowledgment && (
                      <td className="px-4 py-2 text-xs">
                        {r?.acknowledged ? (
                          <span className="text-emerald-700">
                            {r.acknowledged_at ? new Date(r.acknowledged_at).toLocaleString() : "Yes"}
                          </span>
                        ) : (<span className="text-slate-400">—</span>)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
