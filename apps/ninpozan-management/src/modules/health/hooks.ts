import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createHealthEvent,
  deleteHealthEvent,
  listHealthEvents,
  updateHealthEvent,
} from './api';
import type { HealthEventFormValues } from './schema';

const HEALTH_KEY = ['health-events'] as const;

// Eventos de saúde podem gerar saída de estoque → invalidar também o estoque.
function invalidateHealthAndStock(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: HEALTH_KEY });
  qc.invalidateQueries({ queryKey: ['inventory-movements'] });
  qc.invalidateQueries({ queryKey: ['inventory-items'] });
}

export function useHealthEvents() {
  return useQuery({ queryKey: HEALTH_KEY, queryFn: listHealthEvents });
}

export function useCreateHealthEvent(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: HealthEventFormValues) => createHealthEvent(organizationId, values),
    onSuccess: () => invalidateHealthAndStock(qc),
  });
}

export function useUpdateHealthEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: HealthEventFormValues }) =>
      updateHealthEvent(id, values),
    onSuccess: () => invalidateHealthAndStock(qc),
  });
}

export function useDeleteHealthEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHealthEvent(id),
    onSuccess: () => invalidateHealthAndStock(qc),
  });
}
