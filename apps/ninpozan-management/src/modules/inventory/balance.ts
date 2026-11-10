import type { InventoryMovement } from './types';

/**
 * Calcula o saldo de cada item a partir das movimentações.
 * entrada soma, saída subtrai. O saldo nunca é editado diretamente.
 */
export function computeBalances(movements: InventoryMovement[]): Map<string, number> {
  const balances = new Map<string, number>();
  for (const movement of movements) {
    const delta =
      movement.kind === 'entrada' ? Number(movement.quantity) : -Number(movement.quantity);
    balances.set(movement.item_id, (balances.get(movement.item_id) ?? 0) + delta);
  }
  return balances;
}
