import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, CalendarDays, Users } from 'lucide-react';
import { useAuth } from '@/modules/authentication/AuthProvider';
import { useOrganization } from '@/modules/organization/useOrganization';
import { useMonthEntries } from '@/modules/time/hooks';
import { addMonthsTo, monthStartISO, monthTitle } from '@/modules/time/calendar';
import { Button } from '@/components/ui';
import { useAlerts } from './hooks';
import { AlertsPanel } from './AlertsPanel';
import { aggregateByEmployee } from './ponto';
import { downloadCSV } from './csv';

export function ReportsPage() {
  const { user } = useAuth();
  const { data: org } = useOrganization();
  const isAdmin = org?.role === 'owner' || org?.role === 'manager';
  const alerts = useAlerts();

  const [viewDate, setViewDate] = useState(() => new Date());
  const refMonth = monthStartISO(viewDate);
  const nextMonth = monthStartISO(addMonthsTo(viewDate, 1));

  const { data: entries, isLoading } = useMonthEntries(org?.organizationId, refMonth, nextMonth);

  const rows = useMemo(() => {
    const all = aggregateByEmployee(entries ?? []);
    return isAdmin ? all : all.filter((r) => r.profileId === user?.id);
  }, [entries, isAdmin, user?.id]);

  function handleExport() {
    const header = ['Funcionário', 'Trabalhados', 'Folgas', 'Folgas vendidas'];
    const body = rows.map((r) => [r.name, r.trabalhado, r.folga, r.folga_vendida]);
    downloadCSV(`ponto-${monthTitle(viewDate).toLowerCase().replace(/\s+/g, '-')}.csv`, [
      header,
      ...body,
    ]);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Relatórios</h1>
        <p className="mt-1 text-sm text-ink-muted">Avisos do canil e fechamento mensal do ponto.</p>
      </header>

      {/* Avisos / Notificações */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Avisos</h2>
        <AlertsPanel alerts={alerts} />
      </section>

      {/* Relatório de ponto */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            <Users size={16} /> Ponto — {monthTitle(viewDate)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewDate((d) => addMonthsTo(d, -1))}
              className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
              title="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewDate((d) => addMonthsTo(d, 1))}
              className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
              title="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
            <Button variant="ghost" onClick={() => setViewDate(new Date())}>
              <CalendarDays size={16} /> Hoje
            </Button>
            <Button onClick={handleExport} disabled={rows.length === 0}>
              <Download size={16} /> Exportar CSV
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}

        {!isLoading && rows.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-14 text-center">
            <p className="text-sm text-ink-soft">Nenhum lançamento de ponto neste mês.</p>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-paper-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Funcionário</th>
                  <th className="px-4 py-3 font-medium">Trabalhados</th>
                  <th className="px-4 py-3 font-medium">Folgas</th>
                  <th className="px-4 py-3 font-medium">Folgas vendidas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.profileId} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {r.name}
                      {r.profileId === user?.id ? (
                        <span className="ml-1 text-xs text-ink-muted">(você)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.trabalhado}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.folga}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {r.folga_vendida}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
