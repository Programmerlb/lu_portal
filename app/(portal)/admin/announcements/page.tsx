import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteAnnouncementButton } from "@/components/announcements/announcement-actions";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ["admin"]);
  if (!gate.ok) redirect("/dashboard");

  const { data } = await supabase.from("announcements")
    .select(`
      id, title, category, status, published_at, created_at,
      author:profiles!announcements_author_id_fkey(full_name)
    `).order("created_at", { ascending: false }).limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Announcements (Admin)</h1>
        <Link href="/announcements/new"><Button>New announcement</Button></Link>
      </div>
      {(data ?? []).length === 0 ? (
        <EmptyState title="No announcements" description="Create the first one." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Author</th>
                <th className="px-4 py-2">Published</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data ?? []).map((a) => {
                const author = (a as unknown as { author: { full_name: string | null } | null }).author;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-2">
                      <Link href={`/announcements/${a.id}`} className="hover:text-primary">{a.title}</Link>
                    </td>
                    <td className="px-4 py-2 text-xs"><Badge variant="neutral">{a.category}</Badge></td>
                    <td className="px-4 py-2 text-xs">
                      <Badge variant={a.status === "published" ? "success" : a.status === "draft" ? "warning" : "neutral"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs">{author?.full_name ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">
                      {a.published_at ? new Date(a.published_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/announcements/${a.id}/edit`}>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </Link>
                      <DeleteAnnouncementButton announcementId={a.id} />
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
