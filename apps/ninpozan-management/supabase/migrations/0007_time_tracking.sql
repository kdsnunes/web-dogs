-- Ninpozan Management System — Migração 0007 (Ponto da equipe)
-- Registro de entrada/saída com carimbo de tempo do SERVIDOR (occurred_at = now()).

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'time_entry_kind') then
    create type public.time_entry_kind as enum ('entrada', 'saida');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- time_entries
-- ---------------------------------------------------------------------------
create table if not exists public.time_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  kind            public.time_entry_kind not null,
  occurred_at     timestamptz not null default now(), -- carimbo do servidor
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_time_org on public.time_entries (organization_id);
create index if not exists idx_time_profile on public.time_entries (profile_id);
create index if not exists idx_time_occurred on public.time_entries (occurred_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.time_entries enable row level security;

-- Membros da organização veem os registros da organização
drop policy if exists "time_select_member" on public.time_entries;
create policy "time_select_member" on public.time_entries
  for select using (organization_id in (select public.current_user_org_ids()));

-- Cada usuário só registra o PRÓPRIO ponto, na sua organização
drop policy if exists "time_insert_own" on public.time_entries;
create policy "time_insert_own" on public.time_entries
  for insert with check (
    profile_id = auth.uid()
    and organization_id in (select public.current_user_org_ids())
  );

-- Membros podem apagar registros da organização (correção de erros)
drop policy if exists "time_delete_member" on public.time_entries;
create policy "time_delete_member" on public.time_entries
  for delete using (organization_id in (select public.current_user_org_ids()));

-- ---------------------------------------------------------------------------
-- Permitir que membros vejam o perfil (nome) dos colegas da mesma organização
-- (necessário para exibir o nome do funcionário no ponto).
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_comembers" on public.profiles;
create policy "profiles_select_comembers" on public.profiles
  for select using (
    id = auth.uid()
    or id in (
      select profile_id
      from public.memberships
      where organization_id in (select public.current_user_org_ids())
    )
  );
