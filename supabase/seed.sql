-- DEMO DATA — placeholder accounts created manually in Studio.
insert into public.academic_programs (id, name_en, name_ar, faculty) values
  ('11111111-1111-1111-1111-111111111111', 'Master in Business Administration',
   'ماجستير إدارة الأعمال', 'Faculty of Economics & Business Administration'),
  ('22222222-2222-2222-2222-222222222222', 'Master in Computer Science',
   'ماجستير علوم الحاسوب', 'Faculty of Sciences')
on conflict (id) do nothing;

insert into public.academic_years (id, label, start_date, end_date, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-2026', '2025-09-01', '2026-07-31', true)
on conflict (id) do nothing;

insert into public.semesters (id, program_id, academic_year_id, number, name_en, name_ar, start_date, end_date, status) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   1, 'Fall 2025-2026', 'الفصل الأول 2025-2026', '2025-09-15', '2026-01-31', 'active')
on conflict (id) do nothing;
