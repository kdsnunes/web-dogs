-- Ninpozan Management System — Migração 0002 (Cães)
-- Tabela de cães do canil + RLS por organização.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'dog_sex') then
    create type public.dog_sex as enum ('macho', 'femea');
  end if;
  if not exists (select 1 from pg_type where typname = 'dog_status') then
    create type public.dog_status as enum ('ativo', 'aposentado', 'vendido', 'falecido');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- dogs
-- ---------------------------------------------------------------------------
create table if not exists public.dogs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  name                text not null,
  registered_name     text,
  breed               text not null default 'Shiba Inu',
  sex                 public.dog_sex not null default 'femea',
  birth_date          date,
  color               text,
  microchip           text,
  registration_number text,
  status              public.dog_status not null default 'ativo',
  photo_url           text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_dogs_org on public.dogs (organization_id);
create index if not exists idx_dogs_name on public.dogs (name);

drop trigger if exists trg_dogs_updated_at on public.dogs;
create trigger trg_dogs_updated_at
  before update on public.dogs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: membros da organização têm acesso total aos cães daquela organização
-- ---------------------------------------------------------------------------
alter table public.dogs enable row level security;

drop policy if exists "dogs_select_member" on public.dogs;
create policy "dogs_select_member" on public.dogs
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "dogs_insert_member" on public.dogs;
create policy "dogs_insert_member" on public.dogs
  for insert with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "dogs_update_member" on public.dogs;
create policy "dogs_update_member" on public.dogs
  for update using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "dogs_delete_member" on public.dogs;
create policy "dogs_delete_member" on public.dogs
  for delete using (organization_id in (select public.current_user_org_ids()));
