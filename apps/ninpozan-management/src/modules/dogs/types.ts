export type DogSex = 'macho' | 'femea';
export type DogStatus = 'ativo' | 'aposentado' | 'vendido' | 'falecido';

export interface Dog {
  id: string;
  organization_id: string;
  name: string;
  registered_name: string | null;
  breed: string;
  sex: DogSex;
  birth_date: string | null;
  color: string | null;
  microchip: string | null;
  registration_number: string | null;
  status: DogStatus;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const sexLabels: Record<DogSex, string> = {
  macho: 'Macho',
  femea: 'Fêmea',
};

export const statusLabels: Record<DogStatus, string> = {
  ativo: 'Ativo',
  aposentado: 'Aposentado',
  vendido: 'Vendido',
  falecido: 'Falecido',
};
