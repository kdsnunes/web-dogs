-- Ninpozan Management System — Migração 0011 (Títulos & homologações)
-- Ledger de títulos por cão com TRÊS EIXOS independentes (conforme a
-- especificação de pontuação/ranking): elegibilidade, homologação e ranking.
-- O catálogo de títulos (pontos do art. 2) fica versionado no código.
-- O cálculo automático de requisitos em pista (CAC/CGC/juízes) virá com a
-- importação de resultados; aqui registramos o estado declarado/homologado.

-- ---------------------------------------------------------------------------
-- Enums dos três eixos
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'title_eligibility') then
    create type public.title_eligibility as enum (
      'NOT_STARTED', 'IN_PROGRESS', 'ELIGIBLE', 'UNKNOWN', 'NOT_APPLICABLE'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'title_homologation') then
    create type public.title_homologation as enum (
      'NOT_REQUESTED', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'title_ranking') then
    create type public.title_ranking as enum (
      'PROJECTED', 'ELIGIBLE_LOCAL', 'CONFIRMED_OFFICIAL', 'INELIGIBLE', 'PENDING_REVIEW'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- dog_titles — um registro por (cão, título do catálogo)
-- ---------------------------------------------------------------------------
create table if not exists public.dog_titles (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  dog_id               uuid not null references public.dogs (id) on delete cascade,
  title_catalog_id     text not null,          -- id do catálogo (código)
  rule_version         text not null default '2027_SIMULACAO_BASE_2026',

  eligibility          public.title_eligibility not null default 'NOT_STARTED',
  homologation         public.title_homologation not null default 'NOT_REQUESTED',
  ranking              public.title_ranking not null default 'PROJECTED',

  entity               text,                    -- CBKC, FCI, entidade externa…
  ranking_year         integer,                 -- ano a que o crédito se refere

  declared_completed_on date,                   -- fechamento informado pelo usuário
  accepted_completed_on date,                   -- fechamento aceito após revisão
  requested_on          date,                   -- data do requerimento de homologação
  homologated_on        date,                   -- data da homologação
  protocol              text,

  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (dog_id, title_catalog_id)
);

create index if not exists idx_dog_titles_org on public.dog_titles (organization_id);
create index if not exists idx_dog_titles_dog on public.dog_titles (dog_id);

drop trigger if exists trg_dog_titles_updated_at on public.dog_titles;
create trigger trg_dog_titles_updated_at
  before update on public.dog_titles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.dog_titles enable row level security;

drop policy if exists "dog_titles_select_member" on public.dog_titles;
create policy "dog_titles_select_member" on public.dog_titles
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "dog_titles_write_member" on public.dog_titles;
create policy "dog_titles_write_member" on public.dog_titles
  for all using (organization_id in (select public.current_user_org_ids()))
  with check (organization_id in (select public.current_user_org_ids()));
