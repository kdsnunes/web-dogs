import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createShow,
  deletePlan,
  deleteShow,
  listShowPlans,
  listShows,
  updateShow,
  upsertPlan,
  type ShowFormValues,
} from './api';
import type { ShowPlanStatus } from './types';

export function useShows(year: number) {
  return useQuery({ queryKey: ['shows', year], queryFn: () => listShows(year) });
}

export function useShowPlans() {
  return useQuery({ queryKey: ['show-plans'], queryFn: listShowPlans });
}

export function useCreateShow(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ShowFormValues) => createShow(organizationId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useUpdateShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ShowFormValues }) => updateShow(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useDeleteShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shows'] });
      qc.invalidateQueries({ queryKey: ['show-plans'] });
    },
  });
}

export function useUpsertPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: {
      organizationId: string;
      showId: string;
      dogId: string;
      status: ShowPlanStatus;
    }) => upsertPlan(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['show-plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ showId, dogId }: { showId: string; dogId: string }) => deletePlan(showId, dogId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['show-plans'] }),
  });
}
