import { describe, it, expect } from 'vitest';
import { computeNextDue, formatDateBR } from './date';

describe('computeNextDue', () => {
  it('soma meses (ex.: Bravecto 3 meses)', () => {
    expect(computeNextDue('2026-01-10', 3, 'months')).toBe('2026-04-10');
  });

  it('soma dias (ex.: NexGard 30 dias)', () => {
    expect(computeNextDue('2026-01-10', 30, 'days')).toBe('2026-02-09');
  });

  it('retorna vazio sem protocolo', () => {
    expect(computeNextDue('2026-01-10', null, null)).toBe('');
  });
});

describe('formatDateBR', () => {
  it('converte yyyy-mm-dd em dd/mm/yyyy', () => {
    expect(formatDateBR('2026-04-10')).toBe('10/04/2026');
  });

  it('lida com nulo', () => {
    expect(formatDateBR(null)).toBe('—');
  });
});
