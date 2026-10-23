"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCalendarEventAction } from "@/lib/actions/calendar";

export function DeleteCalendarEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="danger" disabled={pending}
      onClick={() => {
        if (!confirm("Delete this event?")) return;
        start(async () => {
          const r = await deleteCalendarEventAction(eventId);
          if (r.ok) router.push("/calendar");
          else alert(r.error);
        });
      }}>
      {pending ? "Deleting…" : "Delete event"}
    </Button>
  );
}
