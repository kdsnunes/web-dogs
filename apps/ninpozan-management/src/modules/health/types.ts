export type HealthEventType =
  | 'vacina'
  | 'vermifugo'
  | 'medicamento'
  | 'consulta'
  | 'cio'
  | 'peso'
  | 'outro';

export interface HealthEvent {
  id: string;
  organization_id: string;
  dog_id: string;
  event_type: HealthEventType;
  event_date: string;
  description: string | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
  dogs?: { name: string } | null;
}

export const healthTypeLabels: Record<HealthEventType, string> = {
  vacina: 'Vacina',
  vermifugo: 'Vermífugo',
  medicamento: 'Medicamento',
  consulta: 'Consulta',
  cio: 'Cio',
  peso: 'Peso',
  outro: 'Outro',
};
