import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/permissions";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangeWorkflowButtons } from "@/components/schedule/change-workflow-buttons";

type Params = { params: Promise<{ id: string }> };

export default async function ChangeRequestDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  const { data: req } = await supabase.from("schedule_change_requests")
    .select(`
      id, request_type, status, original_date, original_start_time, original_end_time,
      proposed_date, proposed_start_time, proposed_end_time, proposed_room,
      proposed_doctor_id, proposed_online_link, reason, created_at,
      course_id, requested_by, course:courses(id, code, name_en)
    `).eq("id", id).single();
  if (!req) notFound();

  const { data: isCourseDoctorRow } = await supabase.from("course_doctors")
    .select("course_id").eq("course_id", req.course_id).eq("doctor_id", profile.id).maybeSingle();

  const { data: settings } = await supabase.from("portal_settings")
    .select("schedule_approval_policy").eq("id", 1).single();

  const isAdmin = profile.role === "admin";
  const isDoctor = profile.role === "doctor" && !!isCourseDoctorRow;
  const isRep = profile.role === "representative";
  const policy = settings?.schedule_approval_policy ?? "doctor_then_admin";

  const canConfirm = (isDoctor || isAdmin) && req.status === "pending_doctor";
  const canApprove = isAdmin && req.status === "pending_approval" && policy === "doctor_then_admin";
  const canPublish =
    (isAdmin && req.status === "approved") ||
    (policy === "doctor_then_rep" && (isRep || isAdmin) && req.status === "pending_approval") ||
    (policy === "admin_only" && isAdmin);
  const canReject = (isDoctor || isAdmin) && ["pending_doctor", "pending_approval"].includes(req.status);
  const c = (req as unknown as { course: { code: string; name_en: string } }).course;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScheduleTabs active="/schedule/changes" />
      <div className="flex items-center justify-between">
        <Link href="/schedule/changes" className="text-xs text-primary hover:underline">← All changes</Link>
        <Badge variant="neutral">{req.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{c?.name_en} <span className="text-xs text-slate-500">({c?.code})</span></CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label="Request type" value={req.request_type} />
          <Row label="Reason" value={req.reason} />
          <Row label="Original"
            value={`${req.original_date} ${req.original_start_time ?? ""}–${req.original_end_time ?? ""}`.trim()} />
          {(req.proposed_date || req.proposed_start_time || req.proposed_room) && (
            <Row label="Proposed" value={[
              req.proposed_date,
              `${req.proposed_start_time ?? ""}–${req.proposed_end_time ?? ""}`.trim(),
              req.proposed_room, req.proposed_online_link,
            ].filter(Boolean).join(" · ")} />
          )}
          <Row label="Submitted" value={new Date(req.created_at).toLocaleString()} />
        </CardBody>
      </Card>

      {(canConfirm || canApprove || canPublish || canReject) && (
        <Card>
          <CardHeader><CardTitle>Workflow actions</CardTitle></CardHeader>
          <CardBody>
            <ChangeWorkflowButtons requestId={req.id} canConfirm={canConfirm}
              canApprove={canApprove} canPublish={canPublish} canReject={canReject} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-1 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-800">{value || "—"}</span>
    </div>
  );
}
