import { describe, it, expect } from 'vitest';
import { computeNextDue, findProduct } from './catalog';

describe('computeNextDue', () => {
  it('Bravecto: +3 meses', () => {
    expect(computeNextDue('2026-01-10', { amount: 3, unit: 'months' })).toBe('2026-04-10');
  });

  it('NexGard Spectra: +30 dias', () => {
    expect(computeNextDue('2026-01-10', { amount: 30, unit: 'days' })).toBe('2026-02-09');
  });

  it('retorna vazio sem intervalo', () => {
    expect(computeNextDue('2026-01-10', undefined)).toBe('');
  });
});

describe('findProduct', () => {
  it('encontra Bravecto no tipo antiparasitario com protocolo de 3 meses', () => {
    const product = findProduct('antiparasitario', 'Bravecto');
    expect(product?.interval).toEqual({ amount: 3, unit: 'months' });
  });

  it('retorna undefined para tipo sem catálogo', () => {
    expect(findProduct('consulta', 'qualquer')).toBeUndefined();
  });
});
