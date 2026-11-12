import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      // eslint-disable-next-line no-console
      console.error('[login] erro ao autenticar:', signInError);
      const message = signInError.message ?? '';
      if (/email not confirmed/i.test(message)) {
        setError('Seu e-mail ainda não foi confirmado no Supabase.');
      } else if (/invalid login credentials/i.test(message)) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(`Erro: ${message}`);
      }
      return;
    }

    navigate('/', { replace: true });
  }

  return (
    <div className="grid min-h-full place-items-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
            忍
          </div>
          <h1 className="text-xl font-semibold text-ink">Ninpozan — Gestão</h1>
          <p className="mt-1 text-sm text-ink-muted">Acesso restrito à equipe</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-black/5 bg-paper-card p-6 shadow-sm"
        >
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

          <label className="mb-5 block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-deep disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-brand hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
