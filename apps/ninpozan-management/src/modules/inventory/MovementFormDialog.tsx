import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { movementFormSchema, type MovementFormValues } from './schema';
import { useCreateMovement } from './hooks';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import { todayISO } from '@/lib/date';
import type { InventoryItem } from './types';

export function MovementFormDialog({
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
  const createMovement = useCreateMovement(organizationId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: { kind: 'entrada', quantity: 1, movement_date: todayISO(), note: '' },
  });

  useEffect(() => {
    if (open) reset({ kind: 'entrada', quantity: 1, movement_date: todayISO(), note: '' });
  }, [open, reset]);

  async function onSubmit(values: MovementFormValues) {
    if (!item) return;
    await createMovement.mutateAsync({ itemId: item.id, values });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Movimentar — ${item.name}` : 'Movimentar'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect label="Tipo" error={errors.kind?.message} {...register('kind')}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </LabeledSelect>
          <LabeledInput
            label={`Quantidade${item ? ` (${item.unit})` : ''}`}
            type="number"
            step="any"
            min="0"
            error={errors.quantity?.message}
            {...register('quantity')}
          />
        </div>
        <LabeledInput
          label="Data"
          type="date"
          error={errors.movement_date?.message}
          {...register('movement_date')}
        />
        <LabeledTextarea
          label="Observação"
          rows={2}
          placeholder="Ex.: compra no fornecedor / uso no cão X…"
          error={errors.note?.message}
          {...register('note')}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
