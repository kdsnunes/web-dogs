import { describe, it, expect } from 'vitest';
import { computeMonthWindow, nextStatusOnClick, summarize, buildMonthGrid } from './calendar';

describe('computeMonthWindow', () => {
  const base = { currentMonthKey: '2026-06', isAdmin: false, lockState: null as null };

  it('mês corrente libera trabalho e folga', () => {
    const w = computeMonthWindow({ ...base, monthKey: '2026-06' });
    expect(w).toMatchObject({ canWork: true, canRest: true, editable: true });
  });

  it('mês futuro libera só folga', () => {
    const w = computeMonthWindow({ ...base, monthKey: '2026-08' });
    expect(w.canWork).toBe(false);
    expect(w.canRest).toBe(true);
  });

  it('mês passado trava por padrão', () => {
    const w = computeMonthWindow({ ...base, monthKey: '2026-04' });
    expect(w.editable).toBe(false);
  });

  it('mês passado reaberto libera tudo', () => {
    const w = computeMonthWindow({ ...base, monthKey: '2026-04', lockState: 'reaberto' });
    expect(w).toMatchObject({ canWork: true, canRest: true });
  });

  it('mês fechado trava inclusive admin', () => {
    const w = computeMonthWindow({
      currentMonthKey: '2026-06',
      monthKey: '2026-06',
      isAdmin: true,
      lockState: 'fechado',
    });
    expect(w.editable).toBe(false);
  });

  it('admin edita qualquer mês não fechado', () => {
    const w = computeMonthWindow({
      currentMonthKey: '2026-06',
      monthKey: '2026-02',
      isAdmin: true,
      lockState: null,
    });
    expect(w).toMatchObject({ canWork: true, canRest: true });
  });
});

describe('nextStatusOnClick', () => {
  const open = { canWork: true, canRest: true, editable: true, reason: null };

  it('dia comum alterna trabalhado', () => {
    expect(nextStatusOnClick(null, false, open)).toBe('trabalhado');
    expect(nextStatusOnClick('trabalhado', false, open)).toBe(null);
  });

  it('dia de descanso cicla folga → vendida → vazio', () => {
    expect(nextStatusOnClick(null, true, open)).toBe('folga');
    expect(nextStatusOnClick('folga', true, open)).toBe('folga_vendida');
    expect(nextStatusOnClick('folga_vendida', true, open)).toBe(null);
  });

  it('bloqueia quando sem permissão', () => {
    const noWork = { canWork: false, canRest: true, editable: true, reason: null };
    expect(nextStatusOnClick(null, false, noWork)).toBe('blocked');
  });
});

describe('summarize', () => {
  it('conta por status', () => {
    const s = summarize([
      { status: 'trabalhado' },
      { status: 'trabalhado' },
      { status: 'folga' },
      { status: 'folga_vendida' },
    ]);
    expect(s).toEqual({ trabalhado: 2, folga: 1, folga_vendida: 1 });
  });
});

describe('buildMonthGrid', () => {
  it('gera semanas completas de 7 dias', () => {
    const weeks = buildMonthGrid(new Date('2026-06-15'));
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.length).toBeGreaterThanOrEqual(5);
  });
});
