import { differenceInCalendarDays, parseISO } from 'date-fns';
import { computeBalances } from '@/modules/inventory/balance';
import type { InventoryItem, InventoryMovement } from '@/modules/inventory/types';
import type { HealthEvent } from '@/modules/health/types';

export interface ProtocolAlert {
  event: HealthEvent;
  dueDate: string;
  days: number; // negativo = atrasado
}

export interface LowStockAlert {
  item: InventoryItem;
  balance: number;
}

export interface Alerts {
  overdue: ProtocolAlert[];
  dueSoon: ProtocolAlert[];
  lowStock: LowStockAlert[];
  total: number;
}

/**
 * Deriva avisos (sem backend) a partir dos dados existentes:
 *  • protocolos de saúde atrasados ou vencendo em até `upcomingDays`;
 *  • itens de estoque em/abaixo do mínimo.
 */
export function buildAlerts(
  events: HealthEvent[],
  items: InventoryItem[],
  movements: InventoryMovement[],
  opts: { upcomingDays?: number; now?: Date } = {},
): Alerts {
  const upcomingDays = opts.upcomingDays ?? 15;
  const now = opts.now ?? new Date();

  const overdue: ProtocolAlert[] = [];
  const dueSoon: ProtocolAlert[] = [];
  for (const event of events) {
    if (!event.next_due_date) continue;
    const days = differenceInCalendarDays(parseISO(event.next_due_date), now);
    if (days < 0) overdue.push({ event, dueDate: event.next_due_date, days });
    else if (days <= upcomingDays) dueSoon.push({ event, dueDate: event.next_due_date, days });
  }
  overdue.sort((a, b) => a.days - b.days);
  dueSoon.sort((a, b) => a.days - b.days);

  const balances = computeBalances(movements);
  const lowStock: LowStockAlert[] = items
    .filter((item) => item.min_quantity > 0 && (balances.get(item.id) ?? 0) <= item.min_quantity)
    .map((item) => ({ item, balance: balances.get(item.id) ?? 0 }));

  return {
    overdue,
    dueSoon,
    lowStock,
    total: overdue.length + dueSoon.length + lowStock.length,
  };
}
