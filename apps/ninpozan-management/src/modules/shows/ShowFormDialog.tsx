import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, LabeledInput, LabeledTextarea, Modal } from '@/components/ui';
import { useCreateShow, useUpdateShow } from './hooks';
import type { ShowFormValues } from './api';
import type { Show } from './types';

function toDefaults(show: Show | null): ShowFormValues {
  return {
    event_date: show?.event_date ?? '',
    club: show?.club ?? '',
    city: show?.city ?? '',
    source_code: show?.source_code ?? '',
    notes: show?.notes ?? '',
  };
}

export function ShowFormDialog({
  open,
  onClose,
  show,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  show: Show | null;
  organizationId: string;
}) {
  const createShow = useCreateShow(organizationId);
  const updateShow = useUpdateShow();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShowFormValues>({ defaultValues: toDefaults(show) });

  useEffect(() => {
    if (open) reset(toDefaults(show));
  }, [open, show, reset]);

  async function onSubmit(values: ShowFormValues) {
    if (show) {
      await updateShow.mutateAsync({ id: show.id, values });
    } else {
      await createShow.mutateAsync(values);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={show ? 'Editar show' : 'Novo show'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <LabeledInput
          label="Data"
          type="date"
          error={errors.event_date?.message}
          {...register('event_date', { required: 'Informe a data' })}
        />
        <LabeledInput
          label="Clube / evento"
          error={errors.club?.message}
          {...register('club', { required: 'Informe o clube/evento' })}
        />
        <LabeledInput label="Cidade" {...register('city')} />
        <LabeledInput label="Código DogShow (opcional)" {...register('source_code')} />
        <LabeledTextarea label="Observações" rows={2} {...register('notes')} />

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
