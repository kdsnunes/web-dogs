import type { BreedJudgement, ShowEvent } from './model';

export interface ResultsQuery {
  /** Raças a coletar, pelo nome como aparece na fonte (comparação sem acento nem caixa). */
  breeds: string[];
}

/**
 * Uma fonte de calendário e resultados. Para suportar uma fonte nova basta implementar
 * esta interface e registrá-la em `sources/index.ts`.
 */
export interface Source {
  /** Identificador estável, gravado junto de cada registro coletado. */
  readonly id: string;
  /** Nome para exibição em logs. */
  readonly label: string;

  /** Lista os eventos do calendário de um ano. */
  listEvents(year: number): Promise<ShowEvent[]>;

  /**
   * Coleta os julgamentos das raças pedidas em um evento. Devolve todos os cães julgados;
   * o filtro dos cães do canil acontece depois, fora da fonte.
   */
  fetchJudgements(event: ShowEvent, query: ResultsQuery): Promise<BreedJudgement[]>;
}

/** Erro de uma fonte que respondeu algo diferente do esperado (layout mudou, sessão trocada...). */
export class SourceError extends Error {
  constructor(
    readonly sourceId: string,
    message: string,
  ) {
    super(`[${sourceId}] ${message}`);
    this.name = 'SourceError';
  }
}
