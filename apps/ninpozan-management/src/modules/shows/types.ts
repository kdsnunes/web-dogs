export type ShowPlanStatus = 'pretendido' | 'confirmado';

export interface Show {
  id: string;
  organization_id: string;
  event_date: string; // yyyy-mm-dd
  club: string;
  city: string | null;
  source_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShowPlan {
  id: string;
  organization_id: string;
  show_id: string;
  dog_id: string;
  status: ShowPlanStatus;
  note: string | null;
  dogs?: { name: string } | null;
}

export const showPlanStatusLabels: Record<ShowPlanStatus, string> = {
  pretendido: 'Pretendido',
  confirmado: 'Confirmado',
};
