import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, LabeledInput, LabeledSelect, LabeledTextarea, Modal } from '@/components/ui';
import { useUpsertDogTitle } from './hooks';
import { titleCatalog, titleGroups } from './titleCatalog';
import {
  eligibilityLabels,
  homologationLabels,
  rankingLabels,
  type DogTitle,
  type TitleEligibility,
  type TitleHomologation,
  type TitleRanking,
} from './titles';
import type { DogTitleFormValues } from './titlesApi';

function toDefaults(title: DogTitle | null): DogTitleFormValues {
  return {
    title_catalog_id: title?.title_catalog_id ?? titleCatalog[0].id,
    eligibility: title?.eligibility ?? 'NOT_STARTED',
    homologation: title?.homologation ?? 'NOT_REQUESTED',
    ranking: title?.ranking ?? 'PROJECTED',
    entity: title?.entity ?? 'CBKC',
    ranking_year: title?.ranking_year ?? new Date().getFullYear(),
    declared_completed_on: title?.declared_completed_on ?? '',
    accepted_completed_on: title?.accepted_completed_on ?? '',
    requested_on: title?.requested_on ?? '',
    homologated_on: title?.homologated_on ?? '',
    protocol: title?.protocol ?? '',
    notes: title?.notes ?? '',
  };
}

export function TitleFormDialog({
  open,
  onClose,
  title,
  dogId,
  dogName,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  title: DogTitle | null;
  dogId: string;
  dogName: string;
  organizationId: string;
}) {
  const upsert = useUpsertDogTitle();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DogTitleFormValues>({ defaultValues: toDefaults(title) });

  useEffect(() => {
    if (open) reset(toDefaults(title));
  }, [open, title, reset]);

  async function onSubmit(values: DogTitleFormValues) {
    await upsert.mutateAsync({
      organizationId,
      dogId,
      values: { ...values, ranking_year: values.ranking_year ? Number(values.ranking_year) : null },
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ? `Editar título — ${dogName}` : `Novo título — ${dogName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <LabeledSelect label="Título" disabled={!!title} {...register('title_catalog_id')}>
          {titleGroups.map((group) => (
            <optgroup key={group} label={group}>
              {titleCatalog
                .filter((t) => t.grupo === group)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} — {t.pontos} pts
                  </option>
                ))}
            </optgroup>
          ))}
        </LabeledSelect>

        <div className="rounded-lg border border-black/5 bg-paper-alt p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Eixo 1 — Requisitos em pista
          </p>
          <LabeledSelect label="Elegibilidade (estado dos requisitos)" {...register('eligibility')}>
            {(Object.keys(eligibilityLabels) as TitleEligibility[]).map((k) => (
              <option key={k} value={k}>
                {eligibilityLabels[k]}
              </option>
            ))}
          </LabeledSelect>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput
              label="Fechamento informado"
              type="date"
              {...register('declared_completed_on')}
            />
            <LabeledInput
              label="Fechamento aceito"
              type="date"
              {...register('accepted_completed_on')}
            />
          </div>
        </div>

        <div className="rounded-lg border border-black/5 bg-paper-alt p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Eixo 2 — Homologação
          </p>
          <LabeledSelect label="Situação da homologação" {...register('homologation')}>
            {(Object.keys(homologationLabels) as TitleHomologation[]).map((k) => (
              <option key={k} value={k}>
                {homologationLabels[k]}
              </option>
            ))}
          </LabeledSelect>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput label="Entidade" placeholder="CBKC, FCI…" {...register('entity')} />
            <LabeledInput label="Protocolo" {...register('protocol')} />
            <LabeledInput label="Solicitada em" type="date" {...register('requested_on')} />
            <LabeledInput label="Homologada em" type="date" {...register('homologated_on')} />
          </div>
        </div>

        <div className="rounded-lg border border-black/5 bg-paper-alt p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Eixo 3 — Ranking anual
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledSelect label="Situação no ranking" {...register('ranking')}>
              {(Object.keys(rankingLabels) as TitleRanking[]).map((k) => (
                <option key={k} value={k}>
                  {rankingLabels[k]}
                </option>
              ))}
            </LabeledSelect>
            <LabeledInput
              label="Ano do crédito"
              type="number"
              {...register('ranking_year')}
            />
          </div>
        </div>

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
