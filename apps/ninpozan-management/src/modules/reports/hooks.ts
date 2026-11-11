import { useMemo } from 'react';
import { useHealthEvents } from '@/modules/health/hooks';
import { useItems, useMovements } from '@/modules/inventory/hooks';
import { buildAlerts, type Alerts } from './alerts';

/** Avisos derivados de saúde + estoque. null enquanto carrega. */
export function useAlerts(upcomingDays = 15): Alerts | null {
  const { data: events } = useHealthEvents();
  const { data: items } = useItems();
  const { data: movements } = useMovements();

  return useMemo(() => {
    if (!events || !items || !movements) return null;
    return buildAlerts(events, items, movements, { upcomingDays });
  }, [events, items, movements, upcomingDays]);
}
