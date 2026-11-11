import { describe, it, expect } from 'vitest';
import { toCSV } from './csv';

describe('toCSV', () => {
  it('junta células com ponto e vírgula', () => {
    expect(toCSV([['a', 'b', 1]])).toBe('a;b;1');
  });

  it('escapa aspas, separador e quebras de linha', () => {
    expect(toCSV([['tem;ponto', 'com "aspas"', 'linha\nquebra']])).toBe(
      '"tem;ponto";"com ""aspas""";"linha\nquebra"',
    );
  });

  it('trata nulos como vazio', () => {
    expect(toCSV([['a', null, undefined]])).toBe('a;;');
  });
});
