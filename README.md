# Shiba Web Monorepo

Monorepo moderno com npm workspaces para múltiplos sites Astro estáticos do ecossistema Shiba Inu no Brasil.

## Estrutura

- `apps/shiba-departamento-rs`: site do Departamento da Raça Shiba Inu – RS
- `apps/shiba-conselho`: site do futuro Conselho da Raça Shiba Inu do Brasil
- `packages/ui`: pacote compartilhado `@shiba/ui` (tema e componentes)

## Requisitos

- Node.js 18+ (recomendado 20)
- npm 9+

## Rodar localmente

- Departamento RS:

```bash
npm run dev:rs
```

- Conselho Brasil:

```bash
npm run dev:br
```

## Construir

- Departamento RS:

```bash
npm run build:rs
```

- Conselho Brasil:

```bash
npm run build:br
```

Os artefatos serão gerados em `apps/<app>/dist`.

## Onde editar conteúdo

- Páginas: `apps/<app>/src/pages` (`index.astro`, `sobre.astro`, `eventos.astro`, `contato.astro`)
- Layout base: `apps/<app>/src/layouts/BaseLayout.astro`
- Tema e componentes compartilhados: `packages/ui/src/*`

## Publicação via GitHub Pages

Dois workflows (`.github/workflows/deploy-*.yml`) constroem e publicam cada site usando `peaceiris/actions-gh-pages@v3` para repositórios externos.

- Configure o secret `GH_TOKEN` com um Personal Access Token com escopo `repo`.
- Ajuste `external_repository` nos workflows para os repositórios de hospedagem corretos.

## Boas práticas

- Nomes consistentes de workspaces e pacotes (`@apps/*`, `@shiba/ui`).
- Dependências mínimas, focando em Astro puro.
- Pronto para expansão futura (p.ex., autenticação de membros) via novos pacotes em `packages/`.

