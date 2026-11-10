import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHealthEvent,
  deleteHealthEvent,
  listHealthEvents,
  updateHealthEvent,
} from './api';
import type { HealthEventFormValues } from './schema';

const HEALTH_KEY = ['health-events'] as const;

export function useHealthEvents() {
  return useQuery({ queryKey: HEALTH_KEY, queryFn: listHealthEvents });
}

export function useCreateHealthEvent(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: HealthEventFormValues) => createHealthEvent(organizationId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: HEALTH_KEY }),
  });
}

export function useUpdateHealthEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: HealthEventFormValues }) =>
      updateHealthEvent(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: HEALTH_KEY }),
  });
}

export function useDeleteHealthEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHealthEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: HEALTH_KEY }),
  });
}
