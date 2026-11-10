-- Ninpozan Management System — Migração 0005 (Estoque)
-- Itens de estoque + movimentações. O saldo é DERIVADO das movimentações
-- (nunca um número editável direto), conforme as regras de negócio.

-- ---------------------------------------------------------------------------
-- Enum de tipo de movimentação
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_movement_kind') then
    create type public.inventory_movement_kind as enum ('entrada', 'saida');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- inventory_items
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  category        text,
  unit            text not null default 'un',
  min_quantity    numeric not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_inv_items_org on public.inventory_items (organization_id);
create index if not exists idx_inv_items_name on public.inventory_items (name);

drop trigger if exists trg_inv_items_updated_at on public.inventory_items;
create trigger trg_inv_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- inventory_movements
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  item_id         uuid not null references public.inventory_items (id) on delete cascade,
  kind            public.inventory_movement_kind not null,
  quantity        numeric not null check (quantity > 0),
  movement_date   date not null default current_date,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_inv_mov_org on public.inventory_movements (organization_id);
create index if not exists idx_inv_mov_item on public.inventory_movements (item_id);

-- ---------------------------------------------------------------------------
-- RLS: membros da organização têm acesso total aos itens/movimentações
-- ---------------------------------------------------------------------------
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "inv_items_select_member" on public.inventory_items;
create policy "inv_items_select_member" on public.inventory_items
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "inv_items_insert_member" on public.inventory_items;
create policy "inv_items_insert_member" on public.inventory_items
  for insert with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "inv_items_update_member" on public.inventory_items;
create policy "inv_items_update_member" on public.inventory_items
  for update using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "inv_items_delete_member" on public.inventory_items;
create policy "inv_items_delete_member" on public.inventory_items
  for delete using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "inv_mov_select_member" on public.inventory_movements;
create policy "inv_mov_select_member" on public.inventory_movements
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "inv_mov_insert_member" on public.inventory_movements;
create policy "inv_mov_insert_member" on public.inventory_movements
  for insert with check (organization_id in (select public.current_user_org_ids()));

drop policy if exists "inv_mov_delete_member" on public.inventory_movements;
create policy "inv_mov_delete_member" on public.inventory_movements
  for delete using (organization_id in (select public.current_user_org_ids()));
