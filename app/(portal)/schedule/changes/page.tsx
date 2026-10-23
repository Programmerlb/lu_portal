import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const statusVariant: Record<string, "warning" | "primary" | "success" | "danger" | "neutral"> = {
  pending_doctor: "warning", pending_approval: "warning", approved: "primary",
  published: "success", rejected: "danger", cancelled: "neutral",
};

export default async function ChangesListPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data } = await supabase
    .from("schedule_change_requests")
    .select(`
      id, request_type, status, original_date, proposed_date, reason, created_at,
      course:courses(code, name_en)
    `)
    .order("created_at", { ascending: false }).limit(100);

  const canCreate = ["admin", "doctor", "representative"].includes(profile.role);

  return (
    <div className="space-y-6">
      <ScheduleTabs active="/schedule/changes" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Schedule changes</h1>
        {canCreate && (<Link href="/schedule/changes/new"><Button>New request</Button></Link>)}
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState title="No change requests yet" description="Submitted changes will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Course</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Original</th>
                <th className="px-4 py-2">Proposed</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data ?? []).map((r) => {
                const c = (r as unknown as { course: { code: string; name_en: string } }).course;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{c?.name_en ?? "—"}</div>
                      <div className="text-xs text-slate-500">{c?.code ?? ""}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.request_type}</td>
                    <td className="px-4 py-2 text-xs">{r.original_date}</td>
                    <td className="px-4 py-2 text-xs">{r.proposed_date ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge variant={statusVariant[r.status] ?? "neutral"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/schedule/changes/${r.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
