-- Ninpozan Management System — Migração 0004 (Produtos de saúde)
-- Adiciona o tipo 'antiparasitario' e a coluna 'product' para especificar
-- qual produto foi usado (vacina, vermífugo, antiparasitário).

-- Novo valor do enum (append). Não pode estar dentro de transação com uso imediato,
-- por isso roda isolado.
alter type public.health_event_type add value if not exists 'antiparasitario';

-- Produto utilizado (ex.: 'Bravecto', 'V10', 'Drontal Plus'). Livre/nullable.
alter table public.dog_health_events
  add column if not exists product text;
