-- Ninpozan Management System — Migração 0003 (Saúde & Protocolos)
-- Eventos de saúde por cão (vacinas, vermífugos, cios, consultas, etc.)
-- com data prevista de próximo vencimento.

-- ---------------------------------------------------------------------------
-- Enum de tipo de evento
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'health_event_type') then
    create type public.health_event_type as enum (
      'vacina', 'vermifugo', 'medicamento', 'consulta', 'cio', 'peso', 'outro'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- dog_health_events
-- ---------------------------------------------------------------------------
create table if not exists public.dog_health_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  dog_id          uuid not null references public.dogs (id) on delete cascade,
  event_type      public.health_event_type not null default 'vacina',
  event_date      date not null default current_date,
  description     text,
  next_due_date   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_health_org on public.dog_health_events (organization_id);
create index if not exists idx_health_dog on public.dog_health_events (dog_id);
create index if not exists idx_health_due on public.dog_health_events (next_due_date);

drop trigger if exists trg_health_updated_at on public.dog_health_events;
create trigger trg_health_updated_at
  before update on public.dog_health_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: membros da organização têm acesso total aos eventos da sua organização
-- ---------------------------------------------------------------------------
alter table public.dog_health_events enable row level security;

drop policy if exists "health_select_member" on public.dog_health_events;
create policy "health_select_member" on public.dog_health_events
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "health_insert_member" on public.dog_health_events;
create policy "health_insert_member" on public.dog_health_events
  for insert with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "health_update_member" on public.dog_health_events;
create policy "health_update_member" on public.dog_health_events
  for update using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "health_delete_member" on public.dog_health_events;
create policy "health_delete_member" on public.dog_health_events
  for delete using (organization_id in (select public.current_user_org_ids()));
