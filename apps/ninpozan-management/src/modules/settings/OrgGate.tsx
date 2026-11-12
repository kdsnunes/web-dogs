import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/authentication/AuthProvider';
import { useOrganization } from '@/modules/organization/useOrganization';
import { joinOrganization } from './api';

const PENDING_CODE_KEY = 'ninpozan.pendingInviteCode';

/**
 * Garante que o usuário autenticado pertença a uma organização.
 * Quem acabou de se cadastrar entra aqui com o código de convite.
 */
export function OrgGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { data: org, isLoading } = useOrganization();
  const qc = useQueryClient();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  async function join(rawCode: string) {
    setBusy(true);
    setError(null);
    try {
      await joinOrganization(rawCode);
      localStorage.removeItem(PENDING_CODE_KEY);
      await qc.invalidateQueries({ queryKey: ['organization'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar na organização.');
    } finally {
      setBusy(false);
    }
  }

  // Tenta usar um código guardado no cadastro (quando havia confirmação de e-mail)
  useEffect(() => {
    if (isLoading || org || autoTried.current) return;
    const pending = localStorage.getItem(PENDING_CODE_KEY);
    if (pending) {
      autoTried.current = true;
      void join(pending);
    }
  }, [isLoading, org]);

  if (isLoading) {
    return <div className="grid h-full place-items-center text-ink-muted">Carregando…</div>;
  }

  if (org) return <>{children}</>;

  return (
    <div className="grid min-h-full place-items-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
            忍
          </div>
          <h1 className="text-xl font-semibold text-ink">Entrar na organização</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Informe o código de convite que o administrador do canil compartilhou com você.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void join(code);
          }}
          className="rounded-2xl border border-black/5 bg-paper-card p-6 shadow-sm"
        >
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Código de convite</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex.: A1B2C3D4"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 tracking-widest text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-deep disabled:opacity-60"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 block w-full text-center text-sm text-ink-muted hover:text-ink-soft"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

export { PENDING_CODE_KEY };
