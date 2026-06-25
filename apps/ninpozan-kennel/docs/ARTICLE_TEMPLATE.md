# ARTICLE TEMPLATE — Biblioteca Técnica Ninpozan

Modelo obrigatório para criação de novos capítulos/artigos.

Versão: 1.0  
Última atualização: Junho de 2026

---

## Checklist antes de começar

- [ ] Verificar `MASTER_MAP.md` para URL correta e links cruzados esperados
- [ ] Ler `EDITORIAL_GUIDE.md` para tom, filosofia e estrutura
- [ ] Identificar a intenção de busca principal (1 por artigo)
- [ ] Listar 3-5 links internos que este artigo deve enviar
- [ ] Listar 3-5 artigos que devem linkar para este (atualizar após publicação)

---

## Estrutura do Arquivo

**Localização:** `apps/ninpozan-kennel/src/pages/estudos/{pilar}/{slug}.astro`

**Exemplo:** `apps/ninpozan-kennel/src/pages/estudos/genetica/locus-a.astro`

---

## Template Astro Completo

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';

const articleTitle = 'TÍTULO COMPLETO DO ARTIGO';
const articleDescription = 'Descrição meta de 150-160 caracteres. Deve conter a keyword principal e responder a intenção de busca.';
const articleDate = 'YYYY-MM-DD';
const articleModified = 'YYYY-MM-DD';
const articleUrl = 'https://ninpozankennel.com.br/estudos/{pilar}/{slug}/';
const pilarName = 'Nome do Pilar';
const pilarUrl = '/estudos/{pilar}/';
const capitulo = X;
---

<BaseLayout
  title={`${articleTitle} — Ninpozan Kennel`}
  description={articleDescription}
  breadcrumbs={[
    { name: "Estudos", url: "/estudos/" },
    { name: pilarName, url: pilarUrl },
    { name: "TÍTULO CURTO", url: `/estudos/{pilar}/{slug}/` }
  ]}
>

  <!-- Schema Article para SEO/GEO -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": articleTitle,
    "description": articleDescription,
    "datePublished": articleDate,
    "dateModified": articleModified,
    "url": articleUrl,
    "author": {
      "@type": "Organization",
      "name": "Ninpozan Kennel",
      "url": "https://ninpozankennel.com.br"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ninpozan Kennel",
      "url": "https://ninpozankennel.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ninpozankennel.com.br/favicon.svg"
      }
    },
    "mainEntityOfPage": articleUrl,
    "keywords": "keyword1, keyword2, keyword3, shiba inu",
    "articleSection": pilarName,
    "inLanguage": "pt-BR",
    "about": [
      { "@type": "Thing", "name": "Shiba Inu" },
      { "@type": "Thing", "name": "TEMA ESPECÍFICO" }
    ]
  })} />

  <!-- Schema FAQ para GEO -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Pergunta 1?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Resposta completa entre 50-120 palavras."
        }
      }
    ]
  })} />

  <article class="article-page">
    <div class="container">

      <a href={pilarUrl} class="back-link">← {pilarName}</a>

      <header class="article-header">
        <span class="article-capitulo">Capítulo {capitulo}</span>
        <time datetime={articleDate} class="article-date">DD de mês de AAAA</time>
        <h1>{articleTitle}</h1>
        <p class="article-author">Por <strong>Ninpozan Kennel</strong> — Blumenau, SC</p>
      </header>

      <div class="article-body">

        <!-- INTRODUÇÃO -->
        <p class="lead">Parágrafo introdutório que contextualiza o tema e explica por que ele importa.</p>

        <p>Desenvolvimento da introdução...</p>

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- O QUE É -->
        <h2>O que é [tema]?</h2>
        <p>Definição clara e objetiva.</p>

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- COMO FUNCIONA -->
        <h2>Como funciona?</h2>
        <p>Explicação técnica detalhada.</p>

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- APLICAÇÃO PRÁTICA -->
        <h2>Aplicação no Shiba Inu</h2>
        <p>Como este conhecimento se aplica especificamente à raça.</p>

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- VISÃO DO CRIADOR -->
        <h2>Visão do criador</h2>
        <p>Como este conhecimento influencia decisões de criação (baseado em princípios técnicos).</p>

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- MITOS COMUNS -->
        <h2>Mitos comuns</h2>
        <p>Correção de interpretações equivocadas.</p>

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- PERGUNTAS FREQUENTES -->
        <h2>Perguntas Frequentes</h2>

        <div class="faq-item">
          <h3>Pergunta 1?</h3>
          <p>Resposta entre 50-120 palavras.</p>
        </div>

        <!-- Repetir para 6-12 perguntas -->

        <div class="divider"><span class="divider-symbol">◆</span></div>

        <!-- LEITURA RECOMENDADA -->
        <h2>Leitura recomendada</h2>
        <ul class="reading-list">
          <li><a href="/estudos/{pilar}/{slug}/">Título do artigo relacionado</a></li>
          <li><a href="/estudos/{pilar}/{slug}/">Título do artigo relacionado</a></li>
          <li><a href="/estudos/{pilar}/{slug}/">Título do artigo relacionado</a></li>
        </ul>

      </div>

    </div>
  </article>

</BaseLayout>
```

---

## Regras de SEO por artigo

| Elemento | Requisito |
|----------|-----------|
| `<title>` | 50-60 caracteres. Keyword principal no início. Termina com " — Ninpozan Kennel" |
| `<meta description>` | 150-160 caracteres. Keyword + intenção de busca |
| `<h1>` | Apenas 1. Título completo do artigo |
| `<h2>` | Seções principais (seguir estrutura obrigatória) |
| `<h3>` | Subseções ou perguntas do FAQ |
| URL | Slug curto, descritivo, sem acentos. Ex: `/estudos/genetica/locus-a/` |
| Canonical | Inferido automaticamente pelo Astro |
| Breadcrumbs | Sempre incluir: Estudos → Pilar → Capítulo |

---

## Regras de GEO por artigo

| Elemento | Requisito |
|----------|-----------|
| Schema Article | Obrigatório. Incluir `headline`, `datePublished`, `author`, `keywords` |
| Schema FAQPage | Obrigatório. Mínimo 6 perguntas, máximo 12 |
| Definições claras | Parágrafos iniciais devem definir o tema em linguagem citável |
| Subtítulos como perguntas | Quando possível, formular H2 como perguntas que uma IA faria |
| Respostas autossuficientes | Cada seção deve ser compreensível isoladamente |

---

## Regras de Links Internos

- Mínimo 3 links enviados para outros artigos da biblioteca
- Após publicação, atualizar os artigos indicados no `MASTER_MAP.md` para que eles linkem de volta
- Links devem estar contextualizados no texto (nunca "clique aqui")
- Priorizar links para artigos do mesmo pilar + 1 link para outro pilar

---

## Tamanho Ideal

| Seção | Palavras |
|-------|----------|
| Introdução | 100-200 |
| O que é | 150-300 |
| Como funciona | 300-600 |
| Aplicação prática | 200-400 |
| Visão do criador | 150-300 |
| Mitos comuns | 200-400 |
| FAQ (total) | 400-800 |
| Leitura recomendada | — |
| **Total por artigo** | **1.500 – 3.000 palavras** |

---

## Keywords

Cada artigo deve ter:

- 1 keyword principal (no title, H1, meta description, primeiro parágrafo)
- 3-5 keywords secundárias (nos H2 e ao longo do texto)
- Keywords long-tail naturais (nas perguntas do FAQ)

---

## Estilo CSS

Todos os artigos utilizam os mesmos estilos. O CSS já está definido no template `pet-vs-show.astro` e deve ser replicado. Elementos visuais:

- `.lead` — primeiro parágrafo em itálico com borda dourada à esquerda
- `.divider` com `◆` — separador entre seções
- Listas com `◆` dourado como marcador
- `.conclusion` — bloco final com borda verde e fundo papel-escuro
- `.faq-item h3` — perguntas em destaque

---

## Metadados para o MASTER_MAP

Após publicar, atualizar `MASTER_MAP.md`:

1. Mudar status de "Pendente" para "✅ Publicado"
2. Confirmar que os links cruzados previstos foram implementados
3. Adicionar links cruzados adicionais se surgiram durante a escrita

---

## Notas Finais

- Nunca publicar um artigo sem FAQ
- Nunca publicar sem links internos
- Nunca publicar sem Schema Article + FAQPage
- Sempre rodar `npm run build:nk` antes de commitar para verificar que não há erros
- Verificar que a nova página aparece no sitemap após build
