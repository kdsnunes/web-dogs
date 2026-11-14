import type { BreedJudgement, ShowEvent } from './model';
import type { Sink } from './sink';
import type { Source } from './source';
import { keepTargets, type TargetMatcher } from './targets';

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
}

export interface ResultsOptions {
  source: Source;
  sink: Sink;
  events: ShowEvent[];
  breeds: string[];
  /** Cães do canil; `null` mantém todos os cães das raças pedidas. */
  matcher: TargetMatcher | null;
  /** Recoleta eventos já coletados. */
  force: boolean;
  /**
   * Eventos realizados há menos dias que isto são sempre recoletados: os clubes publicam
   * resultados provisórios e corrigem depois.
   */
  recheckDays: number;
  /** Data de hoje, yyyy-mm-dd. */
  today: string;
  log: Logger;
  onCollected?: (event: ShowEvent, judgements: BreedJudgement[]) => void;
}

export interface ResultsSummary {
  collected: number;
  skipped: number;
  judgements: number;
  results: number;
  failed: { event: ShowEvent; error: string }[];
  /** Verdadeiro se a execução parou antes do fim por falhas seguidas. */
  aborted: boolean;
}

/** Falhas seguidas que interrompem a execução: sinal de bloqueio ou de mudança de layout. */
const MAX_CONSECUTIVE_FAILURES = 5;

export function selectEventsToCollect(
  events: ShowEvent[],
  collected: Set<string>,
  options: Pick<ResultsOptions, 'force' | 'recheckDays' | 'today'>,
): ShowEvent[] {
  const recheckFrom = addDays(options.today, -options.recheckDays);
  return events
    .filter((e) => e.hasResults)
    .filter((e) => options.force || !collected.has(e.sourceEventId) || e.date >= recheckFrom)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function collectResults(options: ResultsOptions): Promise<ResultsSummary> {
  const { source, sink, log } = options;
  const collected = await sink.collectedEventIds(source.id);
  const withResults = options.events.filter((e) => e.hasResults);
  const pending = selectEventsToCollect(options.events, collected, options);

  const summary: ResultsSummary = {
    collected: 0,
    skipped: withResults.length - pending.length,
    judgements: 0,
    results: 0,
    failed: [],
    aborted: false,
  };

  let consecutiveFailures = 0;
  for (const [i, event] of pending.entries()) {
    const tag = `[${i + 1}/${pending.length}] ${event.date} ${event.name} (${event.sourceEventId})`;
    try {
      const all = await source.fetchJudgements(event, { breeds: options.breeds });
      const kept = options.matcher ? keepTargets(all, options.matcher) : all;
      await sink.saveJudgements(event, kept);

      const rows = kept.reduce((n, j) => n + j.results.length, 0);
      summary.collected += 1;
      summary.judgements += kept.length;
      summary.results += rows;
      consecutiveFailures = 0;
      log.info(`${tag}: ${rows} resultado(s) em ${kept.length} julgamento(s)`);
      options.onCollected?.(event, kept);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.failed.push({ event, error: message });
      log.warn(`${tag}: falhou — ${message}`);
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        summary.aborted = true;
        log.warn(`${MAX_CONSECUTIVE_FAILURES} falhas seguidas; execução interrompida.`);
        break;
      }
    }
  }
  return summary;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
