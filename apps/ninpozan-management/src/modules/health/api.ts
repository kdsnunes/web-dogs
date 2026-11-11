import { supabase } from '@/lib/supabase';
import { isStockCategory } from '@/modules/taxonomy';
import type { HealthEvent } from './types';
import type { HealthEventFormValues } from './schema';

const SELECT = '*, dogs(name), inventory_items(name, unit)';

function toPayload(values: HealthEventFormValues) {
  const nullable = (v?: string) => {
    const t = v?.trim();
    return t ? t : null;
  };
  const stock = isStockCategory(values.category);
  return {
    dog_id: values.dog_id,
    category: values.category,
    subcategory: values.subcategory,
    item_id: stock ? (values.item_id ?? null) : null,
    quantity: stock ? (values.quantity ?? null) : null,
    event_date: values.event_date,
    description: nullable(values.description),
    next_due_date: nullable(values.next_due_date),
  };
}

export async function listHealthEvents(): Promise<HealthEvent[]> {
  const { data, error } = await supabase
    .from('dog_health_events')
    .select(SELECT)
    .order('event_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HealthEvent[];
}

export async function createHealthEvent(
  organizationId: string,
  values: HealthEventFormValues,
): Promise<HealthEvent> {
  const { data, error } = await supabase
    .from('dog_health_events')
    .insert({ organization_id: organizationId, ...toPayload(values) })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as HealthEvent;
}

export async function updateHealthEvent(
  id: string,
  values: HealthEventFormValues,
): Promise<HealthEvent> {
  const { data, error } = await supabase
    .from('dog_health_events')
    .update(toPayload(values))
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as HealthEvent;
}

export async function deleteHealthEvent(id: string): Promise<void> {
  const { error } = await supabase.from('dog_health_events').delete().eq('id', id);
  if (error) throw error;
}
