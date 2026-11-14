import { HttpSession, Throttle } from '../../core/http';
import type { BreedJudgement, ShowEvent } from '../../core/model';
import { SourceError, type ResultsQuery, type Source } from '../../core/source';
import { normalizeKey } from '../../core/text';
import { DOGSHOW_ID, parseBreedMap, parseEvents, parseResultsIndex } from './parse';

const BASE = 'https://www.dogshow.com.br';

export interface DogShowOptions {
  userAgent: string;
  minIntervalMs: number;
  onWarning?: (message: string) => void;
  /** Injetável para testes. */
  fetchFn?: typeof fetch;
}

/**
 * DogShow (dogshow.com.br). O site guarda o "evento ativo" na sessão do servidor: é preciso
 * ativar o evento e só então pedir os resultados, sempre com os mesmos cookies. Por isso cada
 * evento usa uma sessão própria, e a data exibida é conferida a cada página para garantir que
 * os resultados lidos são mesmo do evento pedido.
 */
export class DogShowSource implements Source {
  readonly id = DOGSHOW_ID;
  readonly label = 'DogShow (Brasil)';
  private readonly throttle: Throttle;

  constructor(private readonly options: DogShowOptions) {
    this.throttle = new Throttle({ minIntervalMs: options.minIntervalMs });
  }

  async listEvents(year: number): Promise<ShowEvent[]> {
    const page = await this.newSession().get(`${BASE}/Eventos/eventos.asp?ano=${year}`);
    const { events, warnings } = parseEvents(page.body);
    for (const w of warnings) this.options.onWarning?.(w);
    return events;
  }

  async fetchJudgements(event: ShowEvent, query: ResultsQuery): Promise<BreedJudgement[]> {
    const session = this.newSession();
    const activateUrl = `${BASE}/Resultados/ativaresultadoget.asp?Evento=${encodeURIComponent(event.sourceEventId)}`;
    const indexPage = await session.get(activateUrl);
    const index = parseResultsIndex(indexPage.body);
    this.assertSameEvent(event, index.date, 'índice de resultados');

    const wanted = new Set(query.breeds.map(normalizeKey));
    const breeds = index.breeds.filter((b) => wanted.has(normalizeKey(b.name)));

    const judgements: BreedJudgement[] = [];
    for (const breed of breeds) {
      for (const show of index.shows) {
        const page = await session.postForm(
          `${BASE}/Resultados/mapa-resultado.asp?idioma=1`,
          { optCao: '', Exposicao: show.id, cboRaca: breed.id },
          indexPage.url,
        );
        const map = parseBreedMap(page.body);
        this.assertSameEvent(event, map.date, 'mapa de resultados');
        if (map.sections.length > 1) {
          throw new SourceError(this.id, `mapa da exposição ${show.id} trouxe mais de uma exposição`);
        }
        const section = map.sections[0];
        if (!section) continue; // raça não julgada nesta exposição
        if (normalizeKey(section.showName) !== normalizeKey(show.name)) {
          throw new SourceError(
            this.id,
            `exposição "${section.showName}" não confere com a pedida ("${show.name}")`,
          );
        }
        judgements.push({
          source: this.id,
          sourceEventId: event.sourceEventId,
          sourceShowId: show.id,
          showName: show.name,
          breedId: breed.id,
          breedName: breed.name,
          judge: section.judge,
          dogsPresent: section.dogsPresent,
          results: section.results,
        });
      }
    }
    return judgements;
  }

  private assertSameEvent(event: ShowEvent, pageDate: string | null, where: string): void {
    if (pageDate !== event.date) {
      throw new SourceError(
        this.id,
        `${where} do evento ${event.sourceEventId} mostra a data ${pageDate ?? 'ausente'}, esperada ${event.date}`,
      );
    }
  }

  private newSession(): HttpSession {
    return new HttpSession({
      userAgent: this.options.userAgent,
      throttle: this.throttle,
      defaultCharset: 'iso-8859-1',
      fetchFn: this.options.fetchFn,
    });
  }
}
