import { addDays, addMonths, format, parseISO } from 'date-fns';

export type ProtocolUnit = 'days' | 'months';

/** Data de hoje no formato yyyy-mm-dd (para inputs type="date"). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Calcula a data do próximo vencimento a partir da data base e do protocolo. */
export function computeNextDue(
  baseDate: string,
  amount: number | null,
  unit: ProtocolUnit | null,
): string {
  if (!baseDate || !amount || !unit) return '';
  const base = parseISO(baseDate);
  const next = unit === 'months' ? addMonths(base, amount) : addDays(base, amount);
  return format(next, 'yyyy-MM-dd');
}

/** Converte yyyy-mm-dd em dd/mm/yyyy para exibição. */
export function formatDateBR(value: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

const SP_TZ = 'America/Sao_Paulo';

/** Formata um timestamp ISO como data e hora no fuso de São Paulo. */
export function formatDateTimeBR(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: SP_TZ,
  }).format(new Date(iso));
}

/** Formata um timestamp ISO só com a hora, no fuso de São Paulo. */
export function formatTimeBR(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeStyle: 'short',
    timeZone: SP_TZ,
  }).format(new Date(iso));
}
