import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { DayEntry, DayStatus, MonthLockState } from './types';

/** Chave 'yyyy-MM' de um mês (base para comparação cronológica e persistência). */
export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

/** Primeiro dia do mês em formato ISO 'yyyy-MM-01' (usado como reference_month). */
export function monthStartISO(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM-dd');
}

/** Data ISO 'yyyy-MM-dd' de um dia (sem fuso — é uma data civil). */
export function dayISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function addMonthsTo(date: Date, amount: number): Date {
  return addMonths(date, amount);
}

export function monthTitle(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Grade do mês em semanas (domingo→sábado), incluindo dias "vazantes" dos
 * meses vizinhos para completar as linhas.
 */
export function buildMonthGrid(date: Date): Date[][] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export interface MonthWindow {
  /** Pode marcar/alterar dias trabalhados. */
  canWork: boolean;
  /** Pode marcar/alterar folga e folga vendida. */
  canRest: boolean;
  /** Alguma edição é possível. */
  editable: boolean;
  /** Motivo do bloqueio (para exibir na UI), ou null. */
  reason: string | null;
}

/**
 * Espelha, no cliente, a janela de lançamento aplicada pelo trigger do banco.
 * A comparação é feita por 'yyyy-MM' (string ordenável).
 */
export function computeMonthWindow(opts: {
  monthKey: string;
  currentMonthKey: string;
  lockState: MonthLockState | null;
  isAdmin: boolean;
}): MonthWindow {
  const { monthKey: m, currentMonthKey: cur, lockState, isAdmin } = opts;

  if (lockState === 'fechado') {
    return {
      canWork: false,
      canRest: false,
      editable: false,
      reason: 'Mês fechado pelo administrador.',
    };
  }

  if (isAdmin) {
    return { canWork: true, canRest: true, editable: true, reason: null };
  }

  if (m === cur) {
    return { canWork: true, canRest: true, editable: true, reason: null };
  }

  if (m > cur) {
    return {
      canWork: false,
      canRest: true,
      editable: true,
      reason: 'Mês futuro: só é possível planejar folgas.',
    };
  }

  // Mês passado
  if (lockState === 'reaberto') {
    return { canWork: true, canRest: true, editable: true, reason: null };
  }
  return {
    canWork: false,
    canRest: false,
    editable: false,
    reason: 'Mês anterior fechado. Peça ao administrador para reabrir.',
  };
}

export interface MonthSummary {
  trabalhado: number;
  folga: number;
  folga_vendida: number;
}

export function summarize(entries: Pick<DayEntry, 'status'>[]): MonthSummary {
  const base: MonthSummary = { trabalhado: 0, folga: 0, folga_vendida: 0 };
  for (const e of entries) base[e.status] += 1;
  return base;
}

/** Próximo status ao clicar numa célula, conforme o tipo de dia e permissões. */
export function nextStatusOnClick(
  current: DayStatus | null,
  isRestDay: boolean,
  window: MonthWindow,
): DayStatus | null | 'blocked' {
  if (isRestDay) {
    if (!window.canRest) return 'blocked';
    // ciclo: vazio → folga → folga vendida → vazio
    if (current === null) return 'folga';
    if (current === 'folga') return 'folga_vendida';
    return null;
  }
  if (!window.canWork) return 'blocked';
  // ciclo: vazio → trabalhado → vazio
  return current === 'trabalhado' ? null : 'trabalhado';
}
