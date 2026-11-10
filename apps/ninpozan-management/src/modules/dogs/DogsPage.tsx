import { useState } from 'react';
import { Plus, Pencil, Trash2, Dog as DogIcon } from 'lucide-react';
import { useDogs, useDeleteDog } from './hooks';
import { useOrganization } from '@/modules/organization/useOrganization';
import { DogFormDialog } from './DogFormDialog';
import { Button } from '@/components/ui';
import { sexLabels, statusLabels, type Dog } from './types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

const statusBadge: Record<Dog['status'], string> = {
  ativo: 'bg-brand/10 text-brand',
  aposentado: 'bg-paper-alt text-ink-soft',
  vendido: 'bg-amber-100 text-amber-800',
  falecido: 'bg-black/5 text-ink-muted',
};

export function DogsPage() {
  const { data: org } = useOrganization();
  const { data: dogs, isLoading, isError } = useDogs();
  const deleteDog = useDeleteDog();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dog | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(dog: Dog) {
    setEditing(dog);
    setOpen(true);
  }

  async function handleDelete(dog: Dog) {
    if (window.confirm(`Remover "${dog.name}"? Esta ação não pode ser desfeita.`)) {
      await deleteDog.mutateAsync(dog.id);
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cães</h1>
          <p className="mt-1 text-sm text-ink-muted">Plantel do canil.</p>
        </div>
        <Button onClick={openNew} disabled={!org}>
          <Plus size={18} />
          Novo cão
        </Button>
      </header>

      {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}
      {isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível carregar os cães.
        </p>
      )}

      {!isLoading && !isError && dogs && dogs.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
              <DogIcon size={22} />
            </div>
            <p className="text-sm text-ink-soft">Nenhum cão cadastrado ainda.</p>
            <div className="mt-4">
              <Button onClick={openNew} disabled={!org}>
                <Plus size={18} />
                Cadastrar o primeiro
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && dogs && dogs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-paper-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Sexo</th>
                <th className="px-4 py-3 font-medium">Nascimento</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {dogs.map((dog) => (
                <tr key={dog.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{dog.name}</div>
                    {dog.registered_name && (
                      <div className="text-xs text-ink-muted">{dog.registered_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{sexLabels[dog.sex]}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(dog.birth_date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[dog.status]}`}
                    >
                      {statusLabels[dog.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(dog)}
                        className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(dog)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {org && (
        <DogFormDialog
          open={open}
          onClose={() => setOpen(false)}
          dog={editing}
          organizationId={org.organizationId}
        />
      )}
    </div>
  );
}
