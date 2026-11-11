import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Unlock, CalendarDays } from 'lucide-react';
import { useAuth } from '@/modules/authentication/AuthProvider';
import { useOrganization } from '@/modules/organization/useOrganization';
import { Button } from '@/components/ui';
import {
  useClearDay,
  useDayEntries,
  useMonthLock,
  useOrgMembers,
  useRestPref,
  useSetDayStatus,
  useSetMonthLock,
  useSetRestPref,
} from './hooks';
import { setDayStatus } from './api';
import {
  addMonthsTo,
  buildMonthGrid,
  computeMonthWindow,
  dayISO,
  monthKey,
  monthStartISO,
  monthTitle,
  nextStatusOnClick,
  summarize,
} from './calendar';
import {
  dayStatusLabels,
  weekdayFullLabels,
  weekdayLabels,
  type DayEntry,
  type DayStatus,
  type MonthLockState,
} from './types';

const STATUS_CELL: Record<DayStatus, string> = {
  trabalhado: 'bg-brand text-white',
  folga: 'bg-amber-100 text-amber-800',
  folga_vendida: 'bg-amber-500 text-white',
};

export function PontoPage() {
  const { user } = useAuth();
  const { data: org } = useOrganization();
  const isAdmin = org?.role === 'owner' || org?.role === 'manager';

  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profileId = selectedProfileId ?? user?.id;
  const orgId = org?.organizationId;

  const mKey = monthKey(viewDate);
  const currentMonthKey = monthKey(new Date());
  const refMonth = monthStartISO(viewDate);
  const nextMonth = monthStartISO(addMonthsTo(viewDate, 1));

  const { data: members } = useOrgMembers(isAdmin ? orgId : undefined);
  const { data: entries } = useDayEntries(profileId, refMonth, nextMonth);
  const { data: restPref } = useRestPref(profileId, refMonth);
  const { data: monthLock } = useMonthLock(orgId, refMonth);

  const setStatus = useSetDayStatus();
  const clearDay = useClearDay();
  const setRest = useSetRestPref();
  const setLock = useSetMonthLock();

  const win = computeMonthWindow({
    monthKey: mKey,
    currentMonthKey,
    lockState: monthLock?.state ?? null,
    isAdmin,
  });

  const restWeekday = restPref?.weekday ?? null;

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DayEntry>();
    for (const e of entries ?? []) map.set(e.entry_date, e);
    return map;
  }, [entries]);

  const summary = useMemo(() => summarize(entries ?? []), [entries]);
  const weeks = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const todayISO = dayISO(new Date());

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível salvar o lançamento.';
      setError(msg);
    }
  }

  async function handleDayClick(date: Date) {
    if (!orgId || !profileId) return;
    if (date.getMonth() !== viewDate.getMonth()) return; // dia de mês vizinho

    const iso = dayISO(date);
    const isRest = restWeekday != null && date.getDay() === restWeekday;
    const current = entriesByDate.get(iso)?.status ?? null;
    const next = nextStatusOnClick(current, isRest, win);

    if (next === 'blocked') {
      setError(win.reason ?? 'Lançamento não permitido neste mês.');
      return;
    }
    if (next === null) {
      await run(() => clearDay.mutateAsync({ profileId, entryDate: iso }));
    } else {
      await run(() =>
        setStatus.mutateAsync({ organizationId: orgId, profileId, entryDate: iso, status: next }),
      );
    }
  }

  async function handleChooseRestWeekday(weekday: number) {
    if (!orgId || !profileId) return;
    setError(null);
    await run(() =>
      setRest.mutateAsync({ organizationId: orgId, profileId, referenceMonth: refMonth, weekday }),
    );
    // Preenche com folga as ocorrências vazias desse dia da semana (se permitido)
    if (win.canRest) {
      setBusy(true);
      try {
        const targets = weeks
          .flat()
          .filter(
            (d) =>
              d.getMonth() === viewDate.getMonth() &&
              d.getDay() === weekday &&
              !entriesByDate.has(dayISO(d)),
          );
        await Promise.all(
          targets.map((d) =>
            setDayStatus({
              organizationId: orgId,
              profileId,
              entryDate: dayISO(d),
              status: 'folga',
            }),
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao preencher folgas.');
      } finally {
        setBusy(false);
      }
    }
  }

  async function handleLock(state: MonthLockState | null) {
    if (!orgId) return;
    await run(() => setLock.mutateAsync({ organizationId: orgId, referenceMonth: refMonth, state }));
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Ponto</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Marque os dias trabalhados e o descanso semanal no calendário.
          </p>
        </div>

        {isAdmin && members && (
          <label className="text-sm">
            <span className="mb-1 block text-xs text-ink-muted">Funcionário</span>
            <select
              value={profileId ?? ''}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {members.map((m) => (
                <option key={m.profile_id} value={m.profile_id}>
                  {m.full_name}
                  {m.profile_id === user?.id ? ' (você)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {/* Barra de navegação do mês */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDate((d) => addMonthsTo(d, -1))}
            className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
            title="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-44 text-center text-lg font-semibold text-ink">
            {monthTitle(viewDate)}
          </span>
          <button
            type="button"
            onClick={() => setViewDate((d) => addMonthsTo(d, 1))}
            className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
            title="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
          <Button variant="ghost" onClick={() => setViewDate(new Date())} className="ml-1">
            <CalendarDays size={16} /> Hoje
          </Button>
        </div>

        <p className="text-xs text-ink-muted">
          Clique em um <strong className="text-amber-700">dia da semana</strong> abaixo para definir
          seu descanso semanal.
        </p>
      </div>

      {/* Aviso da janela do mês */}
      {win.reason && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-paper-alt px-4 py-2 text-sm text-ink-soft">
          <Lock size={14} /> {win.reason}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Calendário */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-paper-card p-4 shadow-sm">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide">
          {weekdayLabels.map((w, i) => {
            const selected = restWeekday === i;
            return (
              <button
                key={w}
                type="button"
                disabled={!win.canRest || busy}
                onClick={() => void handleChooseRestWeekday(i)}
                title={`Definir ${weekdayFullLabels[i]} como descanso semanal`}
                className={`rounded-md py-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                    : 'text-ink-muted hover:bg-paper-alt'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date) => {
            const inMonth = date.getMonth() === viewDate.getMonth();
            const iso = dayISO(date);
            const status = entriesByDate.get(iso)?.status ?? null;
            const isRest = restWeekday != null && date.getDay() === restWeekday;
            const isToday = iso === todayISO;

            const base =
              'relative aspect-square rounded-lg text-sm transition flex flex-col items-center justify-center';
            let cls = 'bg-paper-alt/40 text-ink hover:bg-paper-alt';
            if (!inMonth) cls = 'text-ink-muted/30';
            else if (status) cls = STATUS_CELL[status];
            else if (isRest) cls = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100';

            return (
              <button
                key={iso}
                type="button"
                disabled={!inMonth || !win.editable || busy}
                onClick={() => void handleDayClick(date)}
                className={`${base} ${cls} ${
                  isToday ? 'ring-2 ring-brand ring-offset-1' : ''
                } ${!win.editable && inMonth ? 'cursor-not-allowed opacity-60' : ''}`}
                title={status ? dayStatusLabels[status] : isRest ? 'Descanso semanal' : undefined}
              >
                <span className="font-medium">{date.getDate()}</span>
                {inMonth && status && (
                  <span className="mt-0.5 text-[10px] leading-none opacity-90">
                    {status === 'trabalhado'
                      ? 'trab.'
                      : status === 'folga'
                        ? 'folga'
                        : 'vendida'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda + resumo */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft">
          <Legend className="bg-brand" label="Trabalhado" />
          <Legend className="bg-amber-100 ring-1 ring-amber-300" label="Folga" dark />
          <Legend className="bg-amber-500" label="Folga vendida" />
          <Legend className="bg-amber-50 ring-1 ring-amber-200" label="Descanso (vazio)" dark />
        </div>
        <div className="flex gap-5 text-sm">
          <span className="text-ink-soft">
            Trabalhados: <strong className="text-ink">{summary.trabalhado}</strong>
          </span>
          <span className="text-ink-soft">
            Folgas: <strong className="text-ink">{summary.folga}</strong>
          </span>
          <span className="text-ink-soft">
            Vendidas: <strong className="text-ink">{summary.folga_vendida}</strong>
          </span>
        </div>
      </div>

      {/* Painel do administrador */}
      {isAdmin && (
        <section className="mt-8 rounded-2xl border border-black/5 bg-paper-card p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-ink">Administração do mês</h2>
          <p className="mb-4 text-xs text-ink-muted">
            Estado de <strong>{monthTitle(viewDate)}</strong>:{' '}
            {monthLock?.state === 'fechado'
              ? 'fechado (sem lançamentos)'
              : monthLock?.state === 'reaberto'
                ? 'reaberto para lançamentos retroativos'
                : 'padrão'}
            . O fechamento vale para toda a organização.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="border border-black/10"
              onClick={() => void handleLock('reaberto')}
            >
              <Unlock size={16} /> Reabrir para lançamentos
            </Button>
            <Button
              variant="danger"
              className="border border-red-200"
              onClick={() => void handleLock('fechado')}
            >
              <Lock size={16} /> Fechar mês
            </Button>
            {monthLock && (
              <Button variant="ghost" onClick={() => void handleLock(null)}>
                Voltar ao padrão
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Legend({ className, label, dark }: { className: string; label: string; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded ${className}`} />
      <span className={dark ? 'text-ink-soft' : 'text-ink-soft'}>{label}</span>
    </span>
  );
}
