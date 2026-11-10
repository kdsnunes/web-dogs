import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createItem,
  createMovement,
  deleteItem,
  deleteMovement,
  listItems,
  listMovements,
  updateItem,
} from './api';
import type { ItemFormValues, MovementFormValues } from './schema';

const ITEMS_KEY = ['inventory-items'] as const;
const MOVEMENTS_KEY = ['inventory-movements'] as const;

export function useItems() {
  return useQuery({ queryKey: ITEMS_KEY, queryFn: listItems });
}

export function useMovements() {
  return useQuery({ queryKey: MOVEMENTS_KEY, queryFn: listMovements });
}

export function useCreateItem(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ItemFormValues) => createItem(organizationId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ItemFormValues }) => updateItem(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY });
    },
  });
}

export function useCreateMovement(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, values }: { itemId: string; values: MovementFormValues }) =>
      createMovement(organizationId, itemId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: MOVEMENTS_KEY }),
  });
}

export function useDeleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMovement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MOVEMENTS_KEY }),
  });
}
