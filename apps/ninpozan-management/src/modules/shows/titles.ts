import { titleById } from './titleCatalog';

export type TitleEligibility =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ELIGIBLE'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE';
export type TitleHomologation =
  | 'NOT_REQUESTED'
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';
export type TitleRanking =
  | 'PROJECTED'
  | 'ELIGIBLE_LOCAL'
  | 'CONFIRMED_OFFICIAL'
  | 'INELIGIBLE'
  | 'PENDING_REVIEW';

export interface DogTitle {
  id: string;
  organization_id: string;
  dog_id: string;
  title_catalog_id: string;
  rule_version: string;
  eligibility: TitleEligibility;
  homologation: TitleHomologation;
  ranking: TitleRanking;
  entity: string | null;
  ranking_year: number | null;
  declared_completed_on: string | null;
  accepted_completed_on: string | null;
  requested_on: string | null;
  homologated_on: string | null;
  protocol: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  dogs?: { name: string } | null;
}

export const eligibilityLabels: Record<TitleEligibility, string> = {
  NOT_STARTED: 'Não iniciado',
  IN_PROGRESS: 'Em evolução',
  ELIGIBLE: 'Requisitos completos',
  UNKNOWN: 'Indefinido',
  NOT_APPLICABLE: 'Não aplicável',
};

export const homologationLabels: Record<TitleHomologation, string> = {
  NOT_REQUESTED: 'Não solicitada',
  REQUESTED: 'Solicitada',
  UNDER_REVIEW: 'Em exigência',
  APPROVED: 'Homologada',
  REJECTED: 'Rejeitada',
  REVOKED: 'Revogada',
};

export const rankingLabels: Record<TitleRanking, string> = {
  PROJECTED: 'Projetado',
  ELIGIBLE_LOCAL: 'Elegível (local)',
  CONFIRMED_OFFICIAL: 'Confirmado oficial',
  INELIGIBLE: 'Inelegível no ano',
  PENDING_REVIEW: 'Em revisão',
};

/**
 * Classifica a contribuição de um título em um dos baldes:
 *  H  = homologado e elegível no ano-alvo (conta no ranking local)
 *  P  = requisitos completos, ainda não homologado, sem incompatibilidade anual
 *  R  = carteira em revisão (dúvida normativa anual / enquadramento pendente)
 *  E  = em evolução (potencial, não é crédito)
 *  NONE = não contribui (rejeitado/revogado, histórico sem crédito no ano, etc.)
 *
 * Regra da spec: título incompleto contribui ZERO (sem fração de pontos).
 */
export type TitleBucket = 'H' | 'P' | 'R' | 'E' | 'NONE';

export function classifyTitle(t: DogTitle, targetYear: number): TitleBucket {
  if (t.homologation === 'REJECTED' || t.homologation === 'REVOKED') return 'NONE';

  // Dúvida normativa anual fica em revisão, fora de H e P.
  if (t.ranking === 'PENDING_REVIEW') return 'R';

  // Homologado e elegível para o ano-alvo → conta.
  const homologated = t.homologation === 'APPROVED';
  const eligibleThisYear =
    (t.ranking === 'ELIGIBLE_LOCAL' || t.ranking === 'CONFIRMED_OFFICIAL') &&
    t.ranking_year === targetYear;
  if (homologated && eligibleThisYear) return 'H';

  // Homologado mas inelegível no ano (ex.: fechado em ano anterior) → histórico, sem crédito.
  if (homologated && t.ranking === 'INELIGIBLE') return 'NONE';

  // Requisitos completos, ainda não homologado, sem incompatibilidade conhecida → pronto.
  const pendingHomolog =
    t.homologation === 'NOT_REQUESTED' ||
    t.homologation === 'REQUESTED' ||
    t.homologation === 'UNDER_REVIEW';
  if (t.eligibility === 'ELIGIBLE' && pendingHomolog && t.ranking !== 'INELIGIBLE') return 'P';

  // Em evolução → potencial.
  if (t.eligibility === 'IN_PROGRESS' || t.eligibility === 'NOT_STARTED') return 'E';

  return 'NONE';
}

export interface TitleTotals {
  H: number;
  P: number;
  E: number;
  R: number;
  /** projeção com pendentes = H + P */
  projection: number;
}

function points(id: string): number {
  return titleById(id)?.pontos ?? 0;
}

export function computeTotals(titles: DogTitle[], targetYear: number): TitleTotals {
  const totals: TitleTotals = { H: 0, P: 0, E: 0, R: 0, projection: 0 };
  for (const t of titles) {
    const bucket = classifyTitle(t, targetYear);
    if (bucket === 'NONE') continue;
    totals[bucket] += points(t.title_catalog_id);
  }
  totals.projection = totals.H + totals.P;
  return totals;
}

export function remainingToGoal(totals: TitleTotals, goal: number) {
  return {
    faltamParaMeta: Math.max(0, goal - totals.H),
    faltamAposPendentes: Math.max(0, goal - totals.H - totals.P),
  };
}
