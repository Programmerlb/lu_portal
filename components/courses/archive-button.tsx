"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { archiveCourseAction } from "@/lib/actions/courses";

export function ArchiveButton({ courseId, isArchived }: { courseId: string; isArchived: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant={isArchived ? "outline" : "ghost"} disabled={pending}
        onClick={() => {
          if (!isArchived && !confirm("Archive this course?")) return;
          setError(null);
          start(async () => {
            const res = await archiveCourseAction(courseId, !isArchived);
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}>
        {pending ? "…" : isArchived ? "Restore" : "Archive"}
      </Button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
