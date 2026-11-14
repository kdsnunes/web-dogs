# show-crawler

Coletor de calendários e resultados de exposições caninas. Cada fonte é um adaptador
isolado; a primeira é o [DogShow](https://www.dogshow.com.br). O que é coletado vai para as
tabelas `crawl_*` do Supabase do sistema de gestão (ou para arquivos JSON, sem Supabase).

Projeto isolado do monorepo: tem `package.json`, `package-lock.json` e `node_modules`
próprios e não faz parte dos workspaces da raiz.

## Uso

```bash
cd apps/show-crawler
npm install
cp .env.example .env        # preencha conforme abaixo

npm run crawl -- events --year 2026             # só o calendário
npm run crawl -- results --year 2026            # calendário + resultados dos cães do canil
npm run crawl -- results --year 2026 --dry-run  # mostra o que coletaria, sem gravar
npm run crawl -- --help                         # todas as opções
```

`results` pula os eventos já coletados, exceto os dos últimos 30 dias (`--recheck-days`):
os clubes publicam resultados provisórios e corrigem depois. `--force` recoleta tudo.

O comando termina com código 0 se tudo foi coletado, 2 se algum evento falhou e 1 em erro
de uso ou configuração.

## Configuração (`.env`)

| Variável | Para quê |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Gravar no Supabase e ler os cães do canil. A chave `service_role` é secreta: fica só neste arquivo local. |
| `CRAWLER_BREEDS` | Raças a coletar, pelo nome na fonte (padrão `SHIBA`). |
| `CRAWLER_DOG_REGISTRATIONS` | Registros dos cães do canil, quando não há Supabase. |
| `CRAWLER_MIN_INTERVAL_MS` | Intervalo mínimo entre requisições (padrão 1500, mínimo 500). |

As tabelas são criadas pela migração
`apps/ninpozan-management/supabase/migrations/0012_show_crawler.sql`.

### Quais cães são "do canil"

Com o Supabase configurado, são os cães cadastrados no sistema de gestão que têm **número
de registro** ou **nome registrado**. O registro é o critério principal; o nome registrado
serve de reserva, porque as fontes às vezes grafam o registro de outra forma. `--all-dogs`
mantém todos os cães das raças configuradas.

## Arquitetura

```
src/
  core/        modelo comum, contrato das fontes, HTTP, filtro dos cães, orquestração
  sources/     um diretório por fonte (dogshow/)
  sinks/       destinos: json.ts e supabase.ts
  cli.ts       linha de comando
```

- **Modelo comum** (`core/model.ts`): evento → julgamento de uma raça em uma exposição →
  linha de cada cão. Nada fora de `sources/` conhece a fonte de origem.
- **Fonte** (`core/source.ts`): `listEvents(year)` e `fetchJudgements(event, { breeds })`.
- **HTTP educado** (`core/http.ts`): uma requisição por vez por fonte, intervalo mínimo,
  novas tentativas em falha transitória, cookies de sessão e decodificação do charset.
  O crawler se identifica no `User-Agent`.
- **Falhas visíveis**: se uma página não tem o formato esperado, o adaptador lança erro em
  vez de devolver vazio. Um evento que falha não interrompe os demais; cinco falhas
  seguidas interrompem a execução.

### Adicionar uma fonte

1. Crie `src/sources/<fonte>/` com uma classe que implemente `Source`.
2. Registre-a em `src/sources/index.ts`.
3. Guarde páginas reais reduzidas em `__fixtures__/` e teste os parsers com elas.

### Notas sobre o DogShow

- HTML em `iso-8859-1`, renderizado no servidor (ASP clássico).
- O evento "ativo" fica na sessão do servidor: é preciso ativar o evento
  (`Resultados/ativaresultadoget.asp?Evento=…`) e pedir os resultados com os mesmos
  cookies. Cada evento usa uma sessão própria, e a data exibida é conferida em toda página.
- O mapa detalhado (`Resultados/mapa-resultado.asp`) é pedido por exposição e por raça.

## Testes

```bash
npm test
npm run typecheck
```
