import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDog, deleteDog, listDogs, updateDog } from './api';
import type { DogFormValues } from './schema';

const DOGS_KEY = ['dogs'] as const;

export function useDogs() {
  return useQuery({ queryKey: DOGS_KEY, queryFn: listDogs });
}

export function useCreateDog(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DogFormValues) => createDog(organizationId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOGS_KEY }),
  });
}

export function useUpdateDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DogFormValues }) => updateDog(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOGS_KEY }),
  });
}

export function useDeleteDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOGS_KEY }),
  });
}
