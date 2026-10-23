create or replace function public.is_course_doctor(course_uuid uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.course_doctors where course_id = course_uuid and doctor_id = auth.uid()); $$;

create or replace function public.is_course_student(course_uuid uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.course_enrollments where course_id = course_uuid and student_id = auth.uid()); $$;

create or replace function public.course_program(course_uuid uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select s.program_id from public.courses c join public.semesters s on s.id = c.semester_id where c.id = course_uuid limit 1; $$;

create or replace function public.can_view_course(course_uuid uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin()
    or public.is_course_doctor(course_uuid)
    or public.is_course_student(course_uuid)
    or public.course_program(course_uuid) = public.current_user_program();
$$;

alter table public.academic_programs enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;
alter table public.course_doctors enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lectures enable row level security;
alter table public.resources enable row level security;
alter table public.assignments enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.schedule_change_requests enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.portal_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "programs_select_authenticated" on public.academic_programs for select using (auth.uid() is not null);
create policy "programs_admin_write" on public.academic_programs for all using (public.is_admin()) with check (public.is_admin());

create policy "profiles_select_self_or_admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin() or (program_id is not null and program_id = public.current_user_program()));
create policy "profiles_update_self_or_admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

create policy "invitations_admin_only" on public.invitations for all using (public.is_admin()) with check (public.is_admin());

create policy "years_select_authenticated" on public.academic_years for select using (auth.uid() is not null);
create policy "years_admin_write" on public.academic_years for all using (public.is_admin()) with check (public.is_admin());

create policy "semesters_select_authenticated" on public.semesters for select using (auth.uid() is not null);
create policy "semesters_admin_write" on public.semesters for all using (public.is_admin()) with check (public.is_admin());

create policy "courses_select" on public.courses for select using (public.can_view_course(id));
create policy "courses_admin_write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

create policy "course_doctors_select" on public.course_doctors for select using (public.can_view_course(course_id));
create policy "course_doctors_admin_write" on public.course_doctors for all using (public.is_admin()) with check (public.is_admin());

create policy "enrollments_select" on public.course_enrollments for select
  using (student_id = auth.uid() or public.is_course_doctor(course_id) or public.is_admin());
create policy "enrollments_admin_write" on public.course_enrollments for all using (public.is_admin()) with check (public.is_admin());

create policy "lectures_select" on public.lectures for select using (public.can_view_course(course_id));
create policy "lectures_doctor_write" on public.lectures for all
  using (public.is_course_doctor(course_id) or public.is_admin())
  with check (public.is_course_doctor(course_id) or public.is_admin());

create policy "resources_select" on public.resources for select using (public.can_view_course(course_id));
create policy "resources_doctor_write" on public.resources for all
  using (public.is_course_doctor(course_id) or public.is_admin())
  with check (public.is_course_doctor(course_id) or public.is_admin());

create policy "assignments_select" on public.assignments for select using (public.can_view_course(course_id));
create policy "assignments_doctor_write" on public.assignments for all
  using (public.is_course_doctor(course_id) or public.is_admin())
  with check (public.is_course_doctor(course_id) or public.is_admin());

create policy "schedule_entries_select" on public.schedule_entries for select using (public.can_view_course(course_id));
create policy "schedule_entries_admin_write" on public.schedule_entries for all using (public.is_admin()) with check (public.is_admin());

create policy "scr_select" on public.schedule_change_requests for select
  using (public.is_admin() or requested_by = auth.uid() or public.is_course_doctor(course_id)
    or (public.current_user_role() = 'representative' and public.course_program(course_id) = public.current_user_program()));
create policy "scr_insert_authorized" on public.schedule_change_requests for insert
  with check (requested_by = auth.uid() and (
    public.is_admin() or public.is_course_doctor(course_id)
    or (public.current_user_role() = 'representative' and public.course_program(course_id) = public.current_user_program())
  ));
create policy "scr_update_admin" on public.schedule_change_requests for update
  using (public.is_admin()) with check (public.is_admin());

create policy "exceptions_select" on public.schedule_exceptions for select using (public.can_view_course(course_id));
create policy "exceptions_admin_write" on public.schedule_exceptions for all using (public.is_admin()) with check (public.is_admin());

create policy "settings_select_authenticated" on public.portal_settings for select using (auth.uid() is not null);
create policy "settings_admin_write" on public.portal_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "announcements_select_published" on public.announcements for select
  using (status = 'published' and (expires_at is null or expires_at > now()) and (
    public.is_admin()
    or (course_id is not null and public.can_view_course(course_id))
    or (course_id is null and (target_audience = 'all' or author_id = auth.uid() or public.current_user_program() is not null))
  ));
create policy "announcements_admin_select_all" on public.announcements for select using (public.is_admin());
create policy "announcements_select_own_drafts" on public.announcements for select using (author_id = auth.uid());

create policy "announcements_insert_authorized" on public.announcements for insert
  with check (author_id = auth.uid() and (
    public.is_admin()
    or (public.current_user_role() = 'doctor' and course_id is not null and public.is_course_doctor(course_id) and category = 'doctor')
    or (public.current_user_role() = 'representative' and category in ('representative','majles_tolab')
        and (course_id is null or public.course_program(course_id) = public.current_user_program()))
  ));
create policy "announcements_update_author_or_admin" on public.announcements for update
  using (public.is_admin() or (author_id = auth.uid() and status = 'draft'))
  with check (public.is_admin() or (author_id = auth.uid() and status in ('draft','published')));

create policy "reads_own" on public.announcement_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reads_author_view_receipts" on public.announcement_reads for select
  using (exists (select 1 from public.announcements a where a.id = announcement_id and a.author_id = auth.uid()));

create policy "events_select_relevant" on public.calendar_events for select
  using (public.is_admin() or (course_id is not null and public.can_view_course(course_id))
    or (course_id is null and is_program_wide) or created_by = auth.uid());
create policy "events_write_authorized" on public.calendar_events for all
  using (public.is_admin() or (course_id is not null and public.is_course_doctor(course_id)) or created_by = auth.uid())
  with check (public.is_admin() or (course_id is not null and public.is_course_doctor(course_id))
    or (created_by = auth.uid() and course_id is null and is_program_wide));

create policy "notifications_own" on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "audit_admin_select" on public.audit_logs for select using (public.is_admin());
create policy "audit_self_insert" on public.audit_logs for insert
  with check (actor_id = auth.uid() or public.is_admin());
