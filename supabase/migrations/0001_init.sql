create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create type public.user_role as enum ('admin', 'doctor', 'representative', 'student');

create table public.academic_programs (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  faculty text not null,
  branch int not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  full_name_ar text,
  role public.user_role not null default 'student',
  program_id uuid references public.academic_programs(id) on delete set null,
  student_id text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_program on public.profiles(program_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.user_role not null default 'student',
  program_id uuid references public.academic_programs(id) on delete set null,
  invited_by uuid references public.profiles(id) on delete set null,
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_invitations_email on public.invitations(lower(email));

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public
as $$ select role::text from public.profiles where id = auth.uid() limit 1; $$;

create or replace function public.current_user_program()
returns uuid language sql stable security definer set search_path = public
as $$ select program_id from public.profiles where id = auth.uid() limit 1; $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role = 'admin'::public.user_role from public.profiles where id = auth.uid() limit 1),
    false
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare inv record;
begin
  select * into inv from public.invitations
    where lower(email) = lower(new.email) and accepted_at is null and expires_at > now()
    limit 1;
  if found then
    insert into public.profiles (id, email, full_name, role, program_id)
    values (new.id, new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.email), inv.role, inv.program_id);
    update public.invitations set accepted_at = now() where id = inv.id;
  else
    insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.email), 'student');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_self_role_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.role <> new.role and not public.is_admin() then
    raise exception 'Only administrators can change user roles';
  end if;
  if old.program_id is distinct from new.program_id and not public.is_admin() then
    raise exception 'Only administrators can change a user''s program';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_role_change
before update on public.profiles
for each row execute function public.prevent_self_role_change();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
