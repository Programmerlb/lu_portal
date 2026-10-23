"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

export interface NotificationRow {
  id: string; kind: string; title: string; body: string | null;
  link: string | null; is_read: boolean; created_at: string;
}

export function NotificationList({ items }: { items: NotificationRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button size="sm" variant="outline"
          disabled={pending || items.every((i) => i.is_read)}
          onClick={() => start(async () => {
            await markAllNotificationsReadAction(); router.refresh();
          })}>
          {pending ? "Updating…" : "Mark all as read"}
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className={`rounded-lg border bg-white p-4 shadow-sm ${
              n.is_read ? "border-slate-200" : "border-primary/30 bg-primary/5"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {n.link && (
                    <Link href={n.link} className="text-xs text-primary hover:underline"
                      onClick={() => { if (!n.is_read) void markNotificationReadAction(n.id); }}>
                      Open
                    </Link>
                  )}
                  {!n.is_read && (
                    <button className="text-[10px] text-slate-500 hover:underline"
                      onClick={() => start(async () => {
                        await markNotificationReadAction(n.id); router.refresh();
                      })}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
