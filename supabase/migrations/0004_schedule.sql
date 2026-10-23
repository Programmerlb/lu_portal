create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete restrict,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  online_link text,
  effective_from date not null,
  effective_to date,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (effective_to is null or effective_to >= effective_from)
);
create index idx_schedule_entries_course on public.schedule_entries(course_id);
create index idx_schedule_entries_dow on public.schedule_entries(day_of_week, start_time);
create index idx_schedule_entries_doctor on public.schedule_entries(doctor_id);
create trigger trg_schedule_entries_updated_at before update on public.schedule_entries
for each row execute function public.set_updated_at();

create type public.change_request_type as enum
  ('reschedule','cancel','room_change','doctor_change','replacement','additional');
create type public.change_request_status as enum
  ('pending_doctor','pending_approval','approved','published','rejected','cancelled');

create table public.schedule_change_requests (
  id uuid primary key default gen_random_uuid(),
  schedule_entry_id uuid references public.schedule_entries(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  request_type public.change_request_type not null,
  original_date date not null,
  original_start_time time,
  original_end_time time,
  proposed_date date,
  proposed_start_time time,
  proposed_end_time time,
  proposed_room text,
  proposed_doctor_id uuid references public.profiles(id) on delete set null,
  proposed_online_link text,
  reason text not null,
  status public.change_request_status not null default 'pending_doctor',
  doctor_confirmed_by uuid references public.profiles(id) on delete set null,
  doctor_confirmed_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_scr_status on public.schedule_change_requests(status);
create index idx_scr_course on public.schedule_change_requests(course_id);
create index idx_scr_original_date on public.schedule_change_requests(original_date);
create trigger trg_scr_updated_at before update on public.schedule_change_requests
for each row execute function public.set_updated_at();

create type public.exception_type as enum
  ('rescheduled','cancelled','room_changed','doctor_changed','replacement','additional');

create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.schedule_change_requests(id) on delete set null,
  schedule_entry_id uuid references public.schedule_entries(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  exception_date date not null,
  exception_type public.exception_type not null,
  original_start_time time,
  original_end_time time,
  new_start_time time,
  new_end_time time,
  new_room text,
  new_doctor_id uuid references public.profiles(id) on delete set null,
  new_online_link text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_exceptions_date on public.schedule_exceptions(exception_date);
create index idx_exceptions_course on public.schedule_exceptions(course_id);
create index idx_exceptions_entry on public.schedule_exceptions(schedule_entry_id);

create table public.portal_settings (
  id int primary key default 1 check (id = 1),
  schedule_approval_policy text not null default 'doctor_then_admin'
    check (schedule_approval_policy in ('doctor_then_admin','doctor_then_rep','admin_only')),
  timezone text not null default 'Asia/Beirut',
  updated_at timestamptz not null default now()
);
insert into public.portal_settings (id) values (1) on conflict do nothing;
