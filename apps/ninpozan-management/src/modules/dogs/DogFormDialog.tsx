import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dogFormSchema, type DogFormValues } from './schema';
import { useCreateDog, useUpdateDog } from './hooks';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import type { Dog } from './types';

function toDefaults(dog: Dog | null): DogFormValues {
  return {
    name: dog?.name ?? '',
    registered_name: dog?.registered_name ?? '',
    breed: dog?.breed ?? 'Shiba Inu',
    sex: dog?.sex ?? 'femea',
    birth_date: dog?.birth_date ?? '',
    color: dog?.color ?? '',
    microchip: dog?.microchip ?? '',
    registration_number: dog?.registration_number ?? '',
    status: dog?.status ?? 'ativo',
    in_campaign: dog?.in_campaign ?? false,
    notes: dog?.notes ?? '',
  };
}

export function DogFormDialog({
  open,
  onClose,
  dog,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  dog: Dog | null;
  organizationId: string;
}) {
  const createDog = useCreateDog(organizationId);
  const updateDog = useUpdateDog();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DogFormValues>({
    resolver: zodResolver(dogFormSchema),
    defaultValues: toDefaults(dog),
  });

  useEffect(() => {
    if (open) reset(toDefaults(dog));
  }, [open, dog, reset]);

  async function onSubmit(values: DogFormValues) {
    if (dog) {
      await updateDog.mutateAsync({ id: dog.id, values });
    } else {
      await createDog.mutateAsync(values);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={dog ? 'Editar cão' : 'Novo cão'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <LabeledInput label="Nome" error={errors.name?.message} {...register('name')} />
        <LabeledInput
          label="Nome de registro (pedigree)"
          error={errors.registered_name?.message}
          {...register('registered_name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <LabeledInput label="Raça" error={errors.breed?.message} {...register('breed')} />
          <LabeledSelect label="Sexo" error={errors.sex?.message} {...register('sex')}>
            <option value="femea">Fêmea</option>
            <option value="macho">Macho</option>
          </LabeledSelect>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LabeledInput
            label="Nascimento"
            type="date"
            error={errors.birth_date?.message}
            {...register('birth_date')}
          />
          <LabeledSelect label="Situação" error={errors.status?.message} {...register('status')}>
            <option value="ativo">Ativo</option>
            <option value="aposentado">Aposentado</option>
            <option value="vendido">Vendido</option>
            <option value="falecido">Falecido</option>
          </LabeledSelect>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LabeledInput label="Cor" error={errors.color?.message} {...register('color')} />
          <LabeledInput
            label="Microchip"
            error={errors.microchip?.message}
            {...register('microchip')}
          />
        </div>
        <LabeledInput
          label="Nº de registro (CBKC)"
          error={errors.registration_number?.message}
          {...register('registration_number')}
        />
        <label className="flex items-center gap-3 rounded-lg border border-black/10 bg-paper-alt/40 px-3 py-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-black/20 text-brand focus:ring-brand/30"
            {...register('in_campaign')}
          />
          <span className="text-sm">
            <span className="font-medium text-ink">Em campanha</span>
            <span className="block text-xs text-ink-muted">
              Cão participando de exposições — aparece no planejamento de shows e nos resultados.
            </span>
          </span>
        </label>
        <LabeledTextarea
          label="Observações"
          rows={3}
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
