import { supabase } from '@/lib/supabase';
import type { Dog } from './types';
import type { DogFormValues } from './schema';

/** Converte strings vazias de campos opcionais em null para o banco. */
function toPayload(values: DogFormValues) {
  const nullable = (v?: string) => {
    const t = v?.trim();
    return t ? t : null;
  };
  return {
    name: values.name.trim(),
    registered_name: nullable(values.registered_name),
    breed: values.breed.trim(),
    sex: values.sex,
    birth_date: nullable(values.birth_date),
    color: nullable(values.color),
    microchip: nullable(values.microchip),
    registration_number: nullable(values.registration_number),
    status: values.status,
    in_campaign: values.in_campaign ?? false,
    notes: nullable(values.notes),
  };
}

export async function listDogs(): Promise<Dog[]> {
  const { data, error } = await supabase.from('dogs').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Dog[];
}

export async function createDog(organizationId: string, values: DogFormValues): Promise<Dog> {
  const { data, error } = await supabase
    .from('dogs')
    .insert({ organization_id: organizationId, ...toPayload(values) })
    .select()
    .single();
  if (error) throw error;
  return data as Dog;
}

export async function updateDog(id: string, values: DogFormValues): Promise<Dog> {
  const { data, error } = await supabase
    .from('dogs')
    .update(toPayload(values))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Dog;
}

export async function deleteDog(id: string): Promise<void> {
  const { error } = await supabase.from('dogs').delete().eq('id', id);
  if (error) throw error;
}
