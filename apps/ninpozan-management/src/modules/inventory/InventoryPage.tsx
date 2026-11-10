import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeftRight, Boxes, AlertTriangle } from 'lucide-react';
import { useItems, useMovements, useDeleteItem } from './hooks';
import { computeBalances } from './balance';
import { useOrganization } from '@/modules/organization/useOrganization';
import { ItemFormDialog } from './ItemFormDialog';
import { MovementFormDialog } from './MovementFormDialog';
import { movementKindLabels, type InventoryItem } from './types';
import { Button } from '@/components/ui';
import { formatDateBR } from '@/lib/date';

const numberFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

export function InventoryPage() {
  const { data: org } = useOrganization();
  const { data: items, isLoading, isError } = useItems();
  const { data: movements } = useMovements();
  const deleteItem = useDeleteItem();

  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [movementDialog, setMovementDialog] = useState(false);
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);

  const balances = useMemo(() => computeBalances(movements ?? []), [movements]);

  const lowStock = useMemo(
    () =>
      (items ?? []).filter(
        (item) => item.min_quantity > 0 && (balances.get(item.id) ?? 0) <= item.min_quantity,
      ),
    [items, balances],
  );

  function openNewItem() {
    setEditingItem(null);
    setItemDialog(true);
  }

  function openEditItem(item: InventoryItem) {
    setEditingItem(item);
    setItemDialog(true);
  }

  function openMovement(item: InventoryItem) {
    setMovingItem(item);
    setMovementDialog(true);
  }

  async function handleDelete(item: InventoryItem) {
    if (window.confirm(`Remover "${item.name}" e todas as suas movimentações?`)) {
      await deleteItem.mutateAsync(item.id);
    }
  }

  const recentMovements = (movements ?? []).slice(0, 15);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Estoque</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Saldo calculado pelas entradas e saídas de cada item.
          </p>
        </div>
        <Button onClick={openNewItem} disabled={!org}>
          <Plus size={18} />
          Novo item
        </Button>
      </header>

      {isLoading && <p className="text-sm text-ink-muted">Carregando…</p>}
      {isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível carregar o estoque.
        </p>
      )}

      {!isLoading && !isError && lowStock.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 text-amber-600" />
          <div className="text-sm text-amber-800">
            <strong>Estoque baixo:</strong>{' '}
            {lowStock.map((item) => item.name).join(', ')}.
          </div>
        </div>
      )}

      {!isLoading && !isError && items && items.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
              <Boxes size={22} />
            </div>
            <p className="text-sm text-ink-soft">Nenhum item cadastrado ainda.</p>
            <div className="mt-4">
              <Button onClick={openNewItem} disabled={!org}>
                <Plus size={18} />
                Cadastrar o primeiro
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-paper-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Mínimo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const balance = balances.get(item.id) ?? 0;
                const low = item.min_quantity > 0 && balance <= item.min_quantity;
                return (
                  <tr key={item.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{item.name}</div>
                      {item.category && (
                        <div className="text-xs text-ink-muted">{item.category}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {numberFmt.format(balance)} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {item.min_quantity > 0 ? numberFmt.format(item.min_quantity) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          low ? 'bg-amber-100 text-amber-800' : 'bg-brand/10 text-brand'
                        }`}
                      >
                        {low ? 'Baixo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openMovement(item)}
                          className="rounded-lg p-2 text-brand transition hover:bg-brand/10"
                          title="Movimentar (entrada/saída)"
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditItem(item)}
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-alt"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {recentMovements.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Movimentações recentes
          </h2>
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-paper-card">
            <table className="w-full text-sm">
              <tbody>
                {recentMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDateBR(movement.movement_date)}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {movement.inventory_items?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          movement.kind === 'entrada' ? 'text-brand' : 'text-red-600'
                        }
                      >
                        {movement.kind === 'entrada' ? '+' : '−'}
                        {numberFmt.format(Number(movement.quantity))}{' '}
                        {movement.inventory_items?.unit ?? ''}
                      </span>
                      <span className="ml-2 text-xs text-ink-muted">
                        {movementKindLabels[movement.kind]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{movement.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {org && (
        <>
          <ItemFormDialog
            open={itemDialog}
            onClose={() => setItemDialog(false)}
            item={editingItem}
            organizationId={org.organizationId}
          />
          <MovementFormDialog
            open={movementDialog}
            onClose={() => setMovementDialog(false)}
            item={movingItem}
            organizationId={org.organizationId}
          />
        </>
      )}
    </div>
  );
}
