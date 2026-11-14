-- Ninpozan Management System — Migração 0012 (dados coletados pelo show-crawler)
-- Tabelas próprias do coletor de exposições (apps/show-crawler). São dados públicos das
-- fontes (calendário e resultados de pista), não pertencem a uma organização:
--   * quem grava é só o crawler, com a chave service_role (que ignora RLS);
--   * usuários autenticados do sistema de gestão apenas leem.
-- O modelo é o mesmo para qualquer fonte; a coluna `source` identifica a origem.

-- ---------------------------------------------------------------------------
-- crawl_events — um evento do calendário de uma fonte
-- ---------------------------------------------------------------------------
create table if not exists public.crawl_events (
  id                   uuid primary key default gen_random_uuid(),
  source               text not null,              -- ex.: 'dogshow'
  source_event_id      text not null,              -- identificador do evento na fonte
  name                 text not null,              -- clube / nome do evento
  event_date           date not null,
  city                 text,
  state                text,
  country              text not null default 'BR',
  has_results          boolean not null default false,
  registration_open    boolean not null default false,
  results_collected_at timestamptz,                -- última coleta completa dos resultados
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  unique (source, source_event_id)
);

create index if not exists idx_crawl_events_date on public.crawl_events (event_date);

-- ---------------------------------------------------------------------------
-- crawl_judgements — o julgamento de uma raça em uma exposição de um evento
-- ---------------------------------------------------------------------------
create table if not exists public.crawl_judgements (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.crawl_events (id) on delete cascade,
  source_show_id text not null,                    -- exposição dentro do evento, na fonte
  show_name      text not null,
  breed_id       text not null,                    -- identificador da raça na fonte
  breed_name     text not null,
  judge          text,
  dogs_present   integer,
  collected_at   timestamptz not null default now(),
  unique (event_id, source_show_id, breed_id)
);

create index if not exists idx_crawl_judgements_event on public.crawl_judgements (event_id);

-- ---------------------------------------------------------------------------
-- crawl_results — a linha de um cão em um julgamento
-- ---------------------------------------------------------------------------
create table if not exists public.crawl_results (
  id                  uuid primary key default gen_random_uuid(),
  judgement_id        uuid not null references public.crawl_judgements (id) on delete cascade,
  registration_number text,
  dog_name            text not null,
  catalog_number      text,
  sex                 text check (sex in ('M', 'F')),
  class_code          text,                        -- classe, como publicada (ex.: 'JCh', 'Ab.')
  placement           text,                        -- classificação na classe (ex.: '1o.')
  awards_raw          text not null default '',    -- texto original dos certificados
  awards              jsonb not null default '[]', -- [{ "code": "CGC-J", "points": 4 }, ...]
  sex_awards          text[] not null default '{}',
  breed_awards        text[] not null default '{}',-- ex.: {MR, MJ}
  points              jsonb not null default '{}'  -- pontuações de ranking publicadas pela fonte
);

create index if not exists idx_crawl_results_judgement on public.crawl_results (judgement_id);
create index if not exists idx_crawl_results_registration
  on public.crawl_results (registration_number);

-- ---------------------------------------------------------------------------
-- RLS — leitura para usuários autenticados; escrita só via service_role
-- ---------------------------------------------------------------------------
alter table public.crawl_events enable row level security;
alter table public.crawl_judgements enable row level security;
alter table public.crawl_results enable row level security;

drop policy if exists "crawl_events_select_authenticated" on public.crawl_events;
create policy "crawl_events_select_authenticated" on public.crawl_events
  for select to authenticated using (true);

drop policy if exists "crawl_judgements_select_authenticated" on public.crawl_judgements;
create policy "crawl_judgements_select_authenticated" on public.crawl_judgements
  for select to authenticated using (true);

drop policy if exists "crawl_results_select_authenticated" on public.crawl_results;
create policy "crawl_results_select_authenticated" on public.crawl_results
  for select to authenticated using (true);
