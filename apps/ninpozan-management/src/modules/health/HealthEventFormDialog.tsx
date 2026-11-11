import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { healthEventFormSchema, type HealthEventFormValues } from './schema';
import { useCreateHealthEvent, useUpdateHealthEvent } from './hooks';
import type { HealthEvent } from './types';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import { todayISO, computeNextDue } from '@/lib/date';
import { healthCategories, isStockCategory, subcategoriesFor } from '@/modules/taxonomy';
import type { Dog } from '@/modules/dogs/types';
import type { InventoryItem } from '@/modules/inventory/types';

function toDefaults(event: HealthEvent | null, preferredDogId?: string): HealthEventFormValues {
  return {
    dog_id: event?.dog_id ?? preferredDogId ?? '',
    category: event?.category ?? '',
    subcategory: event?.subcategory ?? '',
    item_id: event?.item_id ?? '',
    quantity: event?.quantity ?? undefined,
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
  items,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  event: HealthEvent | null;
  dogs: Dog[];
  items: InventoryItem[];
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

  const category = watch('category');
  const subcategory = watch('subcategory');
  const itemId = watch('item_id');

  const stock = category ? isStockCategory(category) : false;
  const subcategories = category ? subcategoriesFor(category) : [];
  const filteredItems = items.filter(
    (i) => i.category === category && i.subcategory === subcategory,
  );
  const selectedItem = items.find((i) => i.id === itemId) ?? null;

  function recomputeDue(itemForDue: InventoryItem | null, dateValue: string) {
    if (itemForDue?.protocol_amount && itemForDue.protocol_unit) {
      setValue(
        'next_due_date',
        computeNextDue(dateValue, itemForDue.protocol_amount, itemForDue.protocol_unit),
      );
    }
  }

  function handleCategoryChange() {
    setValue('subcategory', '');
    setValue('item_id', '');
  }

  function handleSubcategoryChange() {
    setValue('item_id', '');
  }

  function handleItemChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = items.find((i) => i.id === e.target.value) ?? null;
    recomputeDue(next, getValues('event_date'));
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    recomputeDue(selectedItem, e.target.value);
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

        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Categoria"
            error={errors.category?.message}
            {...register('category', { onChange: handleCategoryChange })}
          >
            <option value="">Selecione…</option>
            {healthCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Subcategoria"
            disabled={!category}
            error={errors.subcategory?.message}
            {...register('subcategory', { onChange: handleSubcategoryChange })}
          >
            <option value="">Selecione…</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </LabeledSelect>
        </div>

        {stock && subcategory && (
          <>
            {filteredItems.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Nenhum item de <strong>{subcategory}</strong> no estoque. Cadastre em{' '}
                <strong>Estoque</strong> para poder usá-lo aqui.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <LabeledSelect
                  label="Item (estoque)"
                  error={errors.item_id?.message}
                  {...register('item_id', { onChange: handleItemChange })}
                >
                  <option value="">Selecione…</option>
                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledInput
                  label={`Quantidade usada${selectedItem ? ` (${selectedItem.unit})` : ''}`}
                  type="number"
                  step="any"
                  min="0"
                  error={errors.quantity?.message}
                  {...register('quantity')}
                />
              </div>
            )}
            <p className="-mt-1 text-xs text-ink-muted">
              Ao salvar, é gerada automaticamente uma <strong>saída</strong> desse item no estoque.
            </p>
          </>
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

        <LabeledTextarea
          label="Observações"
          rows={3}
          placeholder="Ex.: início do cio / 2ª dose do protocolo filhote / lote…"
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
