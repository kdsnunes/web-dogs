import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryMovement } from './types';
import type { ItemFormValues, MovementFormValues } from './schema';

function itemPayload(values: ItemFormValues) {
  const nullable = (v?: string) => {
    const t = v?.trim();
    return t ? t : null;
  };
  return {
    name: values.name.trim(),
    category: values.category,
    subcategory: values.subcategory,
    unit: values.unit.trim(),
    min_quantity: values.min_quantity,
    protocol_amount: values.protocol_amount ?? null,
    protocol_unit: values.protocol_amount ? values.protocol_unit : null,
    notes: nullable(values.notes),
  };
}

export async function listItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as InventoryItem[];
}

export async function createItem(
  organizationId: string,
  values: ItemFormValues,
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ organization_id: organizationId, ...itemPayload(values) })
    .select()
    .single();
  if (error) throw error;
  return data as InventoryItem;
}

export async function updateItem(id: string, values: ItemFormValues): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(itemPayload(values))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as InventoryItem;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

export async function listMovements(): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, inventory_items(name, unit)')
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as InventoryMovement[];
}

export async function createMovement(
  organizationId: string,
  itemId: string,
  values: MovementFormValues,
): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      organization_id: organizationId,
      item_id: itemId,
      kind: values.kind,
      quantity: values.quantity,
      movement_date: values.movement_date,
      note: values.note?.trim() ? values.note.trim() : null,
    })
    .select('*, inventory_items(name, unit)')
    .single();
  if (error) throw error;
  return data as InventoryMovement;
}

export async function deleteMovement(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_movements').delete().eq('id', id);
  if (error) throw error;
}
