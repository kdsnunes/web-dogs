-- Ninpozan Management System — Migração 0008 (Ponto por calendário mensal)
-- Substitui o relógio de ponto em tempo real (0007) por marcação de dias
-- em um calendário mensal: dias trabalhados, folgas e folgas vendidas.
--
-- Regras (reforçadas por trigger, não só na tela):
--   • Dia trabalhado: somente no mês corrente; mês anterior só se o admin reabrir.
--   • Folga / folga vendida: mês corrente e meses futuros (planejamento);
--     mês anterior só se reaberto.
--   • Mês "fechado" pelo admin trava qualquer lançamento (inclusive admin).
--   • Admin (owner/manager) pode corrigir qualquer lançamento em meses abertos.

-- ---------------------------------------------------------------------------
-- Remove o relógio de ponto da fase anterior (substituído pelo calendário)
-- ---------------------------------------------------------------------------
drop table if exists public.time_entries cascade;
do $$
begin
  if exists (select 1 from pg_type where typname = 'time_entry_kind') then
    drop type public.time_entry_kind;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'day_status') then
    create type public.day_status as enum ('trabalhado', 'folga', 'folga_vendida');
  end if;
  if not exists (select 1 from pg_type where typname = 'month_lock_state') then
    create type public.month_lock_state as enum ('reaberto', 'fechado');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Helper: o usuário atual é administrador (owner/manager) na organização?
-- ---------------------------------------------------------------------------
create or replace function public.is_org_admin(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where profile_id = auth.uid()
      and organization_id = org
      and role in ('owner', 'manager')
  );
$$;

-- ---------------------------------------------------------------------------
-- month_locks — estado do mês controlado pelo administrador (por organização)
-- ---------------------------------------------------------------------------
create table if not exists public.month_locks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  reference_month date not null, -- primeiro dia do mês
  state           public.month_lock_state not null,
  set_by          uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, reference_month)
);

create index if not exists idx_month_locks_org on public.month_locks (organization_id);

drop trigger if exists trg_month_locks_updated_at on public.month_locks;
create trigger trg_month_locks_updated_at
  before update on public.month_locks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rest_prefs — dia de descanso semanal por funcionário e por mês
-- weekday: 0 = domingo ... 6 = sábado
-- ---------------------------------------------------------------------------
create table if not exists public.rest_prefs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  reference_month date not null,
  weekday         smallint not null check (weekday between 0 and 6),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (profile_id, reference_month)
);

create index if not exists idx_rest_prefs_org on public.rest_prefs (organization_id);

drop trigger if exists trg_rest_prefs_updated_at on public.rest_prefs;
create trigger trg_rest_prefs_updated_at
  before update on public.rest_prefs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- day_entries — uma linha por (funcionário, dia)
-- ---------------------------------------------------------------------------
create table if not exists public.day_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  entry_date      date not null,
  status          public.day_status not null,
  note            text,
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (profile_id, entry_date)
);

create index if not exists idx_day_entries_org on public.day_entries (organization_id);
create index if not exists idx_day_entries_profile_date
  on public.day_entries (profile_id, entry_date);

drop trigger if exists trg_day_entries_updated_at on public.day_entries;
create trigger trg_day_entries_updated_at
  before update on public.day_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: janela de lançamento permitida
-- ---------------------------------------------------------------------------
create or replace function public.enforce_day_entry_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org           uuid;
  v_date          date;
  v_status        public.day_status;
  v_month         date;
  v_current_month date := date_trunc('month', current_date)::date;
  v_state         public.month_lock_state;
  v_is_admin      boolean;
begin
  if tg_op = 'DELETE' then
    v_org := old.organization_id; v_date := old.entry_date; v_status := old.status;
  else
    v_org := new.organization_id; v_date := new.entry_date; v_status := new.status;
  end if;

  v_month := date_trunc('month', v_date)::date;
  v_is_admin := public.is_org_admin(v_org);

  select state into v_state
  from public.month_locks
  where organization_id = v_org and reference_month = v_month;

  -- Mês fechado trava qualquer um (inclusive admin)
  if v_state = 'fechado' then
    raise exception 'Mês %/% está fechado para lançamentos.',
      to_char(v_month, 'MM'), to_char(v_month, 'YYYY')
      using errcode = 'check_violation';
  end if;

  -- Admin pode corrigir qualquer lançamento em meses não fechados
  if v_is_admin then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if v_month = v_current_month then
    return case when tg_op = 'DELETE' then old else new end;

  elsif v_month > v_current_month then
    -- Futuro: só folga / folga vendida
    if v_status = 'trabalhado' then
      raise exception 'Dias trabalhados não podem ser lançados em meses futuros.'
        using errcode = 'check_violation';
    end if;
    return case when tg_op = 'DELETE' then old else new end;

  else
    -- Passado: só se o administrador reabriu o mês
    if v_state = 'reaberto' then
      return case when tg_op = 'DELETE' then old else new end;
    end if;
    raise exception 'Mês anterior fechado para lançamentos. Peça ao administrador para reabrir.'
      using errcode = 'check_violation';
  end if;
end;
$$;

drop trigger if exists trg_day_entries_window on public.day_entries;
create trigger trg_day_entries_window
  before insert or update or delete on public.day_entries
  for each row execute function public.enforce_day_entry_window();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.day_entries enable row level security;
alter table public.month_locks enable row level security;
alter table public.rest_prefs enable row level security;

-- day_entries: membros veem tudo da organização; escrita do próprio ou de admin
drop policy if exists "day_entries_select_member" on public.day_entries;
create policy "day_entries_select_member" on public.day_entries
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "day_entries_insert" on public.day_entries;
create policy "day_entries_insert" on public.day_entries
  for insert with check (
    organization_id in (select public.current_user_org_ids())
    and (profile_id = auth.uid() or public.is_org_admin(organization_id))
  );

drop policy if exists "day_entries_update" on public.day_entries;
create policy "day_entries_update" on public.day_entries
  for update using (
    organization_id in (select public.current_user_org_ids())
    and (profile_id = auth.uid() or public.is_org_admin(organization_id))
  ) with check (
    organization_id in (select public.current_user_org_ids())
    and (profile_id = auth.uid() or public.is_org_admin(organization_id))
  );

drop policy if exists "day_entries_delete" on public.day_entries;
create policy "day_entries_delete" on public.day_entries
  for delete using (
    organization_id in (select public.current_user_org_ids())
    and (profile_id = auth.uid() or public.is_org_admin(organization_id))
  );

-- month_locks: membros veem; apenas admin escreve
drop policy if exists "month_locks_select_member" on public.month_locks;
create policy "month_locks_select_member" on public.month_locks
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "month_locks_insert_admin" on public.month_locks;
create policy "month_locks_insert_admin" on public.month_locks
  for insert with check (public.is_org_admin(organization_id));

drop policy if exists "month_locks_update_admin" on public.month_locks;
create policy "month_locks_update_admin" on public.month_locks
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "month_locks_delete_admin" on public.month_locks;
create policy "month_locks_delete_admin" on public.month_locks
  for delete using (public.is_org_admin(organization_id));

-- rest_prefs: membros veem; escrita do próprio ou de admin
drop policy if exists "rest_prefs_select_member" on public.rest_prefs;
create policy "rest_prefs_select_member" on public.rest_prefs
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "rest_prefs_write" on public.rest_prefs;
create policy "rest_prefs_write" on public.rest_prefs
  for all using (
    organization_id in (select public.current_user_org_ids())
    and (profile_id = auth.uid() or public.is_org_admin(organization_id))
  ) with check (
    organization_id in (select public.current_user_org_ids())
    and (profile_id = auth.uid() or public.is_org_admin(organization_id))
  );

-- ---------------------------------------------------------------------------
-- Membros podem ver o nome dos colegas da mesma organização
-- (necessário para o administrador listar e visualizar funcionários).
-- Idempotente — recriada aqui caso a migração anterior não tenha sido aplicada.
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
