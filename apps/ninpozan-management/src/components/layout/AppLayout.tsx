import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dog,
  HeartPulse,
  Boxes,
  Trophy,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/modules/authentication/AuthProvider';

const navItems = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/caes', label: 'Cães', icon: Dog },
  { to: '/saude', label: 'Saúde & Protocolos', icon: HeartPulse },
  { to: '/estoque', label: 'Estoque', icon: Boxes },
  { to: '/shows', label: 'Shows', icon: Trophy },
  { to: '/ponto', label: 'Ponto', icon: Clock },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-bold text-white">
        忍
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-ink">Ninpozan</p>
        <p className="text-xs text-ink-muted">Gestão do Canil</p>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Fecha o menu ao navegar (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Trava o scroll do corpo enquanto o drawer está aberto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-full">
      {/* Backdrop (apenas mobile, quando aberto) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: drawer no mobile, fixa no desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-black/5 bg-paper-card transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <BrandMark />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-alt lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
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

      {/* Coluna de conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo mobile com botão do menu */}
        <header className="flex items-center gap-3 border-b border-black/5 bg-paper-card px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-alt"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <BrandMark />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
