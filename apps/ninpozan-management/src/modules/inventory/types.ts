export type MovementKind = 'entrada' | 'saida';

export interface InventoryItem {
  id: string;
  organization_id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  unit: string;
  min_quantity: number;
  protocol_amount: number | null;
  protocol_unit: 'days' | 'months' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  item_id: string;
  kind: MovementKind;
  quantity: number;
  movement_date: string;
  note: string | null;
  created_at: string;
  inventory_items?: { name: string; unit: string } | null;
}

export const movementKindLabels: Record<MovementKind, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
};

/** Unidades pré-definidas. */
export const itemUnits = ['un', 'ml', 'g', 'kg', 'mg', 'cx'] as const;
