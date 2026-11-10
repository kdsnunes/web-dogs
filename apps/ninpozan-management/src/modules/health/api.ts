import { supabase } from '@/lib/supabase';
import type { HealthEvent } from './types';
import type { HealthEventFormValues } from './schema';

function toPayload(values: HealthEventFormValues) {
  const nullable = (v?: string) => {
    const t = v?.trim();
    return t ? t : null;
  };
  return {
    dog_id: values.dog_id,
    event_type: values.event_type,
    event_date: values.event_date,
    description: nullable(values.description),
    next_due_date: nullable(values.next_due_date),
  };
}

export async function listHealthEvents(): Promise<HealthEvent[]> {
  const { data, error } = await supabase
    .from('dog_health_events')
    .select('*, dogs(name)')
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
    .select('*, dogs(name)')
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
    .select('*, dogs(name)')
    .single();
  if (error) throw error;
  return data as HealthEvent;
}

export async function deleteHealthEvent(id: string): Promise<void> {
  const { error } = await supabase.from('dog_health_events').delete().eq('id', id);
  if (error) throw error;
}
