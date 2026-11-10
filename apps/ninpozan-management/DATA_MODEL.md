# Modelo de dados

> Evolui a cada fase. Esta versão cobre a **Fase 1 (fundação de identidade e
> organização)**. Tabelas de cães, saúde, estoque e ponto entram nas fases
> seguintes.

## Convenções

- Chaves primárias: `uuid` (`gen_random_uuid()`).
- Timestamps: `timestamptz`, com `created_at` e `updated_at`.
- Dinheiro: **centavos inteiros** (`bigint`), nunca ponto flutuante.
- Datas/horas de negócio: armazenadas em UTC; exibição no fuso
  `America/Sao_Paulo`.
- Todas as tabelas de negócio têm `organization_id` e RLS habilitado.

## Entidades (Fase 1)

### `organizations`

Um canil. Permite multi-tenant futuro.

| Coluna       | Tipo          | Notas                 |
| ------------ | ------------- | --------------------- |
| `id`         | uuid (PK)     |                       |
| `name`       | text          | Nome do canil         |
| `slug`       | text (unique) | Identificador curto   |
| `created_at` | timestamptz   |                       |
| `updated_at` | timestamptz   |                       |

### `profiles`

Estende `auth.users` (Supabase). 1:1 com o usuário autenticado.

| Coluna       | Tipo        | Notas                          |
| ------------ | ----------- | ------------------------------ |
| `id`         | uuid (PK)   | = `auth.users.id`              |
| `full_name`  | text        |                                |
| `avatar_url` | text        | opcional                       |
| `created_at` | timestamptz |                                |
| `updated_at` | timestamptz |                                |

### `memberships`

Liga um `profile` a uma `organization` com um papel (role).

| Coluna            | Tipo        | Notas                                   |
| ----------------- | ----------- | --------------------------------------- |
| `id`              | uuid (PK)   |                                         |
| `organization_id` | uuid (FK)   | → organizations                         |
| `profile_id`      | uuid (FK)   | → profiles                              |
| `role`            | enum        | `owner` \| `manager` \| `staff`         |
| `created_at`      | timestamptz |                                         |

- Único por par (`organization_id`, `profile_id`).

## Papéis (roles)

| Papel     | Descrição                                            |
| --------- | ---------------------------------------------------- |
| `owner`   | Dono. Acesso total, incluindo configurações.         |
| `manager` | Gerente. Gerencia cães, estoque e ponto da equipe.   |
| `staff`   | Funcionário. Registra ponto e executa protocolos.    |

## Próximas fases (prévia)

- `dogs`, `dog_health_events`, `protocols`, `protocol_tasks`
- `inventory_items`, `inventory_movements`
- `time_entries` (ponto), `work_schedules`
- `notifications`
