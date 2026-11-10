import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Dog,
  HeartPulse,
  Boxes,
  Clock,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/modules/authentication/AuthProvider';

const navItems = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/caes', label: 'Cães', icon: Dog },
  { to: '/saude', label: 'Saúde & Protocolos', icon: HeartPulse },
  { to: '/estoque', label: 'Estoque', icon: Boxes },
  { to: '/ponto', label: 'Ponto', icon: Clock },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full">
      <aside className="flex w-60 flex-col border-r border-black/5 bg-paper-card">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-bold text-white">
            忍
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Ninpozan</p>
            <p className="text-xs text-ink-muted">Gestão do Canil</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-brand/10 font-medium text-brand'
                    : 'text-ink-soft hover:bg-paper-alt'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-black/5 p-3">
          <p className="truncate px-3 pb-2 text-xs text-ink-muted" title={user?.email ?? ''}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-paper-alt"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
