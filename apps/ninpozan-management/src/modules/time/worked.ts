import type { TimeEntryKind } from './types';

type Punch = { kind: TimeEntryKind; occurred_at: string };

/**
 * Calcula os minutos trabalhados a partir de uma lista de batidas de um
 * funcionário. Pareia entrada→saída. Se houver uma entrada em aberto,
 * conta até `now`.
 */
export function workedMinutes(entries: Punch[], now: Date = new Date()): number {
  const sorted = [...entries].sort((a, b) => (a.occurred_at < b.occurred_at ? -1 : 1));
  let total = 0;
  let openedAt: number | null = null;

  for (const entry of sorted) {
    if (entry.kind === 'entrada') {
      openedAt = new Date(entry.occurred_at).getTime();
    } else if (entry.kind === 'saida' && openedAt != null) {
      total += (new Date(entry.occurred_at).getTime() - openedAt) / 60000;
      openedAt = null;
    }
  }

  if (openedAt != null) {
    total += (now.getTime() - openedAt) / 60000;
  }

  return Math.max(0, Math.round(total));
}

/** Formata minutos como "Xh YYmin". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}
