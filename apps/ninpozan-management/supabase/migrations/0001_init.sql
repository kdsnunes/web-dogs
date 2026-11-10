-- Ninpozan Management System — Migração 0001 (Fundação)
-- Organizações, perfis, vínculos (memberships) e RLS base.
-- Idempotente onde possível para facilitar reaplicação em dev.

-- ---------------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum de papéis
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('owner', 'manager', 'staff');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Função utilitária: atualiza updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria um profile automaticamente quando um usuário é criado no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  role            public.member_role not null default 'staff',
  created_at      timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index if not exists idx_memberships_profile on public.memberships (profile_id);
create index if not exists idx_memberships_org on public.memberships (organization_id);

-- ---------------------------------------------------------------------------
-- Helper: organizações do usuário atual (evita recursão em políticas)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.memberships
  where profile_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

-- profiles: o usuário vê e edita o próprio perfil
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- organizations: o usuário vê as organizações em que participa
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (id in (select public.current_user_org_ids()));

-- memberships: o usuário vê os vínculos das suas organizações
drop policy if exists "memberships_select_member" on public.memberships;
create policy "memberships_select_member" on public.memberships
  for select using (organization_id in (select public.current_user_org_ids()));
