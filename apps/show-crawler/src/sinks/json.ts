import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BreedJudgement, ShowEvent } from '../core/model';
import type { Sink } from '../core/sink';

/**
 * Grava em arquivos:
 *   <dir>/<fonte>/events.json                 — eventos, indexados pelo identificador da fonte
 *   <dir>/<fonte>/results/<evento>.json       — julgamentos coletados de um evento
 */
export class JsonSink implements Sink {
  readonly label: string;

  constructor(private readonly dir: string) {
    this.label = `arquivos em ${dir}`;
  }

  async saveEvents(events: ShowEvent[]): Promise<void> {
    const bySource = new Map<string, ShowEvent[]>();
    for (const e of events) bySource.set(e.source, [...(bySource.get(e.source) ?? []), e]);

    for (const [source, list] of bySource) {
      const file = join(this.dir, source, 'events.json');
      const current = await readJson<Record<string, ShowEvent>>(file, {});
      for (const e of list) current[e.sourceEventId] = e;
      await writeJson(file, current);
    }
  }

  async saveJudgements(event: ShowEvent, judgements: BreedJudgement[]): Promise<void> {
    const file = join(this.dir, event.source, 'results', `${event.sourceEventId}.json`);
    await writeJson(file, { event, collectedAt: new Date().toISOString(), judgements });
  }

  async collectedEventIds(source: string): Promise<Set<string>> {
    try {
      const files = await readdir(join(this.dir, source, 'results'));
      return new Set(files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
    } catch (error) {
      if (isNotFound(error)) return new Set();
      throw error;
    }
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (error) {
    if (isNotFound(error)) return fallback;
    throw error;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(join(file, '..'), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT';
}
