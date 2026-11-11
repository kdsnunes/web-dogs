import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemFormSchema, type ItemFormValues } from './schema';
import { useCreateItem, useUpdateItem } from './hooks';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import { itemUnits, type InventoryItem } from './types';
import { stockCategories, subcategoriesFor } from '@/modules/taxonomy';

function toDefaults(item: InventoryItem | null): ItemFormValues {
  return {
    category: item?.category ?? '',
    subcategory: item?.subcategory ?? '',
    name: item?.name ?? '',
    unit: item?.unit ?? 'un',
    min_quantity: item?.min_quantity ?? 0,
    protocol_amount: item?.protocol_amount ?? undefined,
    protocol_unit: item?.protocol_unit ?? 'months',
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: toDefaults(item),
  });

  useEffect(() => {
    if (open) reset(toDefaults(item));
  }, [open, item, reset]);

  const category = watch('category');
  const subcategories = category ? subcategoriesFor(category) : [];

  function handleCategoryChange() {
    setValue('subcategory', '');
  }

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
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Categoria"
            error={errors.category?.message}
            {...register('category', { onChange: handleCategoryChange })}
          >
            <option value="">Selecione…</option>
            {stockCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Subcategoria"
            error={errors.subcategory?.message}
            disabled={!category}
            {...register('subcategory')}
          >
            <option value="">Selecione…</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </LabeledSelect>
        </div>

        <LabeledInput label="Nome do item" error={errors.name?.message} {...register('name')} />

        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect label="Unidade" error={errors.unit?.message} {...register('unit')}>
            {itemUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label="Estoque mínimo (alerta)"
            type="number"
            step="any"
            min="0"
            error={errors.min_quantity?.message}
            {...register('min_quantity')}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink-soft">
            Protocolo / validade (opcional)
          </span>
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label=""
              type="number"
              step="1"
              min="1"
              placeholder="ex.: 3"
              error={errors.protocol_amount?.message}
              {...register('protocol_amount')}
            />
            <LabeledSelect label="" {...register('protocol_unit')}>
              <option value="months">meses</option>
              <option value="days">dias</option>
            </LabeledSelect>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Usado para calcular o próximo vencimento quando o item for aplicado (ex.: Bravecto = 3
            meses). Deixe em branco se não se aplica.
          </p>
        </div>

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
