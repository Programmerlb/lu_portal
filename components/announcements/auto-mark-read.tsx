"use client";

import { useEffect } from "react";
import { markAnnouncementReadAction } from "@/lib/actions/announcements";

export function AutoMarkRead({ announcementId }: { announcementId: string }) {
  useEffect(() => { void markAnnouncementReadAction(announcementId); }, [announcementId]);
  return null;
}
