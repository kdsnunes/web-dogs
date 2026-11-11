-- Ninpozan Management System — Migração 0006 (Integração Saúde ↔ Estoque)
-- Taxonomia Categoria/Subcategoria compartilhada, protocolo no item de estoque
-- e saída de estoque automática gerada por eventos de saúde.

-- ---------------------------------------------------------------------------
-- Estoque: subcategoria + protocolo (duração) no item
-- ---------------------------------------------------------------------------
alter table public.inventory_items add column if not exists subcategory text;
alter table public.inventory_items add column if not exists protocol_amount integer;
alter table public.inventory_items
  add column if not exists protocol_unit text
  check (protocol_unit in ('days', 'months'));

-- Renomeia categorias antigas para a nova taxonomia
update public.inventory_items set category = 'Alimentação' where category = 'Ração';
update public.inventory_items set category = 'Saúde' where category = 'Medicamentos';

-- ---------------------------------------------------------------------------
-- Saúde: nova taxonomia + vínculo com item de estoque + quantidade usada
-- ---------------------------------------------------------------------------
alter table public.dog_health_events add column if not exists category text;
alter table public.dog_health_events add column if not exists subcategory text;
alter table public.dog_health_events
  add column if not exists item_id uuid references public.inventory_items (id) on delete set null;
alter table public.dog_health_events add column if not exists quantity numeric;

-- event_type deixa de ser obrigatório (substituído por category/subcategory)
alter table public.dog_health_events alter column event_type drop not null;
alter table public.dog_health_events alter column event_type drop default;

-- Migração de dados antigos (melhor esforço, apenas para exibição)
update public.dog_health_events
set
  category = case
    when event_type in ('vacina', 'vermifugo', 'antiparasitario', 'medicamento') then 'Saúde'
    else 'Clínico'
  end,
  subcategory = case
    when event_type = 'vacina' then 'Vacina'
    when event_type = 'vermifugo' then 'Vermífugo'
    when event_type = 'antiparasitario' then 'Antiparasitário'
    when event_type = 'cio' then 'Cio'
    when event_type = 'peso' then 'Peso'
    when event_type = 'consulta' then 'Consulta'
    else 'Consulta'
  end
where category is null;

-- ---------------------------------------------------------------------------
-- Vínculo do movimento de estoque ao evento de saúde (cascata + sincronização)
-- ---------------------------------------------------------------------------
alter table public.inventory_movements
  add column if not exists health_event_id uuid references public.dog_health_events (id) on delete cascade;

-- Trigger: cria/atualiza a saída de estoque quando o evento usa um item
create or replace function public.handle_health_event_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- remove o movimento automático anterior deste evento (relevante no UPDATE)
  delete from public.inventory_movements where health_event_id = new.id;

  if (new.item_id is not null and coalesce(new.quantity, 0) > 0) then
    insert into public.inventory_movements
      (organization_id, item_id, kind, quantity, movement_date, note, health_event_id)
    values
      (new.organization_id, new.item_id, 'saida', new.quantity, new.event_date,
       'Saída automática (saúde)', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_health_event_stock on public.dog_health_events;
create trigger trg_health_event_stock
  after insert or update on public.dog_health_events
  for each row execute function public.handle_health_event_stock();
