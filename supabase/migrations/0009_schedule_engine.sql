-- =====================================================================
-- 0009: new_date column, indexes, upgraded publish_schedule_change
-- =====================================================================

alter table public.schedule_exceptions
  add column if not exists new_date date;

create index if not exists idx_exceptions_new_date
  on public.schedule_exceptions(new_date);

create index if not exists idx_exceptions_source_or_target
  on public.schedule_exceptions(exception_date, new_date);

create or replace function public.publish_schedule_change(request_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  policy text;
  new_exception_id uuid;
  notif_link text;
  eff_date date;
  eff_new_date date;
begin
  select * into r from public.schedule_change_requests where id = request_id for update;
  if not found then raise exception 'Request not found'; end if;

  select schedule_approval_policy into policy from public.portal_settings where id = 1;

  if policy = 'doctor_then_admin' then
    if r.status <> 'approved' then raise exception 'Request must be approved first'; end if;
    if not public.is_admin() then raise exception 'Only administrators can publish under this policy'; end if;
  elsif policy = 'doctor_then_rep' then
    if r.status not in ('pending_approval', 'approved') then
      raise exception 'Request must be doctor-confirmed';
    end if;
    if not public.is_admin() and public.current_user_role() <> 'representative' then
      raise exception 'Only the representative or an admin can publish under this policy';
    end if;
  elsif policy = 'admin_only' then
    if not public.is_admin() then raise exception 'Only administrators can publish'; end if;
  end if;

  eff_date := case
    when r.request_type = 'additional' then coalesce(r.proposed_date, r.original_date)
    else r.original_date
  end;

  eff_new_date := case
    when r.request_type in ('rescheduled', 'replacement')
         and r.proposed_date is not null
         and r.proposed_date <> r.original_date
      then r.proposed_date
    else null
  end;

  insert into public.schedule_exceptions (
    request_id, schedule_entry_id, course_id, exception_date, new_date, exception_type,
    original_start_time, original_end_time, new_start_time, new_end_time,
    new_room, new_doctor_id, new_online_link, created_by
  ) values (
    r.id, r.schedule_entry_id, r.course_id, eff_date, eff_new_date,
    case r.request_type
      when 'reschedule'    then 'rescheduled'::public.exception_type
      when 'cancel'        then 'cancelled'::public.exception_type
      when 'room_change'   then 'room_changed'::public.exception_type
      when 'doctor_change' then 'doctor_changed'::public.exception_type
      when 'replacement'   then 'replacement'::public.exception_type
      when 'additional'    then 'additional'::public.exception_type
    end,
    r.original_start_time, r.original_end_time,
    r.proposed_start_time, r.proposed_end_time,
    r.proposed_room, r.proposed_doctor_id, r.proposed_online_link,
    auth.uid()
  ) returning id into new_exception_id;

  update public.schedule_change_requests
  set status = 'published', published_by = auth.uid(), published_at = now()
  where id = request_id;

  notif_link := '/schedule/date/' || coalesce(eff_new_date, eff_date)::text;
  insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
  select ce.student_id, 'schedule_change',
         'Schedule change confirmed',
         'A class session for your course has been updated.',
         notif_link, 'scr:' || r.id::text
  from public.course_enrollments ce
  where ce.course_id = r.course_id
  on conflict (user_id, dedupe_key) do nothing;

  return new_exception_id;
end;
$$;
