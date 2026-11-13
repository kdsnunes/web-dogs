import { supabase } from '@/lib/supabase';
import type { Show, ShowPlan, ShowPlanStatus } from './types';

export interface ShowFormValues {
  event_date: string;
  club: string;
  city?: string;
  source_code?: string;
  notes?: string;
}

function nullable(v?: string) {
  const t = v?.trim();
  return t ? t : null;
}

export async function listShows(year: number): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .gte('event_date', `${year}-01-01`)
    .lt('event_date', `${year + 1}-01-01`)
    .order('event_date');
  if (error) throw error;
  return (data ?? []) as Show[];
}

export async function createShow(organizationId: string, values: ShowFormValues): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .insert({
      organization_id: organizationId,
      event_date: values.event_date,
      club: values.club.trim(),
      city: nullable(values.city),
      source_code: nullable(values.source_code),
      notes: nullable(values.notes),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Show;
}

export async function updateShow(id: string, values: ShowFormValues): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .update({
      event_date: values.event_date,
      club: values.club.trim(),
      city: nullable(values.city),
      source_code: nullable(values.source_code),
      notes: nullable(values.notes),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Show;
}

export async function deleteShow(id: string): Promise<void> {
  const { error } = await supabase.from('shows').delete().eq('id', id);
  if (error) throw error;
}

export async function listShowPlans(): Promise<ShowPlan[]> {
  const { data, error } = await supabase.from('show_plans').select('*, dogs(name)');
  if (error) throw error;
  return (data ?? []) as ShowPlan[];
}

export async function upsertPlan(params: {
  organizationId: string;
  showId: string;
  dogId: string;
  status: ShowPlanStatus;
}): Promise<void> {
  const { error } = await supabase.from('show_plans').upsert(
    {
      organization_id: params.organizationId,
      show_id: params.showId,
      dog_id: params.dogId,
      status: params.status,
    },
    { onConflict: 'show_id,dog_id' },
  );
  if (error) throw error;
}

export async function deletePlan(showId: string, dogId: string): Promise<void> {
  const { error } = await supabase
    .from('show_plans')
    .delete()
    .eq('show_id', showId)
    .eq('dog_id', dogId);
  if (error) throw error;
}
