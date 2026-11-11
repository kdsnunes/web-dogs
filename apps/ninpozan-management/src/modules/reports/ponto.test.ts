import { describe, it, expect } from 'vitest';
import { aggregateByEmployee } from './ponto';
import type { DayEntry } from '@/modules/time/types';

function de(profileId: string, name: string, status: DayEntry['status']): DayEntry {
  return {
    id: `${profileId}-${status}-${Math.random()}`,
    organization_id: 'o',
    profile_id: profileId,
    entry_date: '2026-06-01',
    status,
    note: null,
    created_at: '',
    updated_at: '',
    profiles: { full_name: name },
  };
}

describe('aggregateByEmployee', () => {
  it('conta status por funcionário e ordena por nome', () => {
    const rows = aggregateByEmployee([
      de('b', 'Bruno', 'trabalhado'),
      de('b', 'Bruno', 'trabalhado'),
      de('b', 'Bruno', 'folga_vendida'),
      de('a', 'Ana', 'folga'),
    ]);
    expect(rows.map((r) => r.name)).toEqual(['Ana', 'Bruno']);
    expect(rows[1]).toMatchObject({ trabalhado: 2, folga: 0, folga_vendida: 1 });
  });
});
