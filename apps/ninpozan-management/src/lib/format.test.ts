import { describe, it, expect } from 'vitest';
import { formatBRL } from './format';

describe('formatBRL', () => {
  it('formata centavos inteiros como BRL', () => {
    const out = formatBRL(123456);
    expect(out).toContain('R$');
    expect(out).toMatch(/1\.234,56/);
  });

  it('formata zero', () => {
    expect(formatBRL(0)).toMatch(/0,00/);
  });
});
