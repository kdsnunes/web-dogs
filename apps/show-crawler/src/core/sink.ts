import type { BreedJudgement, ShowEvent } from './model';

/** Destino do que é coletado. Hoje: arquivos JSON ou o Supabase do sistema de gestão. */
export interface Sink {
  readonly label: string;

  /** Grava ou atualiza os eventos do calendário. */
  saveEvents(events: ShowEvent[]): Promise<void>;

  /**
   * Substitui os julgamentos gravados de um evento pelos informados e marca o evento como
   * coletado (mesmo com a lista vazia, para não ser buscado de novo sem necessidade).
   */
  saveJudgements(event: ShowEvent, judgements: BreedJudgement[]): Promise<void>;

  /** Eventos de uma fonte cujos resultados já foram coletados. */
  collectedEventIds(source: string): Promise<Set<string>>;
}

/** Envolve um destino para simular a execução: lê o estado real, mas não grava nada. */
export function dryRun(sink: Sink): Sink {
  return {
    label: `${sink.label} (simulação, nada é gravado)`,
    saveEvents: async () => undefined,
    saveJudgements: async () => undefined,
    collectedEventIds: (source) => sink.collectedEventIds(source),
  };
}
