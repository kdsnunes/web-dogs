import { describe, expect, it } from 'vitest';
import { classifyTitle, computeTotals, remainingToGoal, type DogTitle } from './titles';

function make(partial: Partial<DogTitle>): DogTitle {
  return {
    id: 'x',
    organization_id: 'o',
    dog_id: 'd',
    title_catalog_id: 'CBKC_RANK_2026_06', // Campeão Nacional de Beleza = 25
    rule_version: '2027_SIMULACAO_BASE_2026',
    eligibility: 'NOT_STARTED',
    homologation: 'NOT_REQUESTED',
    ranking: 'PROJECTED',
    entity: null,
    ranking_year: null,
    declared_completed_on: null,
    accepted_completed_on: null,
    requested_on: null,
    homologated_on: null,
    protocol: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('classifyTitle', () => {
  it('homologado e elegível no ano = H', () => {
    const t = make({ homologation: 'APPROVED', ranking: 'ELIGIBLE_LOCAL', ranking_year: 2027 });
    expect(classifyTitle(t, 2027)).toBe('H');
  });

  it('homologado mas elegível em outro ano não é H', () => {
    const t = make({ homologation: 'APPROVED', ranking: 'ELIGIBLE_LOCAL', ranking_year: 2026 });
    expect(classifyTitle(t, 2027)).not.toBe('H');
  });

  it('requisitos completos e não homologado = P', () => {
    const t = make({ eligibility: 'ELIGIBLE', homologation: 'NOT_REQUESTED' });
    expect(classifyTitle(t, 2027)).toBe('P');
  });

  it('em evolução = E (sem fração de pontos)', () => {
    const t = make({ eligibility: 'IN_PROGRESS' });
    expect(classifyTitle(t, 2027)).toBe('E');
  });

  it('em revisão = R', () => {
    const t = make({ ranking: 'PENDING_REVIEW', eligibility: 'ELIGIBLE' });
    expect(classifyTitle(t, 2027)).toBe('R');
  });

  it('revogado/rejeitado não contribui', () => {
    expect(classifyTitle(make({ homologation: 'REVOKED' }), 2027)).toBe('NONE');
    expect(classifyTitle(make({ homologation: 'REJECTED' }), 2027)).toBe('NONE');
  });

  it('homologado porém inelegível no ano = histórico sem crédito', () => {
    const t = make({ homologation: 'APPROVED', ranking: 'INELIGIBLE' });
    expect(classifyTitle(t, 2027)).toBe('NONE');
  });
});

describe('computeTotals', () => {
  it('Nacional (25) + Grande Nacional (40) elegíveis = 65 em H', () => {
    const titles = [
      make({
        title_catalog_id: 'CBKC_RANK_2026_06', // 25
        homologation: 'APPROVED',
        ranking: 'ELIGIBLE_LOCAL',
        ranking_year: 2027,
      }),
      make({
        title_catalog_id: 'CBKC_RANK_2026_09', // 40
        homologation: 'APPROVED',
        ranking: 'ELIGIBLE_LOCAL',
        ranking_year: 2027,
      }),
    ];
    const totals = computeTotals(titles, 2027);
    expect(totals.H).toBe(65);
    expect(totals.projection).toBe(65);
  });

  it('pan-americano com requisitos completos entra em P (projeção), não em H', () => {
    const titles = [
      make({
        title_catalog_id: 'CBKC_RANK_2026_16', // Pan de Beleza = 25
        eligibility: 'ELIGIBLE',
        homologation: 'NOT_REQUESTED',
      }),
    ];
    const totals = computeTotals(titles, 2027);
    expect(totals.H).toBe(0);
    expect(totals.P).toBe(25);
    expect(totals.projection).toBe(25);
  });

  it('grande campeão em evolução mostra potencial em E, sem contar no ranking', () => {
    const titles = [
      make({ title_catalog_id: 'CBKC_RANK_2026_09', eligibility: 'IN_PROGRESS' }), // 40
    ];
    const totals = computeTotals(titles, 2027);
    expect(totals.E).toBe(40);
    expect(totals.H).toBe(0);
    expect(totals.P).toBe(0);
    expect(totals.projection).toBe(0);
  });
});

describe('remainingToGoal', () => {
  it('calcula o que falta para a meta a partir de H e da projeção', () => {
    const totals = { H: 25, P: 40, E: 0, R: 0, projection: 65 };
    const r = remainingToGoal(totals, 100);
    expect(r.faltamParaMeta).toBe(75);
    expect(r.faltamAposPendentes).toBe(35);
  });
});
