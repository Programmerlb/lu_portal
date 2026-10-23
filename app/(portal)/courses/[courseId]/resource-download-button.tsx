"use client";

import { useState, useTransition } from "react";
import { getSignedUrlAction } from "@/lib/actions/resources";
import { Button } from "@/components/ui/button";

export function ResourceDownloadButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await getSignedUrlAction(resourceId);
      if (!res.ok) { setError(res.error); return; }
      window.open(res.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="flex flex-col items-end">
      <Button size="sm" variant="outline" onClick={onClick} disabled={pending}>
        {pending ? "Preparing…" : "Open"}
      </Button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </div>
  );
}
