create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create type public.semester_status as enum ('upcoming', 'active', 'archived');

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.academic_programs(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  number smallint not null check (number between 1 and 4),
  name_en text not null,
  name_ar text not null,
  start_date date not null,
  end_date date not null,
  registration_start date,
  registration_end date,
  exam_start date,
  exam_end date,
  status public.semester_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, academic_year_id, number),
  check (end_date > start_date)
);
create index idx_semesters_program on public.semesters(program_id);
create index idx_semesters_status on public.semesters(status);

create trigger trg_semesters_updated_at
before update on public.semesters
for each row execute function public.set_updated_at();
