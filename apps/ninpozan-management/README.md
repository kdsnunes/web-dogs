# Ninpozan Management System

Sistema de gestão interno do canil Ninpozan: controle de ponto da equipe, saúde e
protocolos dos cães, estoque, notificações e relatórios.

> **Projeto isolado.** Apesar de viver no monorepo `web-dogs`, este app tem seu
> próprio `package.json`, seu próprio `package-lock.json` e sua própria toolchain.
> Ele **não** faz parte dos workspaces npm da raiz e **não** compartilha
> dependências com os sites Astro. Alterações aqui não afetam os demais projetos.

## Stack

- **Frontend:** React 18 + Vite + TypeScript (strict) + Tailwind CSS
- **Dados/estado:** TanStack Query + React Hook Form + Zod
- **Backend:** Supabase (Postgres, Auth, RLS, Storage, Edge Functions)
- **Testes:** Vitest
- **Hospedagem:** Cloudflare Pages (frontend) + Supabase (backend)

## Como rodar localmente

```bash
cd apps/ninpozan-management
npm install            # cria node_modules e package-lock PRÓPRIOS deste app
cp .env.example .env   # preencha com as credenciais do seu projeto Supabase
npm run dev            # http://localhost:5273
```

## Scripts

| Script          | Descrição                              |
| --------------- | -------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento (Vite)     |
| `npm run build` | Type-check + build de produção         |
| `npm run preview` | Pré-visualiza o build                |
| `npm run typecheck` | Checagem de tipos                  |
| `npm run test`  | Testes unitários (Vitest)              |

## Estrutura

```
src/
  components/        Componentes compartilhados (layout, UI)
  lib/               Clientes e utilitários (supabase, query, format)
  modules/           Um diretório por domínio de negócio
    authentication/  Login, sessão, rotas protegidas
    dashboard/       Painel inicial
    (próximos)       caes, saude, estoque, ponto, relatorios
supabase/
  migrations/        Migrações SQL versionadas
```

## Documentação

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — decisões de arquitetura e isolamento
- [`DATA_MODEL.md`](./DATA_MODEL.md) — modelo de dados
- [`BUSINESS_RULES.md`](./BUSINESS_RULES.md) — regras de negócio
- [`SECURITY.md`](./SECURITY.md) — autenticação, RLS e segurança
