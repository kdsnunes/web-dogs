# Arquitetura

## Visão geral

Aplicação web autenticada (SPA) para gestão interna do canil. Diferente dos demais
projetos do monorepo (sites estáticos Astro publicados no GitHub Pages), este é um
app dinâmico com backend, banco de dados e autenticação.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Cloudflare Pages            │  HTTPS │  Supabase                    │
│  (React + Vite SPA)          │ ─────▶ │  Postgres + Auth + RLS       │
│  app.ninpozankennel.com.br   │        │  Storage + Edge Functions    │
└─────────────────────────────┘        └──────────────────────────────┘
```

## Isolamento no monorepo (crucial)

Este app **não pode impactar** os sites existentes (`ninpozan-kennel`,
`kennel-club-londrina`, etc.). Garantias:

1. **Fora dos workspaces npm da raiz.** O `package.json` da raiz não lista
   `apps/ninpozan-management`. Logo, instalar dependências aqui não altera o
   `package-lock.json` da raiz nem as versões usadas pelos sites Astro.
2. **Lockfile e `node_modules` próprios.** `npm install` roda dentro desta pasta
   e gera artefatos locais e independentes.
3. **Deploy independente.** Publicado no Cloudflare Pages, não no GitHub Pages.
   Nenhum workflow de deploy existente é acionado por mudanças nesta pasta.
4. **Toolchain própria** (Vite/TS/Tailwind), sem acoplamento ao Astro.

## Camadas do frontend

- **UI** (`components/`): layout, componentes visuais reutilizáveis.
- **Módulos** (`modules/`): um diretório por domínio, cada um dono das suas telas,
  hooks de dados e schemas Zod.
- **Dados** (`lib/supabase.ts` + TanStack Query): toda leitura/escrita passa pelo
  cliente Supabase; o estado de servidor é gerenciado pelo React Query.
- **Validação** (Zod + React Hook Form): schemas são a fonte da verdade dos
  formulários e também validam respostas quando necessário.

## Backend (Supabase)

- **Postgres** com RLS habilitado em todas as tabelas de negócio.
- **Auth** por e-mail/senha (equipe), com `profiles` e `memberships` controlando
  organização e papel do usuário.
- **Storage** para fotos de cães e documentos.
- **Edge Functions** para rotinas (notificações, relatórios agendados) em fases
  posteriores.
- **Migrações versionadas** em `supabase/migrations/`.

## Multi-tenant (preparado desde o início)

O modelo nasce com `organizations` para que o sistema possa, no futuro, atender
mais de um canil sem reescrita. Hoje há uma única organização (Ninpozan).
