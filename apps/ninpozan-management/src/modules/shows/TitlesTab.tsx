import { useMemo, useState } from 'react';
import { Award, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui';
import { useDogs } from '@/modules/dogs/hooks';
import { useDeleteDogTitle, useDogTitles } from './hooks';
import { TitleFormDialog } from './TitleFormDialog';
import { titleById } from './titleCatalog';
import {
  classifyTitle,
  computeTotals,
  eligibilityLabels,
  homologationLabels,
  rankingLabels,
  remainingToGoal,
  type DogTitle,
  type TitleBucket,
} from './titles';

const META_KEY = 'ninpozan.rankingGoal';
const currentYear = new Date().getFullYear();
const yearOptions = [currentYear, currentYear + 1];
const defaultTargetYear = currentYear + 1; // cenário 2027 (simulação)

const bucketStyle: Record<Exclude<TitleBucket, 'NONE'>, { label: string; className: string }> = {
  H: { label: 'Homologado (conta no ano)', className: 'bg-emerald-100 text-emerald-800' },
  P: { label: 'Pronto (aguarda homologação)', className: 'bg-amber-100 text-amber-800' },
  R: { label: 'Em revisão', className: 'bg-violet-100 text-violet-800' },
  E: { label: 'Em evolução (potencial)', className: 'bg-sky-100 text-sky-800' },
};

export function TitlesTab({ orgId }: { orgId: string | undefined }) {
  const { data: dogs } = useDogs();
  const { data: titles } = useDogTitles();
  const deleteTitle = useDeleteDogTitle();

  const [targetYear, setTargetYear] = useState(defaultTargetYear);
  const [goal, setGoal] = useState<string>(() => localStorage.getItem(META_KEY) ?? '');
  const [dialog, setDialog] = useState<{ dogId: string; dogName: string; title: DogTitle | null } | null>(
    null,
  );

  const campaignDogs = (dogs ?? []).filter((d) => d.in_campaign);

  const titlesByDog = useMemo(() => {
    const map = new Map<string, DogTitle[]>();
    for (const t of titles ?? []) {
      const arr = map.get(t.dog_id) ?? [];
      arr.push(t);
      map.set(t.dog_id, arr);
    }
    return map;
  }, [titles]);

  const campaignTitles = useMemo(
    () => (titles ?? []).filter((t) => campaignDogs.some((d) => d.id === t.dog_id)),
    [titles, campaignDogs],
  );

  const orgTotals = computeTotals(campaignTitles, targetYear);
  const goalNum = Number(goal) || 0;
  const remaining = remainingToGoal(orgTotals, goalNum);

  function saveGoal(v: string) {
    setGoal(v);
    if (v) localStorage.setItem(META_KEY, v);
    else localStorage.removeItem(META_KEY);
  }

  async function handleDelete(t: DogTitle) {
    const name = titleById(t.title_catalog_id)?.titulo ?? 'título';
    if (window.confirm(`Remover "${name}" deste cão?`)) {
      await deleteTitle.mutateAsync(t.id);
    }
  }

  if (campaignDogs.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
            <Trophy size={22} />
          </div>
          <p className="text-sm text-ink-soft">Nenhum cão em campanha.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Marque um cão como <strong>em campanha</strong> no cadastro de Cães para gerenciar títulos
            aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner de simulação */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Award size={18} className="mt-0.5 shrink-0" />
        <div>
          <strong>Simulação com regras de 2026 — aguardando o regulamento 2027.</strong> Os pontos
          são da tabela do art. 2 (edição 2026) e valem como projeção. Pontos só contam quando o
          título está <em>homologado</em> e <em>elegível no ano</em>; títulos incompletos aparecem
          como potencial e não somam ao ranking.
        </div>
      </div>

      {/* Controles + resumo */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Ano do ranking</span>
            <div className="flex gap-1 rounded-lg border border-black/10 bg-paper-card p-1">
              {yearOptions.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setTargetYear(y)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    y === targetYear ? 'bg-brand text-white' : 'text-ink-soft hover:bg-paper-alt'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Meta de pontos</span>
            <input
              type="number"
              value={goal}
              onChange={(e) => saveGoal(e.target.value)}
              placeholder="opcional"
              className="w-28 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Homologados (contam)" value={orgTotals.H} tone="emerald" />
        <StatCard label="Prontos (pendentes)" value={orgTotals.P} tone="amber" />
        <StatCard label={`Projeção ${targetYear} (H+P)`} value={orgTotals.projection} tone="brand" />
        <StatCard label="Potencial em evolução" value={orgTotals.E} tone="sky" />
      </div>

      {goalNum > 0 && (
        <div className="mb-6 rounded-xl border border-black/5 bg-paper-card px-4 py-3 text-sm text-ink-soft">
          Meta de <strong className="text-ink">{goalNum}</strong> pts: faltam{' '}
          <strong className="text-emerald-700">{remaining.faltamParaMeta}</strong> em pontos
          homologados
          {remaining.faltamAposPendentes > 0 ? (
            <>
              {' '}
              (ou <strong className="text-amber-700">{remaining.faltamAposPendentes}</strong>{' '}
              considerando os pendentes)
            </>
          ) : (
            <> — a projeção com pendentes já atinge a meta.</>
          )}
        </div>
      )}

      {/* Cães em campanha */}
      <div className="space-y-4">
        {campaignDogs.map((dog) => {
          const dogTitles = titlesByDog.get(dog.id) ?? [];
          const dogTotals = computeTotals(dogTitles, targetYear);
          return (
            <div key={dog.id} className="rounded-2xl border border-black/5 bg-paper-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-gold" />
                    <span className="font-medium text-ink">{dog.name}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {dogTotals.H} homologados · {dogTotals.P} prontos · {dogTotals.E} potencial
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="border border-black/10"
                  disabled={!orgId}
                  onClick={() => setDialog({ dogId: dog.id, dogName: dog.name, title: null })}
                >
                  <Plus size={16} /> Título
                </Button>
              </div>

              {dogTitles.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-ink-muted">
                        <th className="py-2 pr-3 font-medium">Título</th>
                        <th className="py-2 pr-3 font-medium">Pts</th>
                        <th className="py-2 pr-3 font-medium">Situação</th>
                        <th className="py-2 pr-3 font-medium">Requisitos</th>
                        <th className="py-2 pr-3 font-medium">Homologação</th>
                        <th className="py-2 pr-3 font-medium">Ranking</th>
                        <th className="py-2 pr-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {dogTitles.map((t) => {
                        const cat = titleById(t.title_catalog_id);
                        const bucket = classifyTitle(t, targetYear);
                        const chip = bucket === 'NONE' ? null : bucketStyle[bucket];
                        return (
                          <tr key={t.id} className="border-b border-black/5 last:border-0">
                            <td className="py-2 pr-3 text-ink">{cat?.titulo ?? t.title_catalog_id}</td>
                            <td className="py-2 pr-3 text-ink-soft">{cat?.pontos ?? '—'}</td>
                            <td className="py-2 pr-3">
                              {chip ? (
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${chip.className}`}
                                >
                                  {chip.label}
                                </span>
                              ) : (
                                <span className="text-xs text-ink-muted">Sem crédito</span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-xs text-ink-soft">
                              {eligibilityLabels[t.eligibility]}
                            </td>
                            <td className="py-2 pr-3 text-xs text-ink-soft">
                              {homologationLabels[t.homologation]}
                              {t.entity ? ` · ${t.entity}` : ''}
                            </td>
                            <td className="py-2 pr-3 text-xs text-ink-soft">
                              {rankingLabels[t.ranking]}
                              {t.ranking_year ? ` · ${t.ranking_year}` : ''}
                            </td>
                            <td className="py-2 pr-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDialog({ dogId: dog.id, dogName: dog.name, title: t })
                                  }
                                  className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-alt"
                                  title="Editar"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(t)}
                                  className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                                  title="Remover"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {dogTitles.length === 0 && (
                <p className="mt-3 text-xs text-ink-muted">Nenhum título registrado ainda.</p>
              )}
            </div>
          );
        })}
      </div>

      {orgId && dialog && (
        <TitleFormDialog
          open={!!dialog}
          onClose={() => setDialog(null)}
          title={dialog.title}
          dogId={dialog.dogId}
          dogName={dialog.dogName}
          organizationId={orgId}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'brand' | 'sky';
}) {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    brand: 'text-brand',
    sky: 'text-sky-700',
  };
  return (
    <div className="rounded-2xl border border-black/5 bg-paper-card p-4 shadow-sm">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
