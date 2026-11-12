import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Trash2, UserCog, Check } from 'lucide-react';
import { useAuth } from '@/modules/authentication/AuthProvider';
import { useOrganization, type MemberRole } from '@/modules/organization/useOrganization';
import { Button } from '@/components/ui';
import {
  useMembers,
  useMyProfile,
  useOrgDetails,
  useRegenerateInviteCode,
  useRemoveMember,
  useUpdateMemberRole,
  useUpdateMyProfile,
} from './hooks';

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  staff: 'Funcionário',
};

export function SettingsPage() {
  const { user } = useAuth();
  const { data: org } = useOrganization();
  const isAdmin = org?.role === 'owner' || org?.role === 'manager';
  const orgId = org?.organizationId;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Configurações</h1>
        <p className="mt-1 text-sm text-ink-muted">Seu perfil, a organização e a equipe.</p>
      </header>

      <div className="space-y-8">
        <ProfileCard userId={user?.id} />
        {isAdmin && orgId && <OrganizationCard orgId={orgId} />}
        {orgId && <MembersCard orgId={orgId} isAdmin={isAdmin} currentUserId={user?.id} />}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-paper-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

function ProfileCard({ userId }: { userId: string | undefined }) {
  const { user } = useAuth();
  const { data: profile } = useMyProfile(userId);
  const update = useUpdateMyProfile(userId ?? '');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setName(profile.full_name ?? '');
  }, [profile]);

  async function handleSave() {
    if (!userId) return;
    setSaved(false);
    await update.mutateAsync(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card title="Meu perfil">
      <div className="grid gap-4 sm:max-w-md">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Nome completo</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você aparece para a equipe"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">E-mail</span>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full rounded-lg border border-black/10 bg-paper-alt px-3 py-2 text-ink-muted"
          />
        </label>
        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={update.isPending || !userId}>
            {update.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-brand">
              <Check size={16} /> Salvo
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function OrganizationCard({ orgId }: { orgId: string }) {
  const { data: details } = useOrgDetails(orgId);
  const regenerate = useRegenerateInviteCode(orgId);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!details) return;
    await navigator.clipboard.writeText(details.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card title="Organização">
      <div className="mb-4">
        <div className="text-sm text-ink-muted">Nome</div>
        <div className="text-base font-medium text-ink">{details?.name ?? '—'}</div>
      </div>

      <div className="rounded-xl border border-black/5 bg-paper-alt/50 p-4">
        <div className="text-sm font-medium text-ink-soft">Código de convite</div>
        <p className="mb-3 text-xs text-ink-muted">
          Compartilhe este código com um funcionário. Ao se cadastrar, ele entra automaticamente
          nesta organização como <strong>Funcionário</strong>.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-black/10 bg-white px-4 py-2 text-lg font-semibold tracking-widest text-ink">
            {details?.invite_code ?? '········'}
          </code>
          <Button variant="ghost" className="border border-black/10" onClick={() => void handleCopy()}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button
            variant="ghost"
            className="border border-black/10"
            onClick={() => {
              if (window.confirm('Gerar um novo código? O código antigo deixará de funcionar.')) {
                void regenerate.mutateAsync();
              }
            }}
            disabled={regenerate.isPending}
          >
            <RefreshCw size={16} /> Regenerar
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MembersCard({
  orgId,
  isAdmin,
  currentUserId,
}: {
  orgId: string;
  isAdmin: boolean;
  currentUserId: string | undefined;
}) {
  const { data: members, isLoading } = useMembers(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);

  return (
    <Card title="Equipe">
      {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}
      {members && (
        <div className="overflow-hidden rounded-xl border border-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isSelf = m.profileId === currentUserId;
                return (
                  <tr key={m.membershipId} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {m.fullName}
                      {isSelf && <span className="ml-1 text-xs text-ink-muted">(você)</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && !isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            void updateRole.mutateAsync({
                              membershipId: m.membershipId,
                              role: e.target.value as MemberRole,
                            })
                          }
                          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-ink outline-none focus:border-brand"
                        >
                          <option value="owner">{roleLabels.owner}</option>
                          <option value="manager">{roleLabels.manager}</option>
                          <option value="staff">{roleLabels.staff}</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-ink-soft">
                          <UserCog size={14} /> {roleLabels[m.role]}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remover ${m.fullName} da organização?`)) {
                                  void removeMember.mutateAsync(m.membershipId);
                                }
                              }}
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!isAdmin && (
        <p className="mt-3 text-xs text-ink-muted">
          Somente administradores podem alterar papéis ou remover membros.
        </p>
      )}
    </Card>
  );
}
