export type MovementKind = 'entrada' | 'saida';

export interface InventoryItem {
  id: string;
  organization_id: string;
  name: string;
  category: string | null;
  unit: string;
  min_quantity: number;
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

/** Categorias pré-definidas de itens de estoque. */
export const itemCategories = ['Ração', 'Grooming', 'Medicamentos'] as const;

/** Unidades pré-definidas. */
export const itemUnits = ['un', 'ml', 'g', 'kg', 'mg', 'cx'] as const;
