-- Local/staging TEST DATA for semester-management UI.
-- Run after applying all migrations. Safe to re-run; uses stable IDs and upserts.
-- Do not run against production unless you intentionally want these demo records.

insert into public.academic_programs (id, name_en, name_ar, faculty, branch, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Master in Business Administration', 'ماجستير إدارة الأعمال', 'Faculty of Economics & Business Administration', 5, true),
  ('22222222-2222-2222-2222-222222222222', 'Master in Computer Science', 'ماجستير علوم الحاسوب', 'Faculty of Sciences', 5, true)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  faculty = excluded.faculty,
  branch = excluded.branch,
  is_active = excluded.is_active;

insert into public.academic_years (id, label, start_date, end_date, is_active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-2026', '2025-09-01', '2026-07-31', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa2027', '2026-2027', '2026-09-01', '2027-07-31', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa2028', '2027-2028', '2027-09-01', '2028-07-31', false)
on conflict (id) do update set
  label = excluded.label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active;

-- Also handle an existing academic year with the same label but a different ID.
update public.academic_years
set is_active = (label = '2026-2027')
where label in ('2025-2026', '2026-2027', '2027-2028');

insert into public.semesters
  (id, program_id, academic_year_id, number, name_en, name_ar, start_date, end_date,
   registration_start, registration_end, exam_start, exam_end, status)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   1, 'Fall 2025-2026 (Demo)', 'الفصل الأول 2025-2026 (تجريبي)',
   '2025-09-15', '2026-01-31', '2025-08-15', '2025-09-10', '2026-01-10', '2026-01-31', 'archived'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb202701',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa2027',
   1, 'Fall 2026-2027 (Demo)', 'الفصل الأول 2026-2027 (تجريبي)',
   '2026-09-15', '2027-01-31', '2026-08-15', '2026-09-10', '2027-01-10', '2027-01-31', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb202702',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa2027',
   2, 'Spring 2026-2027 (Demo)', 'الفصل الثاني 2026-2027 (تجريبي)',
   '2027-02-15', '2027-06-30', '2027-01-15', '2027-02-10', '2027-06-01', '2027-06-30', 'upcoming'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb202703',
   '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa2027',
   1, 'Fall 2026-2027 CS (Demo)', 'الفصل الأول 2026-2027 علوم الحاسوب (تجريبي)',
   '2026-09-15', '2027-01-31', '2026-08-15', '2026-09-10', '2027-01-10', '2027-01-31', 'upcoming'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb202801',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa2028',
   1, 'Fall 2027-2028 (Demo)', 'الفصل الأول 2027-2028 (تجريبي)',
   '2027-09-15', '2028-01-31', '2027-08-15', '2027-09-10', '2028-01-10', '2028-01-31', 'upcoming')
on conflict (id) do update set
  program_id = excluded.program_id,
  academic_year_id = excluded.academic_year_id,
  number = excluded.number,
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  registration_start = excluded.registration_start,
  registration_end = excluded.registration_end,
  exam_start = excluded.exam_start,
  exam_end = excluded.exam_end,
  status = excluded.status;
