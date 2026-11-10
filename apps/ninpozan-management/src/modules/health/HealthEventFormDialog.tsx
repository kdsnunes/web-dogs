import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { healthEventFormSchema, type HealthEventFormValues } from './schema';
import { useCreateHealthEvent, useUpdateHealthEvent } from './hooks';
import { healthTypeLabels, type HealthEvent } from './types';
import { computeNextDue, findProduct, getProducts } from './catalog';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import { todayISO } from '@/lib/date';
import type { Dog } from '@/modules/dogs/types';

function toDefaults(event: HealthEvent | null, preferredDogId?: string): HealthEventFormValues {
  return {
    dog_id: event?.dog_id ?? preferredDogId ?? '',
    event_type: event?.event_type ?? 'vacina',
    product: event?.product ?? '',
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
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<HealthEventFormValues>({
    resolver: zodResolver(healthEventFormSchema),
    defaultValues: toDefaults(event, dogs[0]?.id),
  });

  useEffect(() => {
    if (open) reset(toDefaults(event, dogs[0]?.id));
  }, [open, event, dogs, reset]);

  const eventType = watch('event_type');
  const products = getProducts(eventType);

  // Ao trocar o tipo, limpa o produto e o vencimento (serão recalculados).
  function handleTypeChange() {
    setValue('product', '');
    setValue('next_due_date', '');
  }

  // Ao escolher o produto, preenche o próximo vencimento pelo protocolo.
  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const product = findProduct(getValues('event_type'), e.target.value);
    if (product?.interval) {
      setValue('next_due_date', computeNextDue(getValues('event_date'), product.interval));
    }
  }

  // Ao mudar a data do evento, recalcula o vencimento se houver protocolo.
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const product = findProduct(getValues('event_type'), getValues('product') ?? '');
    if (product?.interval) {
      setValue('next_due_date', computeNextDue(e.target.value, product.interval));
    }
  }

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

        <LabeledSelect
          label="Tipo"
          error={errors.event_type?.message}
          {...register('event_type', { onChange: handleTypeChange })}
        >
          {Object.entries(healthTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </LabeledSelect>

        {products && (
          <LabeledSelect
            label="Produto"
            error={errors.product?.message}
            {...register('product', { onChange: handleProductChange })}
          >
            <option value="">Selecione…</option>
            {products.map((product) => (
              <option key={product.value} value={product.value}>
                {product.label}
              </option>
            ))}
          </LabeledSelect>
        )}

        <div className="grid grid-cols-2 gap-4">
          <LabeledInput
            label="Data"
            type="date"
            error={errors.event_date?.message}
            {...register('event_date', { onChange: handleDateChange })}
          />
          <LabeledInput
            label="Próximo vencimento"
            type="date"
            error={errors.next_due_date?.message}
            {...register('next_due_date')}
          />
        </div>

        {products && (
          <p className="-mt-1 text-xs text-ink-muted">
            O próximo vencimento é preenchido automaticamente pelo protocolo do produto. Ajuste se
            precisar.
          </p>
        )}

        <LabeledTextarea
          label="Observações"
          rows={3}
          placeholder="Ex.: 2ª dose do protocolo filhote / lote da vacina / reação…"
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
