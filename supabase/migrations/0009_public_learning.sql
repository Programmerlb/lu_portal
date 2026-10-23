-- Public read-only learning catalog. Writes remain protected by existing admin/doctor policies.
-- Files in this bucket are intentionally publicly downloadable for open learning access.

drop policy if exists "public_learning_programs_read" on public.academic_programs;
create policy "public_learning_programs_read" on public.academic_programs
  for select to anon, authenticated using (true);

drop policy if exists "public_learning_years_read" on public.academic_years;
create policy "public_learning_years_read" on public.academic_years
  for select to anon, authenticated using (true);

drop policy if exists "public_learning_semesters_read" on public.semesters;
create policy "public_learning_semesters_read" on public.semesters
  for select to anon, authenticated using (true);

drop policy if exists "public_learning_courses_read" on public.courses;
create policy "public_learning_courses_read" on public.courses
  for select to anon, authenticated using (true);

drop policy if exists "public_learning_lectures_read" on public.lectures;
create policy "public_learning_lectures_read" on public.lectures
  for select to anon, authenticated using (true);

drop policy if exists "public_learning_resources_read" on public.resources;
create policy "public_learning_resources_read" on public.resources
  for select to anon, authenticated using (true);

update storage.buckets
set public = true,
    file_size_limit = 26214400,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
where id = 'course-resources';

drop policy if exists "public_course_resources_download" on storage.objects;
create policy "public_course_resources_download"
on storage.objects for select to anon, authenticated
using (bucket_id = 'course-resources');
