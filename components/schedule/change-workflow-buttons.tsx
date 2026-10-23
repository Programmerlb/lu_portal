"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  approveChangeRequestAction, confirmChangeRequestAction,
  publishChangeRequestAction, rejectChangeRequestAction,
} from "@/lib/actions/schedule";

export function ChangeWorkflowButtons({
  requestId, canConfirm, canApprove, canPublish, canReject,
}: {
  requestId: string; canConfirm: boolean; canApprove: boolean;
  canPublish: boolean; canReject: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, label: string) => {
    setError(null); setInfo(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error); else setInfo(`${label} succeeded.`);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canConfirm && (
          <Button onClick={() => run(() => confirmChangeRequestAction(requestId), "Confirmation")} disabled={pending}>
            Confirm as doctor
          </Button>
        )}
        {canApprove && (
          <Button onClick={() => run(() => approveChangeRequestAction(requestId), "Approval")} disabled={pending}>
            Approve
          </Button>
        )}
        {canPublish && (
          <Button onClick={() => run(() => publishChangeRequestAction(requestId), "Publication")} disabled={pending}>
            Publish change
          </Button>
        )}
        {canReject && (
          <Button variant="danger" disabled={pending}
            onClick={() => {
              const reason = prompt("Rejection reason:");
              if (!reason) return;
              run(() => rejectChangeRequestAction(requestId, reason), "Rejection");
            }}>
            Reject
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-emerald-700">{info}</p>}
    </div>
  );
}
