import { describe, it, expect } from 'vitest';
import { buildAlerts } from './alerts';
import type { HealthEvent } from '@/modules/health/types';
import type { InventoryItem, InventoryMovement } from '@/modules/inventory/types';

function ev(id: string, due: string | null): HealthEvent {
  return {
    id,
    organization_id: 'o',
    dog_id: 'd',
    category: 'Saúde',
    subcategory: 'Antiparasitário',
    item_id: null,
    quantity: null,
    event_date: '2026-01-01',
    description: null,
    next_due_date: due,
    created_at: '',
    updated_at: '',
  };
}

function item(id: string, min: number): InventoryItem {
  return {
    id,
    organization_id: 'o',
    name: `item ${id}`,
    category: 'Saúde',
    subcategory: null,
    unit: 'un',
    min_quantity: min,
    protocol_amount: null,
    protocol_unit: null,
    notes: null,
    created_at: '',
    updated_at: '',
  };
}

function mov(itemId: string, kind: 'entrada' | 'saida', qty: number): InventoryMovement {
  return {
    id: `${itemId}-${kind}-${qty}`,
    organization_id: 'o',
    item_id: itemId,
    kind,
    quantity: qty,
    movement_date: '2026-01-01',
    note: null,
    created_at: '',
  };
}

describe('buildAlerts', () => {
  const now = new Date('2026-06-15T12:00:00');

  it('separa atrasados e vencendo', () => {
    const a = buildAlerts(
      [ev('1', '2026-06-01'), ev('2', '2026-06-20'), ev('3', '2026-09-01'), ev('4', null)],
      [],
      [],
      { now, upcomingDays: 15 },
    );
    expect(a.overdue.map((x) => x.event.id)).toEqual(['1']);
    expect(a.dueSoon.map((x) => x.event.id)).toEqual(['2']);
    expect(a.total).toBe(2);
  });

  it('detecta estoque baixo pelo saldo', () => {
    const a = buildAlerts(
      [],
      [item('x', 5), item('y', 0)],
      [mov('x', 'entrada', 10), mov('x', 'saida', 7)], // saldo x = 3 <= 5
      { now },
    );
    expect(a.lowStock.map((x) => x.item.id)).toEqual(['x']);
    expect(a.lowStock[0].balance).toBe(3);
  });
});
