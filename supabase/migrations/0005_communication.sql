create type public.announcement_category as enum
  ('official','doctor','representative','majles_tolab','urgent','course');
create type public.announcement_priority as enum ('normal','high','urgent');
create type public.announcement_status as enum ('draft','published','archived');

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  category public.announcement_category not null,
  title text not null,
  body text not null,
  priority public.announcement_priority not null default 'normal',
  target_audience text not null default 'program',
  status public.announcement_status not null default 'draft',
  is_pinned boolean not null default false,
  requires_acknowledgment boolean not null default false,
  source_name text,
  source_url text,
  attachment_path text,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_announcements_course on public.announcements(course_id);
create index idx_announcements_category on public.announcements(category);
create index idx_announcements_status on public.announcements(status);
create index idx_announcements_published on public.announcements(published_at desc);
create trigger trg_announcements_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  primary key (announcement_id, user_id)
);
create index idx_announcement_reads_user on public.announcement_reads(user_id);

create type public.calendar_event_category as enum
  ('lecture','exam','quiz','assignment','holiday','closure','schedule_change','council','registration','other');

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  category public.calendar_event_category not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid references public.profiles(id) on delete set null,
  is_program_wide boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index idx_calendar_events_starts on public.calendar_events(starts_at);
create index idx_calendar_events_course on public.calendar_events(course_id);
create trigger trg_calendar_events_updated_at before update on public.calendar_events
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  dedupe_key text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index uq_notifications_dedupe
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;
create index idx_notifications_user on public.notifications(user_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_actor on public.audit_logs(actor_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);
