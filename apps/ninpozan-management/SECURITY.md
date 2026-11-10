# Segurança

## Autenticação

- Supabase Auth com e-mail/senha. A sessão é persistida no cliente e renovada
  automaticamente (`autoRefreshToken`).
- O frontend usa **somente** a `anon key` (pública por design). Nenhuma `service_role`
  key vai para o cliente ou para o repositório.

## Segredos

- Credenciais ficam em `.env` (ignorado pelo git). O repositório contém apenas
  `.env.example` com os nomes das variáveis.
- Variáveis expostas ao browser têm prefixo `VITE_` e são, por natureza, públicas.
  Portanto, **nunca** colocar segredos reais (service_role, tokens de terceiros)
  em variáveis `VITE_`.

## Autorização — Row Level Security (RLS)

- **RLS habilitado em todas as tabelas de negócio.** A segurança não depende do
  frontend; o Postgres é a última linha de defesa.
- Regra base: um usuário só acessa linhas cuja `organization_id` esteja entre as
  organizações em que ele tem `membership`.
- Operações administrativas (criar usuários, alterar papéis) exigem papel
  adequado (`owner`/`manager`), validado por políticas RLS e/ou Edge Functions.

## Dados sensíveis

- Fotos e documentos no Supabase Storage com buckets privados e políticas de
  acesso por organização.

## Boas práticas adotadas

- TypeScript em modo `strict`.
- Validação de entrada com Zod nos formulários.
- Nunca confiar em timestamps vindos do cliente para ponto/auditoria.
