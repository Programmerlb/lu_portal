import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationList, type NotificationRow } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("notifications")
    .select("id, kind, title, body, link, is_read, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);

  return (
    <div className="mx-auto max-w-3xl">
      <NotificationList items={(data ?? []) as NotificationRow[]} />
    </div>
  );
}
