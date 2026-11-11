import type { DayEntry } from '@/modules/time/types';

export interface EmployeePontoRow {
  profileId: string;
  name: string;
  trabalhado: number;
  folga: number;
  folga_vendida: number;
}

/** Agrupa os lançamentos de dias por funcionário e conta cada status. */
export function aggregateByEmployee(entries: DayEntry[]): EmployeePontoRow[] {
  const map = new Map<string, EmployeePontoRow>();
  for (const entry of entries) {
    let row = map.get(entry.profile_id);
    if (!row) {
      row = {
        profileId: entry.profile_id,
        name: entry.profiles?.full_name?.trim() || 'Sem nome',
        trabalhado: 0,
        folga: 0,
        folga_vendida: 0,
      };
      map.set(entry.profile_id, row);
    }
    row[entry.status] += 1;
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
