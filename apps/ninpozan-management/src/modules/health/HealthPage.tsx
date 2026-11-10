import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarClock, HeartPulse } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useHealthEvents, useDeleteHealthEvent } from './hooks';
import { useOrganization } from '@/modules/organization/useOrganization';
import { useDogs } from '@/modules/dogs/hooks';
import { HealthEventFormDialog } from './HealthEventFormDialog';
import { healthTypeLabels, type HealthEvent } from './types';
import { Button } from '@/components/ui';
import { formatDateBR } from '@/lib/date';

function dueInfo(dueDate: string): { label: string; className: string } {
  const days = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (days < 0) {
    return { label: `Atrasado ${Math.abs(days)}d`, className: 'bg-red-100 text-red-700' };
  }
  if (days === 0) {
    return { label: 'Hoje', className: 'bg-amber-100 text-amber-800' };
  }
  if (days <= 15) {
    return { label: `Em ${days}d`, className: 'bg-amber-100 text-amber-800' };
  }
  return { label: `Em ${days}d`, className: 'bg-brand/10 text-brand' };
}

export function HealthPage() {
  const { data: org } = useOrganization();
  const { data: events, isLoading, isError } = useHealthEvents();
  const { data: dogs } = useDogs();
  const deleteEvent = useDeleteHealthEvent();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HealthEvent | null>(null);
  const [dogFilter, setDogFilter] = useState('');

  const filtered = useMemo(
    () => (events ?? []).filter((e) => !dogFilter || e.dog_id === dogFilter),
    [events, dogFilter],
  );

  const upcoming = useMemo(
    () =>
      filtered
        .filter((e) => e.next_due_date)
        .sort((a, b) => (a.next_due_date! < b.next_due_date! ? -1 : 1)),
    [filtered],
  );

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(event: HealthEvent) {
    setEditing(event);
    setOpen(true);
  }

  async function handleDelete(event: HealthEvent) {
    if (window.confirm('Remover este registro de saúde?')) {
      await deleteEvent.mutateAsync(event.id);
    }
  }

  const hasDogs = (dogs?.length ?? 0) > 0;

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Saúde &amp; Protocolos</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Vacinas, vermífugos, cios, consultas e próximos vencimentos.
          </p>
        </div>
        <Button onClick={openNew} disabled={!org || !hasDogs}>
          <Plus size={18} />
          Novo registro
        </Button>
      </header>

      {!hasDogs && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre um cão primeiro (menu <strong>Cães</strong>) para registrar eventos de saúde.
        </p>
      )}

      {hasDogs && (
        <div className="mb-6">
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
            Filtrar por cão:
            <select
              value={dogFilter}
              onChange={(e) => setDogFilter(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-ink outline-none focus:border-brand"
            >
              <option value="">Todos</option>
              {dogs?.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}
      {isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível carregar os registros.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                <CalendarClock size={16} />
                Próximos vencimentos
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => {
                  const info = dueInfo(event.next_due_date!);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEdit(event)}
                      className="rounded-xl border border-black/5 bg-paper-card p-4 text-left transition hover:border-brand/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {event.dogs?.name ?? 'Cão'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.className}`}
                        >
                          {info.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        {healthTypeLabels[event.event_type]}
                        {event.product ? ` · ${event.product}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Previsto: {formatDateBR(event.next_due_date)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Histórico
            </h2>

            {filtered.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
                    <HeartPulse size={22} />
                  </div>
                  <p className="text-sm text-ink-soft">Nenhum registro de saúde ainda.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/5 bg-paper-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                      <th className="px-4 py-3 font-medium">Cão</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Descrição</th>
                      <th className="px-4 py-3 font-medium">Próximo</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((event) => (
                      <tr key={event.id} className="border-b border-black/5 last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">
                          {event.dogs?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-ink-soft">{healthTypeLabels[event.event_type]}</div>
                          {event.product && (
                            <div className="text-xs text-ink-muted">{event.product}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{formatDateBR(event.event_date)}</td>
                        <td className="px-4 py-3 text-ink-soft">{event.description ?? '—'}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {formatDateBR(event.next_due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(event)}
                              className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(event)}
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {org && dogs && (
        <HealthEventFormDialog
          open={open}
          onClose={() => setOpen(false)}
          event={editing}
          dogs={dogs}
          organizationId={org.organizationId}
        />
      )}
    </div>
  );
}
