"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";

export interface NotificationItem {
  id: string; kind: string; title: string; link: string | null; created_at: string;
}

export function NotificationBell({ userId, initialItems, initialCount }: {
  userId: string; initialItems: NotificationItem[]; initialCount: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const row = payload.new as NotificationItem & { is_read: boolean };
        if (row.is_read) return;
        setItems((prev) => [row, ...prev].slice(0, 10));
        setCount((c) => c + 1);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="relative rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        aria-label="Notifications">
        Bell
        {count > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs">
            <span className="font-medium">Notifications</span>
            {count > 0 && (
              <button className="text-primary hover:underline"
                onClick={async () => {
                  await markAllNotificationsReadAction();
                  setItems([]); setCount(0); router.refresh();
                }}>
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (<li className="px-3 py-4 text-xs text-slate-500">No unread notifications.</li>)}
            {items.map((n) => (
              <li key={n.id} className="border-b border-slate-100 last:border-0">
                <Link href={n.link ?? "/notifications"} className="block px-3 py-2 hover:bg-slate-50"
                  onClick={() => setOpen(false)}>
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 p-2 text-center">
            <Link href="/notifications" className="text-xs text-primary hover:underline">View all notifications</Link>
          </div>
        </div>
      )}
    </div>
  );
}
