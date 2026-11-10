# Regras de negócio

> Documento vivo. Regras são adicionadas conforme cada módulo é implementado.

## Princípios gerais

- **Isolamento por organização.** Todo dado pertence a uma organização; um usuário
  só enxerga dados das organizações em que tem `membership`.
- **Dinheiro em centavos.** Valores monetários são inteiros (centavos). Formatação
  para BRL só na camada de exibição (`lib/format.ts`).
- **Fuso horário.** Registros de ponto e eventos usam UTC internamente e são
  exibidos em `America/Sao_Paulo`.
- **Auditoria.** `created_at`/`updated_at` em todas as tabelas; ações sensíveis
  serão auditadas em fases posteriores.

## Autenticação e acesso (Fase 1)

- Acesso é **restrito à equipe**: não há cadastro público. Usuários são criados
  pelo `owner`/`manager` (via painel de administração do Supabase nesta fase).
- Ao autenticar, o usuário precisa ter um `profile` e ao menos um `membership`
  ativo. Sem `membership`, não há acesso aos dados.
- Papéis: `owner` > `manager` > `staff` (ver DATA_MODEL).

## Ponto dos funcionários (Fase 4 — prévia)

- Registro de entrada/saída com carimbo de tempo do servidor (não confiar no
  relógio do cliente).
- Jornada e horas extras calculadas a partir dos registros; sem edição silenciosa.

## Cães, saúde e protocolos (Fase 3 — prévia)

- Cada cão pertence a uma organização.
- Protocolos (vacinas, vermífugos, etc.) geram tarefas com data prevista e
  notificação quando próximas do vencimento.

## Estoque (Fase 4 — prévia)

- Itens têm saldo derivado de movimentações (entradas/saídas), não um número
  editável diretamente.
- Alertas de estoque mínimo geram notificações.
