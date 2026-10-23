"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  acknowledgeAnnouncementAction, archiveAnnouncementAction,
  deleteAnnouncementAction, getAnnouncementAttachmentUrlAction,
  publishAnnouncementAction,
} from "@/lib/actions/announcements";

export function AttachmentButton({ announcementId }: { announcementId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button size="sm" variant="outline" disabled={pending}
        onClick={() => start(async () => {
          const r = await getAnnouncementAttachmentUrlAction(announcementId);
          if (!r.ok) setError(r.error);
          else window.open(r.url, "_blank", "noopener,noreferrer");
        })}>
        {pending ? "Opening…" : "Open attachment"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function AcknowledgeButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button disabled={pending} onClick={() => start(async () => {
      await acknowledgeAnnouncementAction(announcementId); router.refresh();
    })}>
      {pending ? "Acknowledging…" : "Acknowledge receipt"}
    </Button>
  );
}

export function PublishButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" disabled={pending} onClick={() => start(async () => {
      await publishAnnouncementAction(announcementId); router.refresh();
    })}>
      {pending ? "Publishing…" : "Publish"}
    </Button>
  );
}

export function ArchiveButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending}
      onClick={() => {
        if (!confirm("Archive this announcement?")) return;
        start(async () => { await archiveAnnouncementAction(announcementId); router.refresh(); });
      }}>
      {pending ? "Archiving…" : "Archive"}
    </Button>
  );
}

export function DeleteAnnouncementButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="danger" disabled={pending}
      onClick={() => {
        if (!confirm("Delete this announcement permanently?")) return;
        start(async () => {
          await deleteAnnouncementAction(announcementId);
          router.push("/admin/announcements");
        });
      }}>
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
