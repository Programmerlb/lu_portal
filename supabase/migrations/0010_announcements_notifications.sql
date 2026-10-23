-- =====================================================================
-- 0010: announcement bucket, receipt visibility, notification trigger,
--       realtime publication
-- =====================================================================

create policy "announcements_select_own_drafts"
on public.announcements
for select using (author_id = auth.uid());

drop policy if exists "reads_author_view_receipts" on public.announcement_reads;

create policy "reads_author_or_course_doctor_view_receipts"
on public.announcement_reads
for select using (
  exists (
    select 1 from public.announcements a
    where a.id = announcement_id
      and (a.author_id = auth.uid()
        or (a.course_id is not null and public.is_course_doctor(a.course_id)))
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-attachments', 'announcement-attachments', false, 10485760,
  array['application/pdf','image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

create policy "announcement_attachments_select"
on storage.objects for select
using (bucket_id = 'announcement-attachments'
  and exists (select 1 from public.announcements a
    where a.id::text = split_part(name, '/', 1)));

create policy "announcement_attachments_insert"
on storage.objects for insert
with check (bucket_id = 'announcement-attachments'
  and exists (select 1 from public.announcements a
    where a.id::text = split_part(name, '/', 1) and a.author_id = auth.uid()));

create policy "announcement_attachments_delete"
on storage.objects for delete
using (bucket_id = 'announcement-attachments'
  and exists (select 1 from public.announcements a
    where a.id::text = split_part(name, '/', 1)
      and (a.author_id = auth.uid() or public.is_admin())));

create or replace function public.notify_announcement_published()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  notif_kind text;
  notif_link text;
  author_program uuid;
begin
  if new.status <> 'published' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'published' then return new; end if;

  notif_kind := case when new.priority = 'urgent' then 'urgent_announcement' else 'announcement' end;
  notif_link := '/announcements/' || new.id::text;
  select program_id into author_program from public.profiles where id = new.author_id;

  if new.course_id is not null then
    insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
    select ce.student_id, notif_kind, new.title, left(new.body, 200), notif_link,
           'ann:' || new.id::text
    from public.course_enrollments ce
    where ce.course_id = new.course_id and ce.student_id <> new.author_id
    on conflict do nothing;
  elsif new.target_audience = 'all' then
    insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
    select p.id, notif_kind, new.title, left(new.body, 200), notif_link,
           'ann:' || new.id::text
    from public.profiles p
    where p.role = 'student' and p.is_active = true and p.id <> new.author_id
    on conflict do nothing;
  else
    insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
    select p.id, notif_kind, new.title, left(new.body, 200), notif_link,
           'ann:' || new.id::text
    from public.profiles p
    where p.role = 'student' and p.is_active = true
      and p.program_id = author_program and p.id <> new.author_id
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_announcement_published on public.announcements;
create trigger trg_notify_announcement_published
after insert or update of status on public.announcements
for each row execute function public.notify_announcement_published();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
