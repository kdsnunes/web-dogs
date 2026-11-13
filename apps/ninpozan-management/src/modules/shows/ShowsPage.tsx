import { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  CalendarDays,
  MapPin,
  Trophy,
  Award,
} from 'lucide-react';
import { useOrganization } from '@/modules/organization/useOrganization';
import { useDogs } from '@/modules/dogs/hooks';
import { Button } from '@/components/ui';
import { formatDateBR, todayISO } from '@/lib/date';
import { useShows, useShowPlans, useDeleteShow } from './hooks';
import { ShowFormDialog } from './ShowFormDialog';
import { ShowPlansDialog } from './ShowPlansDialog';
import { TitlesTab } from './TitlesTab';
import { showPlanStatusLabels, type Show, type ShowPlan } from './types';

type Tab = 'calendario' | 'resultados' | 'titulos';

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

export function ShowsPage() {
  const { data: org } = useOrganization();
  const [tab, setTab] = useState<Tab>('calendario');

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Shows</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Calendário de exposições e acompanhamento dos cães em campanha.
        </p>
      </header>

      <div className="mb-6 flex gap-1 rounded-xl bg-paper-alt p-1 text-sm">
        <TabButton active={tab === 'calendario'} onClick={() => setTab('calendario')}>
          <CalendarDays size={16} /> Calendário
        </TabButton>
        <TabButton active={tab === 'titulos'} onClick={() => setTab('titulos')}>
          <Award size={16} /> Títulos
        </TabButton>
        <TabButton active={tab === 'resultados'} onClick={() => setTab('resultados')}>
          <Trophy size={16} /> Resultados
        </TabButton>
      </div>

      {tab === 'calendario' && <CalendarTab orgId={org?.organizationId} />}
      {tab === 'titulos' && <TitlesTab orgId={org?.organizationId} />}
      {tab === 'resultados' && <ResultsTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition ${
        active ? 'bg-paper-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function planChipClass(status: ShowPlan['status']): string {
  return status === 'confirmado' ? 'bg-brand/10 text-brand' : 'bg-amber-100 text-amber-800';
}

function CalendarTab({ orgId }: { orgId: string | undefined }) {
  const [year, setYear] = useState(currentYear);
  const { data: shows, isLoading } = useShows(year);
  const { data: plans } = useShowPlans();
  const deleteShow = useDeleteShow();

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Show | null>(null);
  const [plansFor, setPlansFor] = useState<Show | null>(null);

  const plansByShow = useMemo(() => {
    const map = new Map<string, ShowPlan[]>();
    for (const p of plans ?? []) {
      const arr = map.get(p.show_id) ?? [];
      arr.push(p);
      map.set(p.show_id, arr);
    }
    return map;
  }, [plans]);

  const today = todayISO();

  function openNew() {
    setEditing(null);
    setDialog(true);
  }

  async function handleDelete(show: Show) {
    if (window.confirm(`Remover o show "${show.club}" de ${formatDateBR(show.event_date)}?`)) {
      await deleteShow.mutateAsync(show.id);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-black/10 bg-paper-card p-1">
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                y === year ? 'bg-brand text-white' : 'text-ink-soft hover:bg-paper-alt'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <Button onClick={openNew} disabled={!orgId}>
          <Plus size={18} /> Novo show
        </Button>
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}

      {!isLoading && shows && shows.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
              <CalendarDays size={22} />
            </div>
            <p className="text-sm text-ink-soft">Nenhum show cadastrado em {year}.</p>
            <p className="mt-1 text-xs text-ink-muted">
              Adicione manualmente por enquanto. O importador do DogShow virá depois.
            </p>
          </div>
        </div>
      )}

      {!isLoading && shows && shows.length > 0 && (
        <ul className="space-y-3">
          {shows.map((show) => {
            const past = show.event_date < today;
            const showPlans = plansByShow.get(show.id) ?? [];
            return (
              <li
                key={show.id}
                className={`rounded-2xl border border-black/5 bg-paper-card p-4 shadow-sm transition ${
                  past ? 'opacity-70' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span className="rounded-lg bg-paper-alt px-2 py-1 text-xs font-medium text-ink-soft">
                        {formatDateBR(show.event_date)}
                      </span>
                      <span className="truncate">{show.club}</span>
                    </div>
                    {show.city && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                        <MapPin size={12} /> {show.city}
                      </p>
                    )}
                    {showPlans.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {showPlans.map((p) => (
                          <span
                            key={p.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${planChipClass(
                              p.status,
                            )}`}
                            title={showPlanStatusLabels[p.status]}
                          >
                            {p.dogs?.name ?? 'Cão'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" className="border border-black/10" onClick={() => setPlansFor(show)}>
                      <Users size={16} /> Cães
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(show);
                        setDialog(true);
                      }}
                      className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(show)}
                      className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {orgId && (
        <>
          <ShowFormDialog
            open={dialog}
            onClose={() => setDialog(false)}
            show={editing}
            organizationId={orgId}
          />
          <ShowPlansDialog
            open={!!plansFor}
            onClose={() => setPlansFor(null)}
            show={plansFor}
            organizationId={orgId}
          />
        </>
      )}
    </div>
  );
}

function ResultsTab() {
  const { data: dogs } = useDogs();
  const { data: plans } = useShowPlans();

  const campaignDogs = (dogs ?? []).filter((d) => d.in_campaign);

  const countsByDog = useMemo(() => {
    const map = new Map<string, { pretendido: number; confirmado: number }>();
    for (const p of plans ?? []) {
      const c = map.get(p.dog_id) ?? { pretendido: 0, confirmado: 0 };
      c[p.status] += 1;
      map.set(p.dog_id, c);
    }
    return map;
  }, [plans]);

  if (campaignDogs.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
            <Trophy size={22} />
          </div>
          <p className="text-sm text-ink-soft">Nenhum cão em campanha.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Marque um cão como <strong>em campanha</strong> no cadastro de Cães para acompanhá-lo
            aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-ink-soft">
        <Award size={18} className="mt-0.5 text-gold" />
        <div>
          <strong className="text-ink">Resultados de pista.</strong> Esta seção vai consolidar os
          resultados obtidos (CACs, CGC, juízes) e o quanto falta em pista para cada título — virá
          junto com o importador do DogShow. A gestão de títulos e homologações já está na aba{' '}
          <strong className="text-ink">Títulos</strong>. Por enquanto, mostramos a participação
          planejada em shows.
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {campaignDogs.map((dog) => {
          const counts = countsByDog.get(dog.id) ?? { pretendido: 0, confirmado: 0 };
          return (
            <div key={dog.id} className="rounded-2xl border border-black/5 bg-paper-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-gold" />
                <span className="font-medium text-ink">{dog.name}</span>
              </div>
              {dog.registered_name && (
                <p className="mt-0.5 text-xs text-ink-muted">{dog.registered_name}</p>
              )}
              <div className="mt-3 flex gap-4 text-sm text-ink-soft">
                <span>
                  Confirmados: <strong className="text-brand">{counts.confirmado}</strong>
                </span>
                <span>
                  Pretendidos: <strong className="text-amber-700">{counts.pretendido}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
