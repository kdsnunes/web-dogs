import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemFormSchema, type ItemFormValues } from './schema';
import { useCreateItem, useUpdateItem } from './hooks';
import { Button, LabeledInput, LabeledTextarea, Modal } from '@/components/ui';
import type { InventoryItem } from './types';

function toDefaults(item: InventoryItem | null): ItemFormValues {
  return {
    name: item?.name ?? '',
    category: item?.category ?? '',
    unit: item?.unit ?? 'un',
    min_quantity: item?.min_quantity ?? 0,
    notes: item?.notes ?? '',
  };
}

export function ItemFormDialog({
  open,
  onClose,
  item,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  organizationId: string;
}) {
  const createItem = useCreateItem(organizationId);
  const updateItem = useUpdateItem();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: toDefaults(item),
  });

  useEffect(() => {
    if (open) reset(toDefaults(item));
  }, [open, item, reset]);

  async function onSubmit(values: ItemFormValues) {
    if (item) {
      await updateItem.mutateAsync({ id: item.id, values });
    } else {
      await createItem.mutateAsync(values);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Editar item' : 'Novo item'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <LabeledInput label="Nome" error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-4">
          <LabeledInput
            label="Categoria"
            placeholder="Ração, higiene, saúde…"
            error={errors.category?.message}
            {...register('category')}
          />
          <LabeledInput
            label="Unidade"
            placeholder="un, kg, L, ml, comprimido…"
            error={errors.unit?.message}
            {...register('unit')}
          />
        </div>
        <LabeledInput
          label="Estoque mínimo (para alerta)"
          type="number"
          step="any"
          min="0"
          error={errors.min_quantity?.message}
          {...register('min_quantity')}
        />
        <LabeledTextarea
          label="Observações"
          rows={2}
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
