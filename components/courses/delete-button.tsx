"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteButton({ action, label }: { action: () => Promise<unknown>; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button type="button" variant="danger" size="sm" disabled={pending}
      onClick={() => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        start(async () => { await action(); });
      }}>
      {pending ? "Deleting…" : label}
    </Button>
  );
}
