import { Modal } from '@/components/ui';
import { useDogs } from '@/modules/dogs/hooks';
import { useShowPlans, useUpsertPlan, useDeletePlan } from './hooks';
import { showPlanStatusLabels, type Show, type ShowPlanStatus } from './types';
import { formatDateBR } from '@/lib/date';

export function ShowPlansDialog({
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
  const { data: dogs } = useDogs();
  const { data: plans } = useShowPlans();
  const upsert = useUpsertPlan();
  const removePlan = useDeletePlan();

  if (!show) return null;

  const campaignDogs = (dogs ?? []).filter((d) => d.in_campaign);
  const planFor = (dogId: string) =>
    (plans ?? []).find((p) => p.show_id === show.id && p.dog_id === dogId) ?? null;

  function toggle(dogId: string, checked: boolean) {
    if (checked) {
      void upsert.mutateAsync({ organizationId, showId: show!.id, dogId, status: 'pretendido' });
    } else {
      void removePlan.mutateAsync({ showId: show!.id, dogId });
    }
  }

  function setStatus(dogId: string, status: ShowPlanStatus) {
    void upsert.mutateAsync({ organizationId, showId: show!.id, dogId, status });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Cães neste show — ${formatDateBR(show.event_date)}`}>
      <p className="mb-4 text-sm text-ink-muted">
        {show.club}
        {show.city ? ` · ${show.city}` : ''}
      </p>

      {campaignDogs.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nenhum cão marcado como <strong>em campanha</strong>. Marque no cadastro de Cães para
          planejar os shows.
        </p>
      ) : (
        <ul className="space-y-2">
          {campaignDogs.map((dog) => {
            const plan = planFor(dog.id);
            const selected = !!plan;
            return (
              <li
                key={dog.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/5 px-3 py-2.5"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => toggle(dog.id, e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 text-brand focus:ring-brand/30"
                  />
                  <span className="text-sm font-medium text-ink">{dog.name}</span>
                </label>

                {selected && (
                  <div className="flex gap-1">
                    {(['pretendido', 'confirmado'] as ShowPlanStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(dog.id, s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          plan?.status === s
                            ? s === 'confirmado'
                              ? 'bg-brand text-white'
                              : 'bg-amber-500 text-white'
                            : 'bg-paper-alt text-ink-soft hover:bg-paper'
                        }`}
                      >
                        {showPlanStatusLabels[s]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
