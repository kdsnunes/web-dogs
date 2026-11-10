import { describe, it, expect } from 'vitest';
import { computeBalances } from './balance';
import type { InventoryMovement } from './types';

function mov(item_id: string, kind: 'entrada' | 'saida', quantity: number): InventoryMovement {
  return {
    id: crypto.randomUUID(),
    organization_id: 'org',
    item_id,
    kind,
    quantity,
    movement_date: '2026-01-01',
    note: null,
    created_at: '2026-01-01',
  };
}

describe('computeBalances', () => {
  it('soma entradas e subtrai saídas por item', () => {
    const balances = computeBalances([
      mov('a', 'entrada', 10),
      mov('a', 'saida', 3),
      mov('b', 'entrada', 5),
    ]);
    expect(balances.get('a')).toBe(7);
    expect(balances.get('b')).toBe(5);
  });

  it('item sem movimentações não aparece no mapa', () => {
    const balances = computeBalances([]);
    expect(balances.get('x')).toBeUndefined();
  });
});
