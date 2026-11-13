import { supabase } from '@/lib/supabase';
import { RULE_VERSION } from './titleCatalog';
import type { DogTitle, TitleEligibility, TitleHomologation, TitleRanking } from './titles';

export interface DogTitleFormValues {
  title_catalog_id: string;
  eligibility: TitleEligibility;
  homologation: TitleHomologation;
  ranking: TitleRanking;
  entity?: string;
  ranking_year?: number | null;
  declared_completed_on?: string;
  accepted_completed_on?: string;
  requested_on?: string;
  homologated_on?: string;
  protocol?: string;
  notes?: string;
}

function nullable(v?: string) {
  const t = v?.trim();
  return t ? t : null;
}

export async function listDogTitles(): Promise<DogTitle[]> {
  const { data, error } = await supabase
    .from('dog_titles')
    .select('*, dogs(name)')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as DogTitle[];
}

export async function upsertDogTitle(params: {
  organizationId: string;
  dogId: string;
  values: DogTitleFormValues;
}): Promise<void> {
  const { values } = params;
  const { error } = await supabase.from('dog_titles').upsert(
    {
      organization_id: params.organizationId,
      dog_id: params.dogId,
      title_catalog_id: values.title_catalog_id,
      rule_version: RULE_VERSION,
      eligibility: values.eligibility,
      homologation: values.homologation,
      ranking: values.ranking,
      entity: nullable(values.entity),
      ranking_year: values.ranking_year ?? null,
      declared_completed_on: nullable(values.declared_completed_on),
      accepted_completed_on: nullable(values.accepted_completed_on),
      requested_on: nullable(values.requested_on),
      homologated_on: nullable(values.homologated_on),
      protocol: nullable(values.protocol),
      notes: nullable(values.notes),
    },
    { onConflict: 'dog_id,title_catalog_id' },
  );
  if (error) throw error;
}

export async function deleteDogTitle(id: string): Promise<void> {
  const { error } = await supabase.from('dog_titles').delete().eq('id', id);
  if (error) throw error;
}
