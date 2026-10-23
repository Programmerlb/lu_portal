create table public.courses (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  code text not null,
  name_en text not null,
  name_ar text,
  description text,
  credits int check (credits is null or credits > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (semester_id, code)
);
create index idx_courses_semester on public.courses(semester_id);
create trigger trg_courses_updated_at before update on public.courses
for each row execute function public.set_updated_at();

create table public.course_doctors (
  course_id uuid not null references public.courses(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (course_id, doctor_id)
);
create index idx_course_doctors_doctor on public.course_doctors(doctor_id);

create table public.course_enrollments (
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (course_id, student_id)
);
create index idx_course_enrollments_student on public.course_enrollments(student_id);

create table public.lectures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  title_ar text,
  description text,
  week_number smallint,
  lecture_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lectures_course on public.lectures(course_id);
create index idx_lectures_date on public.lectures(lecture_date);
create trigger trg_lectures_updated_at before update on public.lectures
for each row execute function public.set_updated_at();

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references public.lectures(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  storage_path text,
  external_url text,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);
create index idx_resources_course on public.resources(course_id);
create index idx_resources_lecture on public.resources(lecture_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_assignments_course on public.assignments(course_id);
create index idx_assignments_due on public.assignments(due_at);
create trigger trg_assignments_updated_at before update on public.assignments
for each row execute function public.set_updated_at();
