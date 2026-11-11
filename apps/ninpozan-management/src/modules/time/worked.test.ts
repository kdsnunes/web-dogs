import { describe, it, expect } from 'vitest';
import { workedMinutes, formatDuration } from './worked';

describe('workedMinutes', () => {
  it('pareia entrada e saída', () => {
    const mins = workedMinutes([
      { kind: 'entrada', occurred_at: '2026-01-01T11:00:00Z' },
      { kind: 'saida', occurred_at: '2026-01-01T15:00:00Z' },
    ]);
    expect(mins).toBe(240);
  });

  it('soma vários pares (manhã + tarde)', () => {
    const mins = workedMinutes([
      { kind: 'entrada', occurred_at: '2026-01-01T11:00:00Z' },
      { kind: 'saida', occurred_at: '2026-01-01T15:00:00Z' },
      { kind: 'entrada', occurred_at: '2026-01-01T16:00:00Z' },
      { kind: 'saida', occurred_at: '2026-01-01T20:00:00Z' },
    ]);
    expect(mins).toBe(480);
  });

  it('entrada em aberto conta até agora', () => {
    const now = new Date('2026-01-01T13:00:00Z');
    const mins = workedMinutes([{ kind: 'entrada', occurred_at: '2026-01-01T11:00:00Z' }], now);
    expect(mins).toBe(120);
  });
});

describe('formatDuration', () => {
  it('formata horas e minutos', () => {
    expect(formatDuration(135)).toBe('2h 15min');
  });
});
