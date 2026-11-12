import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { joinOrganization } from '@/modules/settings/api';
import { PENDING_CODE_KEY } from '@/modules/settings/OrgGate';
import { useAuth } from './AuthProvider';

export function SignupPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError) {
      setSubmitting(false);
      setError(`Erro ao cadastrar: ${signUpError.message}`);
      return;
    }

    // Guarda o código para o caso de precisar confirmar o e-mail antes de entrar
    localStorage.setItem(PENDING_CODE_KEY, code.trim());

    if (data.session) {
      // Sessão já ativa (sem confirmação de e-mail): entra na organização agora
      try {
        await joinOrganization(code);
        localStorage.removeItem(PENDING_CODE_KEY);
      } catch (e) {
        setSubmitting(false);
        setError(
          e instanceof Error
            ? `Conta criada, mas: ${e.message}`
            : 'Conta criada, mas não foi possível entrar na organização.',
        );
        return;
      }
      navigate('/', { replace: true });
      return;
    }

    // Precisa confirmar o e-mail antes do primeiro login
    setSubmitting(false);
    setInfo(
      'Conta criada! Confirme seu e-mail e depois faça login — você entrará na organização automaticamente.',
    );
  }

  return (
    <div className="grid min-h-full place-items-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
            忍
          </div>
          <h1 className="text-xl font-semibold text-ink">Criar conta</h1>
          <p className="mt-1 text-sm text-ink-muted">Cadastro da equipe do canil</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-black/5 bg-paper-card p-6 shadow-sm">
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Nome completo</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Código de convite</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Fornecido pelo administrador"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 tracking-widest text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {info && (
            <p className="mb-4 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">{info}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-deep disabled:opacity-60"
          >
            {submitting ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
