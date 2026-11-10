import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { healthEventFormSchema, type HealthEventFormValues } from './schema';
import { useCreateHealthEvent, useUpdateHealthEvent } from './hooks';
import { healthTypeLabels, type HealthEvent } from './types';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import { todayISO } from '@/lib/date';
import type { Dog } from '@/modules/dogs/types';

function toDefaults(event: HealthEvent | null, preferredDogId?: string): HealthEventFormValues {
  return {
    dog_id: event?.dog_id ?? preferredDogId ?? '',
    event_type: event?.event_type ?? 'vacina',
    event_date: event?.event_date ?? todayISO(),
    description: event?.description ?? '',
    next_due_date: event?.next_due_date ?? '',
  };
}

export function HealthEventFormDialog({
  open,
  onClose,
  event,
  dogs,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  event: HealthEvent | null;
  dogs: Dog[];
  organizationId: string;
}) {
  const createEvent = useCreateHealthEvent(organizationId);
  const updateEvent = useUpdateHealthEvent();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HealthEventFormValues>({
    resolver: zodResolver(healthEventFormSchema),
    defaultValues: toDefaults(event, dogs[0]?.id),
  });

  useEffect(() => {
    if (open) reset(toDefaults(event, dogs[0]?.id));
  }, [open, event, dogs, reset]);

  async function onSubmit(values: HealthEventFormValues) {
    if (event) {
      await updateEvent.mutateAsync({ id: event.id, values });
    } else {
      await createEvent.mutateAsync(values);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Editar registro' : 'Novo registro de saúde'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <LabeledSelect label="Cão" error={errors.dog_id?.message} {...register('dog_id')}>
          <option value="">Selecione…</option>
          {dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name}
            </option>
          ))}
        </LabeledSelect>

        <LabeledSelect label="Tipo" error={errors.event_type?.message} {...register('event_type')}>
          {Object.entries(healthTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </LabeledSelect>

        <div className="grid grid-cols-2 gap-4">
          <LabeledInput
            label="Data"
            type="date"
            error={errors.event_date?.message}
            {...register('event_date')}
          />
          <LabeledInput
            label="Próximo vencimento"
            type="date"
            error={errors.next_due_date?.message}
            {...register('next_due_date')}
          />
        </div>

        <LabeledTextarea
          label="Descrição"
          rows={3}
          placeholder="Ex.: V10, 2ª dose / Vermífugo Drontal / Consulta de rotina…"
          error={errors.description?.message}
          {...register('description')}
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
