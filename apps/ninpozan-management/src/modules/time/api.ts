import { supabase } from '@/lib/supabase';
import type { TimeEntry, TimeEntryKind } from './types';

const SELECT = '*, profiles(full_name)';

export async function listTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select(SELECT)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TimeEntry[];
}

export async function clock(
  organizationId: string,
  profileId: string,
  kind: TimeEntryKind,
  note?: string,
): Promise<TimeEntry> {
  // occurred_at NÃO é enviado: o banco usa now() (carimbo do servidor).
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      organization_id: organizationId,
      profile_id: profileId,
      kind,
      note: note?.trim() ? note.trim() : null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  if (error) throw error;
}
