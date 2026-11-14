/** Colapsa espaços (incluindo &nbsp; já decodificado) e apara as pontas. */
export function cleanText(value: string): string {
  return value.replace(/[\s\u00a0]+/g, ' ').trim();
}

/** Chave de comparação: sem acentos, maiúscula, só letras e números. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

/** Converte dd/mm/yyyy em yyyy-mm-dd; devolve null se não for uma data válida. */
export function parseBrDate(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  const valid =
    date.getUTCFullYear() === Number(yyyy) &&
    date.getUTCMonth() === Number(mm) - 1 &&
    date.getUTCDate() === Number(dd);
  return valid ? `${yyyy}-${mm}-${dd}` : null;
}

export function toIntOrNull(value: string): number | null {
  const t = value.trim();
  return /^-?\d+$/.test(t) ? Number(t) : null;
}
