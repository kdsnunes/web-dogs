import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  parseAwards,
  parseBreedMap,
  parseCity,
  parseEvents,
  parseResultsIndex,
  parseSiglas,
} from './parse';

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8');

describe('parseEvents', () => {
  const { events, warnings } = parseEvents(fixture('eventos-2026.html'));

  it('lê todas as linhas de evento, ignorando o cabeçalho', () => {
    expect(events).toHaveLength(7);
    expect(warnings).toEqual([]);
  });

  it('extrai código, clube, data, cidade e UF', () => {
    expect(events[0]).toEqual({
      source: 'dogshow',
      sourceEventId: '0262612A',
      name: 'Kennel Clube de Ribeirão Preto - Cj. Rio Preto KC',
      date: '2026-12-13',
      city: 'POTIRENDABA',
      state: 'SP',
      country: 'BR',
      hasResults: false,
      registrationOpen: true,
    });
  });

  it('marca os eventos com resultados publicados', () => {
    const past = events.find((e) => e.sourceEventId === '1422601A');
    expect(past).toMatchObject({
      name: 'Clube Sorocabano de Cinofilia APENAS SÁBADO',
      date: '2026-01-31',
      city: 'Aracoiaba da Serra',
      state: null,
      hasResults: true,
      registrationOpen: false,
    });
  });

  it('acusa página sem eventos em vez de devolver lista vazia', () => {
    expect(() => parseEvents('<html><body><table></table></body></html>')).toThrow(/layout/);
  });
});

describe('parseCity', () => {
  it('separa cidade e UF em formatos variados', () => {
    expect(parseCity('GOIÂNIA - GO.')).toEqual({ city: 'GOIÂNIA', state: 'GO' });
    expect(parseCity('Curitiba/PR')).toEqual({ city: 'Curitiba', state: 'PR' });
    expect(parseCity('POTIRENDABA SP')).toEqual({ city: 'POTIRENDABA', state: 'SP' });
  });

  it('não inventa UF quando o sufixo não é um estado', () => {
    expect(parseCity('Paulista')).toEqual({ city: 'Paulista', state: null });
    expect(parseCity('Vila Nova - XX')).toEqual({ city: 'Vila Nova - XX', state: null });
    expect(parseCity('')).toEqual({ city: null, state: null });
  });
});

describe('parseResultsIndex', () => {
  const index = parseResultsIndex(fixture('resultados-index.html'));

  it('lê a data do evento ativo', () => {
    expect(index.date).toBe('2026-01-31');
  });

  it('lista as exposições, sem a opção "Todas"', () => {
    expect(index.shows).toEqual([
      { id: '1', name: '112ª EXPOSIÇÃO PANAMERICANA' },
      { id: '2', name: '113ª EXPOSIÇÃO PANAMERICANA' },
      { id: '3', name: '114ª EXPOSIÇÃO PANAMERICANA' },
    ]);
  });

  it('lista as raças com resultado no evento', () => {
    expect(index.breeds).toHaveLength(68);
    expect(index.breeds).toContainEqual({ id: '127', name: 'SHIBA', showIds: null });
  });

  it('lê o layout "on line", com as raças julgadas em cada exposição', () => {
    const online = parseResultsIndex(fixture('resultados-online.html'));
    expect(online.date).toBe('2026-06-20');
    expect(online.shows).toEqual([{ id: '139', name: 'I EXPO. ESTADUAL DO GRUPO 2' }]);
    expect(online.breeds).toHaveLength(9);
    expect(online.breeds).toContainEqual({ id: '28', name: 'ROTTWEILER', showIds: ['139'] });
  });

  it('acusa página sem a lista de exposições', () => {
    expect(() => parseResultsIndex('<html><body></body></html>')).toThrow(/exposições/);
  });
});

describe('parseBreedMap', () => {
  const map = parseBreedMap(fixture('mapa-resultado.html'));

  it('lê evento, raça e o cabeçalho da exposição', () => {
    expect(map.date).toBe('2026-01-31');
    expect(map.breedName).toBe('SHIBA');
    expect(map.sections).toHaveLength(1);
    expect(map.sections[0]).toMatchObject({
      showName: '112ª EXPOSIÇÃO PANAMERICANA',
      judge: 'Christian Galo Molina Galvez',
      dogsPresent: 2,
    });
  });

  it('lê a linha de cada cão', () => {
    const [first, second] = map.sections[0]?.results ?? [];
    expect(first).toEqual({
      registrationNumber: 'RG/SPX/24/04395',
      dogName: 'KAZUO NIHON KEN OF PRODIGUS CANIS',
      catalogNumber: '92',
      sex: 'M',
      classCode: 'JCh',
      placement: '1o.',
      awardsRaw: 'CGC-J 4p. CACPAB-J',
      awards: [
        { code: 'CGC-J', points: 4 },
        { code: 'CACPAB-J', points: null },
      ],
      sexAwards: [],
      breedAwards: ['MJ'],
      points: { cbkc: 1, dsgeral: 1, dsgrupo: 1, dsraca: 1, dscri: 1 },
    });
    expect(second).toMatchObject({
      registrationNumber: 'RG/SPX/24/00506',
      classCode: 'Ab.',
      awards: [
        { code: 'CAC', points: null },
        { code: 'CACPAB', points: null },
      ],
      breedAwards: ['MR'],
      points: { cbkc: 2, dscri: 27 },
    });
  });

  it('acusa página incompleta em vez de devolver resultado vazio', () => {
    expect(() => parseBreedMap('<html><body><p>erro</p></body></html>')).toThrow(/incompleta/);
  });

  it('devolve zero seções quando a raça não foi julgada', () => {
    const html = '<div class="page-title">CLUBE X - 31/01/2026</div>';
    expect(parseBreedMap(html).sections).toEqual([]);
  });
});

describe('parseAwards e parseSiglas', () => {
  it('associa os pontos ao certificado anterior', () => {
    expect(parseAwards('CGC 5p. CAC')).toEqual([
      { code: 'CGC', points: 5 },
      { code: 'CAC', points: null },
    ]);
    expect(parseAwards('  ')).toEqual([]);
  });

  it('extrai as siglas entre parênteses', () => {
    expect(parseSiglas('(MR)(MJ)')).toEqual(['MR', 'MJ']);
    expect(parseSiglas('')).toEqual([]);
  });
});
