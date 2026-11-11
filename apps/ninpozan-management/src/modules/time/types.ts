export type TimeEntryKind = 'entrada' | 'saida';

export interface TimeEntry {
  id: string;
  organization_id: string;
  profile_id: string;
  kind: TimeEntryKind;
  occurred_at: string;
  note: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export const timeKindLabels: Record<TimeEntryKind, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
};
