-- =====================================================================
-- 0008: Private storage bucket for course resources
-- Path convention: {course_id}/{lecture_id or 'general'}/{uuid}-{filename}
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-resources',
  'course-resources',
  false,
  26214400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do nothing;

create or replace function public.storage_course_id(object_name text)
returns uuid language sql immutable
as $$ select nullif(split_part(object_name, '/', 1), '')::uuid; $$;

create policy "storage_course_resources_select"
on storage.objects for select
using (bucket_id = 'course-resources'
  and public.can_view_course(public.storage_course_id(name)));

create policy "storage_course_resources_insert"
on storage.objects for insert
with check (bucket_id = 'course-resources'
  and (public.is_admin() or public.is_course_doctor(public.storage_course_id(name))));

create policy "storage_course_resources_update"
on storage.objects for update
using (bucket_id = 'course-resources'
  and (public.is_admin() or public.is_course_doctor(public.storage_course_id(name)) or owner = auth.uid()));

create policy "storage_course_resources_delete"
on storage.objects for delete
using (bucket_id = 'course-resources'
  and (public.is_admin() or public.is_course_doctor(public.storage_course_id(name)) or owner = auth.uid()));
