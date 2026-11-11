export type DayStatus = 'trabalhado' | 'folga' | 'folga_vendida';
export type MonthLockState = 'reaberto' | 'fechado';

export interface DayEntry {
  id: string;
  organization_id: string;
  profile_id: string;
  entry_date: string; // yyyy-mm-dd
  status: DayStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
}

export interface MonthLock {
  id: string;
  organization_id: string;
  reference_month: string; // yyyy-mm-dd (dia 1)
  state: MonthLockState;
}

export interface RestPref {
  id: string;
  organization_id: string;
  profile_id: string;
  reference_month: string;
  weekday: number; // 0=domingo ... 6=sábado
}

export interface OrgMember {
  profile_id: string;
  full_name: string;
  role: string;
}

export const dayStatusLabels: Record<DayStatus, string> = {
  trabalhado: 'Trabalhado',
  folga: 'Folga',
  folga_vendida: 'Folga vendida',
};

/** Rótulos curtos dos dias da semana (0=domingo). */
export const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const weekdayFullLabels = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;
