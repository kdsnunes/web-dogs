import * as cheerio from 'cheerio';
import type { Award, DogResult, ShowEvent } from '../../core/model';
import { SourceError } from '../../core/source';
import { cleanText, normalizeKey, parseBrDate, toIntOrNull } from '../../core/text';

export const DOGSHOW_ID = 'dogshow';

const UFS = new Set(
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '),
);

// ---------------------------------------------------------------------------
// Calendário (Eventos/eventos.asp)
// ---------------------------------------------------------------------------

export interface ParsedEvents {
  events: ShowEvent[];
  /** Linhas ignoradas por não terem o formato esperado, para aparecerem no log. */
  warnings: string[];
}

export function parseEvents(html: string): ParsedEvents {
  const $ = cheerio.load(html);
  const rows = $('tr').filter((_, tr) => $(tr).find('a[id^="Ativa"]').length > 0);
  if (rows.length === 0) {
    throw new SourceError(DOGSHOW_ID, 'calendário sem nenhuma linha de evento (o layout mudou?)');
  }

  const events: ShowEvent[] = [];
  const warnings: string[] = [];
  rows.each((_, tr) => {
    const row = $(tr);
    const code = (row.find('a[id^="Ativa"]').attr('id') ?? '').slice('Ativa'.length);
    const cells = row.children('td');
    const name = cleanText(cells.eq(1).text());
    const dateText = cleanText(cells.eq(2).text());
    const date = parseBrDate(dateText);
    if (!code || !name || !date) {
      warnings.push(`evento ignorado (código "${code}", nome "${name}", data "${dateText}")`);
      return;
    }
    events.push({
      source: DOGSHOW_ID,
      sourceEventId: code,
      name,
      date,
      ...parseCity(cleanText(cells.eq(3).text())),
      country: 'BR',
      hasResults: row.find('a[href*="ativaresultadoget.asp"]').length > 0,
      registrationOpen: row.find('a[href*="ativainscricaoget.asp"]').length > 0,
    });
  });
  return { events, warnings };
}

/** "POTIRENDABA - SP" → cidade e UF; sem UF reconhecível, tudo vira cidade. */
export function parseCity(raw: string): { city: string | null; state: string | null } {
  if (!raw) return { city: null, state: null };
  // Com traço ou barra a UF pode vir em qualquer caixa; separada só por espaço
  // ("POTIRENDABA SP") precisa estar em maiúsculas, para não confundir com o fim do nome.
  const m = /^(.*?)\s*[-/]\s*([A-Za-z]{2})\.?$/.exec(raw) ?? /^(.*?)\s+([A-Z]{2})\.?$/.exec(raw);
  const uf = m?.[2]?.toUpperCase();
  if (m?.[1] && uf && UFS.has(uf)) return { city: m[1].trim(), state: uf };
  return { city: raw, state: null };
}

// ---------------------------------------------------------------------------
// Índice de resultados de um evento (Resultados/resultados.asp)
// ---------------------------------------------------------------------------

export interface ParsedOption {
  id: string;
  name: string;
}

export interface ParsedResultsIndex {
  /** Data do evento ativo na sessão, para conferir se é o evento pedido. */
  date: string | null;
  shows: ParsedOption[];
  breeds: ParsedOption[];
}

export function parseResultsIndex(html: string): ParsedResultsIndex {
  const $ = cheerio.load(html);
  const expoSelect = $('select[name="cboExpo"]').first();
  if (expoSelect.length === 0) {
    throw new SourceError(DOGSHOW_ID, 'página de resultados sem a lista de exposições');
  }
  const options = (select: ReturnType<typeof $>): ParsedOption[] =>
    select
      .find('option')
      .map((_, o) => ({ id: ($(o).attr('value') ?? '').trim(), name: cleanText($(o).text()) }))
      .get()
      .filter((o) => o.id !== '' && o.name !== '');

  return {
    date: titleDate($),
    shows: options(expoSelect).filter((o) => o.id !== '0'),
    breeds: options($('select[name="cboRaca"]').first()),
  };
}

// ---------------------------------------------------------------------------
// Mapa de resultados de uma raça em uma exposição (Resultados/mapa-resultado.asp)
// ---------------------------------------------------------------------------

export interface ParsedBreedSection {
  showName: string;
  judge: string | null;
  dogsPresent: number | null;
  results: DogResult[];
}

export interface ParsedBreedMap {
  date: string | null;
  breedName: string;
  sections: ParsedBreedSection[];
}

export function parseBreedMap(html: string): ParsedBreedMap {
  const $ = cheerio.load(html);
  if ($('.page-title').length === 0) {
    throw new SourceError(DOGSHOW_ID, 'mapa de resultados sem título (página incompleta)');
  }
  const breedName = cleanText($('.page-description h3').first().text()).replace(
    /^RESULTADOS DA RA[ÇC]A\s*/i,
    '',
  );

  const sections: ParsedBreedSection[] = [];
  $('table thead').each((_, thead) => {
    const head = $(thead);
    const banner = head.find('th[colspan]').first();
    if (banner.length === 0) return;

    const lines = (banner.html() ?? '')
      .split(/<br\s*\/?>/i)
      .map((part) => cleanText(cheerio.load(part).text()))
      .filter(Boolean);
    const field = (label: RegExp) =>
      lines.find((l) => label.test(l))?.replace(label, '').trim() || null;

    const columns = head
      .find('tr')
      .last()
      .children('th')
      .map((_, th) => normalizeKey($(th).text()))
      .get();
    const col = (key: string) => columns.indexOf(key);

    const results: DogResult[] = [];
    head
      .next('tbody')
      .children('tr')
      .each((_, tr) => {
        const row = $(tr);
        const link = row.find('a[id^="DetalheCao"]');
        if (link.length === 0) return;
        const cells = row.children('td');
        const cell = (key: string) => (col(key) >= 0 ? cleanText(cells.eq(col(key)).text()) : '');

        const sex = cell('S').toUpperCase();
        const points: Record<string, number | null> = {};
        columns.forEach((key, index) => {
          if (key.startsWith('PTS')) {
            points[key.slice(3).toLowerCase()] = toIntOrNull(cleanText(cells.eq(index).text()));
          }
        });
        const awardsRaw = cell('TIT');
        results.push({
          registrationNumber: cleanText(link.attr('value') ?? '') || null,
          dogName: cell('NOME'),
          catalogNumber: cell('N') || null,
          sex: sex === 'M' || sex === 'F' ? sex : null,
          classCode: cell('CL') || null,
          placement: cell('CLASSIF') || null,
          awardsRaw,
          awards: parseAwards(awardsRaw),
          sexAwards: parseSiglas(cell('SEXO')),
          breedAwards: parseSiglas(cell('RACA')),
          points,
        });
      });

    sections.push({
      showName: lines[0] ?? '',
      judge: field(/^[ÁA]rbitro:\s*/i),
      dogsPresent: toIntOrNull(field(/^N[úu]mero de c[ãa]es presentes:\s*/i) ?? ''),
      results,
    });
  });

  return { date: titleDate($), breedName, sections };
}

/** "CGC-J 4p. CACPAB-J" → CGC-J (4 pontos) e CACPAB-J. */
export function parseAwards(raw: string): Award[] {
  const awards: Award[] = [];
  for (const token of cleanText(raw).split(' ').filter(Boolean)) {
    const pts = /^(\d+)p\.?$/i.exec(token);
    const last = awards[awards.length - 1];
    if (pts && last) last.points = Number(pts[1]);
    else awards.push({ code: token, points: null });
  }
  return awards;
}

/** "(MR)(MJ)" → ["MR", "MJ"]. */
export function parseSiglas(raw: string): string[] {
  return [...raw.matchAll(/\(([A-Za-z]+)\)/g)].map((m) => (m[1] ?? '').toUpperCase());
}

function titleDate($: cheerio.CheerioAPI): string | null {
  const m = /(\d{2}\/\d{2}\/\d{4})/.exec($('.page-title').first().text());
  return m?.[1] ? parseBrDate(m[1]) : null;
}
