import { describe, expect, it } from 'vitest';
import { decodeBody, HttpSession, Throttle } from './http';
import type { BreedJudgement, DogResult, ShowEvent } from './model';
import { collectResults, selectEventsToCollect } from './pipeline';
import type { Sink } from './sink';
import type { Source } from './source';
import { keepTargets, TargetMatcher } from './targets';
import { normalizeKey, parseBrDate } from './text';

const event = (id: string, date: string, hasResults = true): ShowEvent => ({
  source: 'fake',
  sourceEventId: id,
  name: `Evento ${id}`,
  date,
  city: null,
  state: null,
  country: 'BR',
  hasResults,
  registrationOpen: false,
});

const result = (registrationNumber: string | null, dogName: string): DogResult => ({
  registrationNumber,
  dogName,
  catalogNumber: null,
  sex: null,
  classCode: null,
  placement: null,
  awardsRaw: '',
  awards: [],
  sexAwards: [],
  breedAwards: [],
  points: {},
});

const judgement = (eventId: string, results: DogResult[]): BreedJudgement => ({
  source: 'fake',
  sourceEventId: eventId,
  sourceShowId: '1',
  showName: 'Exposição 1',
  breedId: '127',
  breedName: 'SHIBA',
  judge: null,
  dogsPresent: results.length,
  results,
});

describe('text', () => {
  it('normaliza chaves sem acento, caixa ou pontuação', () => {
    expect(normalizeKey('rg/spx/24/04395')).toBe('RGSPX2404395');
    expect(normalizeKey(' São  Bernardo ')).toBe('SAOBERNARDO');
  });

  it('converte datas brasileiras e rejeita as inválidas', () => {
    expect(parseBrDate('31/01/2026')).toBe('2026-01-31');
    expect(parseBrDate('31/02/2026')).toBeNull();
    expect(parseBrDate('12 a 14/12/2026')).toBeNull();
  });
});

describe('TargetMatcher', () => {
  const matcher = new TargetMatcher([
    { registrationNumber: 'RG/SPX/24/04395', registeredName: null },
    { registrationNumber: null, registeredName: 'Ninpozan Go Hayato' },
  ]);

  it('casa pelo registro, tolerando grafias diferentes', () => {
    expect(matcher.matches(result('rg spx 24 04395', 'QUALQUER NOME'))).toBe(true);
  });

  it('casa pelo nome registrado quando o registro difere', () => {
    expect(matcher.matches(result('PEDIGREE-ESTRANGEIRO', 'NINPOZAN GO HAYATO'))).toBe(true);
  });

  it('não casa cães de fora do canil', () => {
    expect(matcher.matches(result('RG/SPX/24/00506', 'OUTRO CAO'))).toBe(false);
  });

  it('descarta julgamentos sem cães do canil', () => {
    const kept = keepTargets(
      [
        judgement('A', [result('RG/SPX/24/04395', 'X'), result('RG/SPX/24/00506', 'Y')]),
        judgement('A', [result('RG/SPX/24/00506', 'Y')]),
      ],
      matcher,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0]?.results.map((r) => r.registrationNumber)).toEqual(['RG/SPX/24/04395']);
    expect(kept[0]?.dogsPresent).toBe(2);
  });

  it('sabe quando não há nenhum cão para acompanhar', () => {
    expect(new TargetMatcher([{ registrationNumber: ' ', registeredName: null }]).isEmpty).toBe(true);
    expect(matcher.isEmpty).toBe(false);
  });
});

describe('selectEventsToCollect', () => {
  const events = [
    event('NOVO', '2026-11-01'),
    event('ANTIGO', '2026-03-01'),
    event('RECENTE', '2026-11-05'),
    event('FUTURO', '2026-12-20', false),
  ];
  const collected = new Set(['ANTIGO', 'RECENTE']);
  const base = { force: false, recheckDays: 30, today: '2026-11-14' };

  it('coleta os novos e recoleta os recentes, em ordem de data', () => {
    const ids = selectEventsToCollect(events, collected, base).map((e) => e.sourceEventId);
    expect(ids).toEqual(['NOVO', 'RECENTE']);
  });

  it('com force, recoleta tudo que tem resultado', () => {
    const ids = selectEventsToCollect(events, collected, { ...base, force: true });
    expect(ids.map((e) => e.sourceEventId)).toEqual(['ANTIGO', 'NOVO', 'RECENTE']);
  });
});

describe('collectResults', () => {
  function memorySink(collected: string[] = []) {
    const saved = new Map<string, BreedJudgement[]>();
    const sink: Sink = {
      label: 'memória',
      saveEvents: async () => undefined,
      saveJudgements: async (e, j) => void saved.set(e.sourceEventId, j),
      collectedEventIds: async () => new Set(collected),
    };
    return { sink, saved };
  }
  const silent = { info: () => undefined, warn: () => undefined };

  it('filtra pelos cães do canil, grava e segue adiante quando um evento falha', async () => {
    const source: Source = {
      id: 'fake',
      label: 'Fake',
      listEvents: async () => [],
      fetchJudgements: async (e) => {
        if (e.sourceEventId === 'B') throw new Error('layout mudou');
        return [judgement(e.sourceEventId, [result('RG/1', 'MEU'), result('RG/2', 'ALHEIO')])];
      },
    };
    const { sink, saved } = memorySink();
    const summary = await collectResults({
      source,
      sink,
      events: [event('A', '2026-01-10'), event('B', '2026-02-10'), event('C', '2026-03-10')],
      breeds: ['SHIBA'],
      matcher: new TargetMatcher([{ registrationNumber: 'RG/1', registeredName: null }]),
      force: false,
      recheckDays: 30,
      today: '2026-11-14',
      log: silent,
    });

    expect(summary).toMatchObject({ collected: 2, skipped: 0, judgements: 2, results: 2, aborted: false });
    expect(summary.failed.map((f) => f.event.sourceEventId)).toEqual(['B']);
    expect([...saved.keys()]).toEqual(['A', 'C']);
    expect(saved.get('A')?.[0]?.results.map((r) => r.dogName)).toEqual(['MEU']);
  });

  it('interrompe depois de cinco falhas seguidas', async () => {
    let calls = 0;
    const source: Source = {
      id: 'fake',
      label: 'Fake',
      listEvents: async () => [],
      fetchJudgements: async () => {
        calls += 1;
        throw new Error('bloqueado');
      },
    };
    const events = Array.from({ length: 8 }, (_, i) => event(`E${i}`, `2026-01-0${i + 1}`));
    const summary = await collectResults({
      source,
      sink: memorySink().sink,
      events,
      breeds: ['SHIBA'],
      matcher: null,
      force: false,
      recheckDays: 30,
      today: '2026-11-14',
      log: silent,
    });
    expect(calls).toBe(5);
    expect(summary.aborted).toBe(true);
  });
});

describe('http', () => {
  it('decodifica latin-1 declarado na tag meta', () => {
    const html = '<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">GOI\xc2NIA';
    const bytes = Uint8Array.from(html, (c) => c.charCodeAt(0));
    expect(decodeBody(bytes, 'text/html')).toContain('GOIÂNIA');
  });

  it('usa o charset padrão da fonte quando nada é declarado', () => {
    const bytes = Uint8Array.from('S\xc3O', (c) => c.charCodeAt(0));
    expect(decodeBody(bytes, null, 'iso-8859-1')).toBe('SÃO');
  });

  it('segue redirecionamento mantendo os cookies da sessão', async () => {
    const seen: { url: string; method: string; cookie: string | null }[] = [];
    const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      seen.push({ url, method: init?.method ?? 'GET', cookie: headers.get('cookie') });
      if (url.endsWith('/ativa')) {
        return new Response(null, {
          status: 302,
          headers: { location: 'pagina?x=1', 'set-cookie': 'SESSAO=abc; path=/; secure' },
        });
      }
      return new Response('ok', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
    }) as typeof fetch;

    const session = new HttpSession({
      userAgent: 'teste',
      throttle: new Throttle({ minIntervalMs: 0 }),
      fetchFn,
    });
    const res = await session.postForm('https://exemplo.test/dir/ativa', { a: '1' });

    expect(res).toEqual({ status: 200, url: 'https://exemplo.test/dir/pagina?x=1', body: 'ok' });
    expect(seen).toEqual([
      { url: 'https://exemplo.test/dir/ativa', method: 'POST', cookie: null },
      { url: 'https://exemplo.test/dir/pagina?x=1', method: 'GET', cookie: 'SESSAO=abc' },
    ]);
  });

  it('espaça as requisições pelo intervalo mínimo', async () => {
    const throttle = new Throttle({ minIntervalMs: 60 });
    const starts: number[] = [];
    await Promise.all([1, 2, 3].map(() => throttle.run(async () => void starts.push(Date.now()))));
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(55);
    expect((starts[2] ?? 0) - (starts[1] ?? 0)).toBeGreaterThanOrEqual(55);
  });
});
