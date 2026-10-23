-- =====================================================================
-- 0011: soft archive on courses + supporting index
-- =====================================================================
alter table public.courses
  add column if not exists is_archived boolean not null default false;

create index if not exists idx_courses_not_archived
  on public.courses(semester_id)
  where is_archived = false;
