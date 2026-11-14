import type { BreedJudgement, DogResult, DogTarget } from './model';
import { normalizeKey } from './text';

/**
 * Casa os resultados coletados com os cães do canil. O número de registro é o critério
 * principal; o nome registrado serve de reserva, porque as fontes às vezes grafam o
 * registro de forma diferente (ou usam o pedigree estrangeiro).
 */
export class TargetMatcher {
  private readonly registrations = new Set<string>();
  private readonly names = new Set<string>();

  constructor(targets: DogTarget[]) {
    for (const t of targets) {
      const reg = t.registrationNumber ? normalizeKey(t.registrationNumber) : '';
      const name = t.registeredName ? normalizeKey(t.registeredName) : '';
      if (reg) this.registrations.add(reg);
      if (name) this.names.add(name);
    }
  }

  get isEmpty(): boolean {
    return this.registrations.size === 0 && this.names.size === 0;
  }

  matches(result: DogResult): boolean {
    if (result.registrationNumber && this.registrations.has(normalizeKey(result.registrationNumber))) {
      return true;
    }
    return this.names.has(normalizeKey(result.dogName));
  }
}

/** Mantém só os cães do canil; julgamentos sem nenhum cão do canil são descartados. */
export function keepTargets(judgements: BreedJudgement[], matcher: TargetMatcher): BreedJudgement[] {
  return judgements
    .map((j) => ({ ...j, results: j.results.filter((r) => matcher.matches(r)) }))
    .filter((j) => j.results.length > 0);
}
