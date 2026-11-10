import { CheckCircle2, Circle } from 'lucide-react';

const roadmap = [
  { phase: 'Fase 1 — Fundação', done: true },
  { phase: 'Fase 2 — Autenticação & Organização', done: true },
  { phase: 'Fase 3 — Cães (cadastro)', done: true },
  { phase: 'Fase 4 — Saúde & Protocolos', done: true },
  { phase: 'Fase 5 — Estoque & Ponto', done: false },
  { phase: 'Fase 6 — Relatórios & Notificações', done: false },
];

export function DashboardPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Painel</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Bem-vindo ao sistema de gestão do canil Ninpozan.
        </p>
      </header>

      <section className="rounded-2xl border border-black/5 bg-paper-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Roadmap do projeto
        </h2>
        <ul className="space-y-3">
          {roadmap.map((item) => (
            <li key={item.phase} className="flex items-center gap-3 text-sm">
              {item.done ? (
                <CheckCircle2 size={18} className="text-brand" />
              ) : (
                <Circle size={18} className="text-ink-muted/40" />
              )}
              <span className={item.done ? 'font-medium text-ink' : 'text-ink-soft'}>
                {item.phase}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
