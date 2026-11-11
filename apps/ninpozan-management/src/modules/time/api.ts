import { supabase } from '@/lib/supabase';
import type { DayEntry, DayStatus, MonthLock, MonthLockState, OrgMember, RestPref } from './types';

// ---------------------------------------------------------------------------
// day_entries
// ---------------------------------------------------------------------------
export async function listDayEntries(
  profileId: string,
  monthStartISO: string,
  nextMonthStartISO: string,
): Promise<DayEntry[]> {
  const { data, error } = await supabase
    .from('day_entries')
    .select('*')
    .eq('profile_id', profileId)
    .gte('entry_date', monthStartISO)
    .lt('entry_date', nextMonthStartISO)
    .order('entry_date');
  if (error) throw error;
  return (data ?? []) as DayEntry[];
}

export async function setDayStatus(params: {
  organizationId: string;
  profileId: string;
  entryDate: string;
  status: DayStatus;
}): Promise<void> {
  const { organizationId, profileId, entryDate, status } = params;
  const { error } = await supabase.from('day_entries').upsert(
    {
      organization_id: organizationId,
      profile_id: profileId,
      entry_date: entryDate,
      status,
      created_by: profileId,
    },
    { onConflict: 'profile_id,entry_date' },
  );
  if (error) throw error;
}

export async function clearDay(profileId: string, entryDate: string): Promise<void> {
  const { error } = await supabase
    .from('day_entries')
    .delete()
    .eq('profile_id', profileId)
    .eq('entry_date', entryDate);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// rest_prefs
// ---------------------------------------------------------------------------
export async function getRestPref(
  profileId: string,
  referenceMonth: string,
): Promise<RestPref | null> {
  const { data, error } = await supabase
    .from('rest_prefs')
    .select('*')
    .eq('profile_id', profileId)
    .eq('reference_month', referenceMonth)
    .maybeSingle();
  if (error) throw error;
  return (data as RestPref) ?? null;
}

export async function setRestPref(params: {
  organizationId: string;
  profileId: string;
  referenceMonth: string;
  weekday: number;
}): Promise<void> {
  const { organizationId, profileId, referenceMonth, weekday } = params;
  const { error } = await supabase.from('rest_prefs').upsert(
    {
      organization_id: organizationId,
      profile_id: profileId,
      reference_month: referenceMonth,
      weekday,
    },
    { onConflict: 'profile_id,reference_month' },
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// month_locks
// ---------------------------------------------------------------------------
export async function getMonthLock(
  organizationId: string,
  referenceMonth: string,
): Promise<MonthLock | null> {
  const { data, error } = await supabase
    .from('month_locks')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('reference_month', referenceMonth)
    .maybeSingle();
  if (error) throw error;
  return (data as MonthLock) ?? null;
}

export async function setMonthLock(params: {
  organizationId: string;
  referenceMonth: string;
  state: MonthLockState | null; // null = volta ao comportamento padrão (remove trava)
}): Promise<void> {
  const { organizationId, referenceMonth, state } = params;
  if (state === null) {
    const { error } = await supabase
      .from('month_locks')
      .delete()
      .eq('organization_id', organizationId)
      .eq('reference_month', referenceMonth);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('month_locks').upsert(
    {
      organization_id: organizationId,
      reference_month: referenceMonth,
      state,
    },
    { onConflict: 'organization_id,reference_month' },
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// membros da organização (para o admin escolher o funcionário)
// ---------------------------------------------------------------------------
export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('role, profile_id, profiles(full_name)')
    .eq('organization_id', organizationId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string | null } | null;
    return {
      profile_id: row.profile_id as string,
      full_name: profile?.full_name?.trim() || 'Sem nome',
      role: row.role as string,
    };
  });
}
