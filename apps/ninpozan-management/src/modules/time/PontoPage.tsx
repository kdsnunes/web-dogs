import { useMemo, useState } from 'react';
import { LogIn, LogOut, Trash2, Clock } from 'lucide-react';
import { useTimeEntries, useClock, useDeleteTimeEntry } from './hooks';
import { useOrganization } from '@/modules/organization/useOrganization';
import { useAuth } from '@/modules/authentication/AuthProvider';
import { workedMinutes, formatDuration } from './worked';
import { timeKindLabels, type TimeEntry } from './types';
import { Button } from '@/components/ui';
import { formatDateTimeBR } from '@/lib/date';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export function PontoPage() {
  const { data: org } = useOrganization();
  const { user } = useAuth();
  const { data: entries, isLoading, isError } = useTimeEntries();
  const deleteEntry = useDeleteTimeEntry();
  const clock = useClock(org?.organizationId ?? '', user?.id ?? '');
  const [note, setNote] = useState('');

  const myEntries = useMemo(
    () => (entries ?? []).filter((e) => e.profile_id === user?.id),
    [entries, user?.id],
  );

  const isClockedIn = myEntries[0]?.kind === 'entrada';
  const lastEntry = myEntries[0] ?? null;

  const myToday = useMemo(() => myEntries.filter((e) => isToday(e.occurred_at)), [myEntries]);
  const workedToday = useMemo(() => workedMinutes(myToday), [myToday]);

  async function handleClock() {
    if (!org || !user) return;
    await clock.mutateAsync({ kind: isClockedIn ? 'saida' : 'entrada', note });
    setNote('');
  }

  async function handleDelete(entry: TimeEntry) {
    if (window.confirm('Remover este registro de ponto?')) {
      await deleteEntry.mutateAsync(entry.id);
    }
  }

  const recent = (entries ?? []).slice(0, 100);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Ponto</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Registro de entrada e saída com horário do servidor.
        </p>
      </header>

      {/* Cartão de registro do usuário atual */}
      <section className="mb-8 rounded-2xl border border-black/5 bg-paper-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                isClockedIn ? 'bg-brand/10 text-brand' : 'bg-paper-alt text-ink-soft'
              }`}
            >
              <Clock size={15} />
              {isClockedIn ? 'Você está DENTRO' : 'Você está FORA'}
            </span>
            {lastEntry && (
              <p className="mt-2 text-xs text-ink-muted">
                Último registro: {timeKindLabels[lastEntry.kind]} às{' '}
                {formatDateTimeBR(lastEntry.occurred_at)}
              </p>
            )}
            <p className="mt-1 text-sm text-ink-soft">
              Horas hoje: <strong>{formatDuration(workedToday)}</strong>
            </p>
          </div>

          <div className="flex items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-muted">Observação (opcional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ex.: almoço, atendimento externo…"
                className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <Button
              onClick={() => void handleClock()}
              disabled={!org || !user || clock.isPending}
              variant={isClockedIn ? 'danger' : 'primary'}
              className={
                isClockedIn ? 'border border-red-200 bg-red-50 hover:bg-red-100' : undefined
              }
            >
              {isClockedIn ? <LogOut size={18} /> : <LogIn size={18} />}
              {isClockedIn ? 'Registrar saída' : 'Registrar entrada'}
            </Button>
          </div>
        </div>
      </section>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Registros
      </h2>

      {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}
      {isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível carregar os registros.
        </p>
      )}

      {!isLoading && !isError && recent.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <p className="text-sm text-ink-soft">Nenhum registro de ponto ainda.</p>
        </div>
      )}

      {!isLoading && !isError && recent.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-paper-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Funcionário</th>
                <th className="px-4 py-3 font-medium">Data / hora</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Observação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {recent.map((entry) => (
                <tr key={entry.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {entry.profiles?.full_name?.trim() || 'Sem nome'}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{formatDateTimeBR(entry.occurred_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        entry.kind === 'entrada'
                          ? 'bg-brand/10 text-brand'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {timeKindLabels[entry.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{entry.note ?? ''}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleDelete(entry)}
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
      <p className="mt-2 text-xs text-ink-muted">
        As horas são registradas com o horário do servidor; o horário exibido usa o fuso de São
        Paulo.
      </p>
    </div>
  );
}
