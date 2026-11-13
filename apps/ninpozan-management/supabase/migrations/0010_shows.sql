-- Ninpozan Management System — Migração 0010 (Módulo Shows)
-- Calendário de exposições (logística: quais cães levar) + flag "em campanha".
-- A seção de Resultados/títulos será modelada depois, com as regras de homologação.

-- ---------------------------------------------------------------------------
-- Flag "em campanha" no cão
-- ---------------------------------------------------------------------------
alter table public.dogs
  add column if not exists in_campaign boolean not null default false;

create index if not exists idx_dogs_in_campaign
  on public.dogs (organization_id) where in_campaign;

-- ---------------------------------------------------------------------------
-- shows — calendário de exposições (por organização)
-- ---------------------------------------------------------------------------
create table if not exists public.shows (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_date      date not null,
  club            text not null,
  city            text,
  source_code     text, -- código do evento no DogShow (quando houver)
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_shows_org_date on public.shows (organization_id, event_date);

drop trigger if exists trg_shows_updated_at on public.shows;
create trigger trg_shows_updated_at
  before update on public.shows
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- show_plans — quais cães pretendemos/levamos a cada show (logística)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'show_plan_status') then
    create type public.show_plan_status as enum ('pretendido', 'confirmado');
  end if;
end$$;

create table if not exists public.show_plans (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  show_id         uuid not null references public.shows (id) on delete cascade,
  dog_id          uuid not null references public.dogs (id) on delete cascade,
  status          public.show_plan_status not null default 'pretendido',
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (show_id, dog_id)
);

create index if not exists idx_show_plans_show on public.show_plans (show_id);
create index if not exists idx_show_plans_dog on public.show_plans (dog_id);

drop trigger if exists trg_show_plans_updated_at on public.show_plans;
create trigger trg_show_plans_updated_at
  before update on public.show_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.shows enable row level security;
alter table public.show_plans enable row level security;

drop policy if exists "shows_select_member" on public.shows;
create policy "shows_select_member" on public.shows
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "shows_write_member" on public.shows;
create policy "shows_write_member" on public.shows
  for all using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "show_plans_select_member" on public.show_plans;
create policy "show_plans_select_member" on public.show_plans
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "show_plans_write_member" on public.show_plans;
create policy "show_plans_write_member" on public.show_plans
  for all using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));
