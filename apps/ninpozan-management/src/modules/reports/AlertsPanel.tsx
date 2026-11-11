import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, PackageX } from 'lucide-react';
import { formatDateBR } from '@/lib/date';
import type { Alerts, ProtocolAlert } from './alerts';

const numberFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

function protocolText(a: ProtocolAlert): string {
  const dog = a.event.dogs?.name ?? 'Cão';
  const what = a.event.inventory_items?.name ?? a.event.subcategory ?? a.event.category ?? 'Protocolo';
  const when =
    a.days < 0
      ? `atrasado ${Math.abs(a.days)}d`
      : a.days === 0
        ? 'vence hoje'
        : `em ${a.days}d`;
  return `${dog} · ${what} — ${when} (${formatDateBR(a.dueDate)})`;
}

export function AlertsPanel({ alerts }: { alerts: Alerts | null }) {
  if (!alerts) {
    return <p className="text-sm text-ink-muted">Carregando avisos…</p>;
  }

  if (alerts.total === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-paper-card p-5 text-sm text-ink-soft shadow-sm">
        <CheckCircle2 size={20} className="text-brand" />
        Tudo em dia — nenhum protocolo vencendo e nenhum item em falta.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          to="/saude"
          label="Protocolos atrasados"
          value={alerts.overdue.length}
          tone="red"
          icon={<AlertTriangle size={18} />}
        />
        <StatCard
          to="/saude"
          label="Vencendo em breve"
          value={alerts.dueSoon.length}
          tone="amber"
          icon={<CalendarClock size={18} />}
        />
        <StatCard
          to="/estoque"
          label="Estoque baixo"
          value={alerts.lowStock.length}
          tone="amber"
          icon={<PackageX size={18} />}
        />
      </div>

      {(alerts.overdue.length > 0 || alerts.dueSoon.length > 0) && (
        <div className="rounded-2xl border border-black/5 bg-paper-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarClock size={16} className="text-amber-600" /> Protocolos de saúde
          </h3>
          <ul className="space-y-1.5 text-sm">
            {alerts.overdue.map((a) => (
              <li key={a.event.id} className="flex items-center gap-2 text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {protocolText(a)}
              </li>
            ))}
            {alerts.dueSoon.map((a) => (
              <li key={a.event.id} className="flex items-center gap-2 text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {protocolText(a)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {alerts.lowStock.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-paper-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <PackageX size={16} className="text-amber-600" /> Estoque baixo
          </h3>
          <ul className="space-y-1.5 text-sm">
            {alerts.lowStock.map(({ item, balance }) => (
              <li key={item.id} className="flex items-center gap-2 text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {item.name} — saldo {numberFmt.format(balance)} {item.unit} (mínimo{' '}
                {numberFmt.format(item.min_quantity)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  to,
  label,
  value,
  tone,
  icon,
}: {
  to: string;
  label: string;
  value: number;
  tone: 'red' | 'amber';
  icon: React.ReactNode;
}) {
  const toneCls =
    tone === 'red'
      ? 'text-red-700 bg-red-50 border-red-100'
      : 'text-amber-800 bg-amber-50 border-amber-100';
  return (
    <Link
      to={to}
      className={`flex items-center justify-between rounded-2xl border p-4 transition hover:brightness-[0.98] ${toneCls}`}
    >
      <div>
        <div className="text-2xl font-semibold leading-none">{value}</div>
        <div className="mt-1 text-xs">{label}</div>
      </div>
      <span className="opacity-70">{icon}</span>
    </Link>
  );
}
