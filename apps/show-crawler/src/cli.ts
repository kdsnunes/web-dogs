import { parseArgs } from 'node:util';
import { loadConfig, loadEnvFile, type Config } from './config';
import type { BreedJudgement, DogTarget, ShowEvent } from './core/model';
import { collectResults, type Logger } from './core/pipeline';
import { dryRun, type Sink } from './core/sink';
import { TargetMatcher } from './core/targets';
import { JsonSink } from './sinks/json';
import { createSupabase, loadSupabaseTargets, SupabaseSink } from './sinks/supabase';
import { createSource, sourceIds } from './sources';

const HELP = `Uso: npm run crawl -- <comando> [opções]

Comandos
  events     Coleta o calendário de eventos de um ano.
  results    Coleta o calendário e os resultados dos cães do canil.

Opções
  --source <id>         Fonte (padrão: dogshow). Disponíveis: ${sourceIds.join(', ')}.
  --year <ano>          Ano do calendário (padrão: ano atual).
  --sink <json|supabase>  Destino (padrão: supabase se configurado no .env, senão json).
  --dry-run             Coleta e mostra o resultado, sem gravar nada.

Opções de "results"
  --event <id>          Coleta só este evento (identificador na fonte).
  --from <aaaa-mm-dd>   Só eventos a partir desta data.
  --to <aaaa-mm-dd>     Só eventos até esta data.
  --force               Recoleta eventos já coletados.
  --recheck-days <n>    Eventos dos últimos n dias são sempre recoletados (padrão: 30).
  --all-dogs            Mantém todos os cães das raças configuradas, não só os do canil.
`;

const log: Logger = {
  info: (m) => console.log(m),
  warn: (m) => console.warn(`AVISO: ${m}`),
};

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      source: { type: 'string', default: 'dogshow' },
      year: { type: 'string' },
      sink: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      event: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      force: { type: 'boolean', default: false },
      'recheck-days': { type: 'string', default: '30' },
      'all-dogs': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  const command = positionals[0];
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 1;
  }
  if (command !== 'events' && command !== 'results') {
    console.error(`Comando desconhecido: "${command}".\n\n${HELP}`);
    return 1;
  }

  loadEnvFile();
  const config = loadConfig();
  const today = new Date().toISOString().slice(0, 10);
  const year = Number(values.year ?? today.slice(0, 4));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    console.error(`Ano inválido: "${values.year}".`);
    return 1;
  }
  for (const key of ['from', 'to'] as const) {
    const v = values[key];
    if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      console.error(`Data inválida em --${key}: "${v}" (use aaaa-mm-dd).`);
      return 1;
    }
  }
  const recheckDays = Number(values['recheck-days']);
  if (!Number.isInteger(recheckDays) || recheckDays < 0) {
    console.error(`Valor inválido em --recheck-days: "${values['recheck-days']}".`);
    return 1;
  }

  const source = createSource(values.source ?? 'dogshow', {
    userAgent: config.userAgent,
    minIntervalMs: config.minIntervalMs,
    onWarning: log.warn,
  });
  const realSink = createSink(config, values.sink);
  const sink = values['dry-run'] ? dryRun(realSink) : realSink;

  log.info(`Fonte: ${source.label} · Destino: ${sink.label}`);

  const events = await source.listEvents(year);
  const withResults = events.filter((e) => e.hasResults).length;
  log.info(`Calendário ${year}: ${events.length} evento(s), ${withResults} com resultados publicados.`);
  await sink.saveEvents(events);

  if (command === 'events') {
    if (values['dry-run']) printEvents(events);
    return 0;
  }

  let matcher: TargetMatcher | null = null;
  if (!values['all-dogs']) {
    const targets = await loadTargets(config);
    matcher = new TargetMatcher(targets);
    if (matcher.isEmpty) {
      console.error(
        'Nenhum cão do canil para acompanhar. Cadastre o número de registro dos cães no sistema ' +
          'de gestão (com o Supabase configurado no .env), informe CRAWLER_DOG_REGISTRATIONS, ' +
          'ou use --all-dogs para manter todos os cães da raça.',
      );
      return 1;
    }
    log.info(`Cães do canil acompanhados: ${targets.length}.`);
  }

  const selected = events.filter(
    (e) =>
      (!values.event || e.sourceEventId === values.event) &&
      (!values.from || e.date >= values.from) &&
      (!values.to || e.date <= values.to),
  );
  if (values.event && selected.length === 0) {
    console.error(`Evento "${values.event}" não está no calendário de ${year}.`);
    return 1;
  }

  const summary = await collectResults({
    source,
    sink,
    events: selected,
    breeds: config.breeds,
    matcher,
    // Pedir um evento específico é pedir para coletá-lo agora.
    force: values.force || Boolean(values.event),
    recheckDays,
    today,
    log,
    onCollected: printJudgements,
  });

  log.info(
    `\nResumo: ${summary.collected} evento(s) coletado(s), ${summary.skipped} já coletado(s) e ` +
      `pulado(s), ${summary.failed.length} com falha · ${summary.results} resultado(s) em ` +
      `${summary.judgements} julgamento(s).`,
  );
  for (const f of summary.failed) {
    log.warn(`${f.event.date} ${f.event.name} (${f.event.sourceEventId}): ${f.error}`);
  }
  return summary.failed.length > 0 || summary.aborted ? 2 : 0;
}

function createSink(config: Config, choice: string | undefined): Sink {
  const hasSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
  const kind = choice ?? (hasSupabase ? 'supabase' : 'json');
  if (kind === 'json') return new JsonSink(config.dataDir);
  if (kind === 'supabase') {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error('Para --sink supabase, defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.');
    }
    return new SupabaseSink(createSupabase(config.supabaseUrl, config.supabaseServiceRoleKey));
  }
  throw new Error(`Destino desconhecido: "${kind}" (use json ou supabase).`);
}

async function loadTargets(config: Config): Promise<DogTarget[]> {
  const targets: DogTarget[] = config.dogRegistrations.map((registrationNumber) => ({
    registrationNumber,
    registeredName: null,
  }));
  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    const db = createSupabase(config.supabaseUrl, config.supabaseServiceRoleKey);
    targets.push(...(await loadSupabaseTargets(db)));
  }
  return targets;
}

function printEvents(events: ShowEvent[]): void {
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const place = [e.city, e.state].filter(Boolean).join(' - ');
    const flags = [e.hasResults ? 'resultados' : '', e.registrationOpen ? 'inscrições' : '']
      .filter(Boolean)
      .join(', ');
    console.log(`  ${e.date}  ${e.sourceEventId}  ${e.name} · ${place || '—'}${flags ? ` [${flags}]` : ''}`);
  }
}

function printJudgements(_event: ShowEvent, judgements: BreedJudgement[]): void {
  for (const j of judgements) {
    console.log(`    ${j.showName} · ${j.breedName} · árbitro: ${j.judge ?? '—'} · presentes: ${j.dogsPresent ?? '—'}`);
    for (const r of j.results) {
      const extras = [...r.sexAwards, ...r.breedAwards].join(' ');
      console.log(
        `      ${r.dogName} (${r.registrationNumber ?? 'sem registro'}) · ${r.classCode ?? '—'} ` +
          `${r.placement ?? ''} · ${r.awardsRaw || '—'}${extras ? ` · ${extras}` : ''}`,
      );
    }
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
