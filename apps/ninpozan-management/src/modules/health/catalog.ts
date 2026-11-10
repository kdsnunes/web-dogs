import { addDays, addMonths, format, parseISO } from 'date-fns';
import type { HealthEventType } from './types';

export interface ProtocolInterval {
  amount: number;
  unit: 'days' | 'months';
}

export interface HealthProduct {
  value: string; // armazenado no banco
  label: string; // exibido no dropdown
  interval?: ProtocolInterval; // protocolo → próximo vencimento automático
}

/**
 * Catálogo de produtos por tipo de evento. Fácil de expandir: basta
 * adicionar itens aqui. Tipos ausentes neste mapa não exibem o campo Produto.
 */
export const healthProductsByType: Partial<Record<HealthEventType, HealthProduct[]>> = {
  vacina: [
    { value: 'V8', label: 'V8 (óctupla)', interval: { amount: 30, unit: 'days' } },
    { value: 'V10', label: 'V10 (déctupla)', interval: { amount: 30, unit: 'days' } },
    { value: 'V10 (reforço anual)', label: 'V10 — reforço anual', interval: { amount: 12, unit: 'months' } },
    { value: 'Antirrábica', label: 'Antirrábica', interval: { amount: 12, unit: 'months' } },
    { value: 'Giárdia', label: 'Giárdia', interval: { amount: 12, unit: 'months' } },
    { value: 'Gripe canina', label: 'Gripe canina (tosse dos canis)', interval: { amount: 12, unit: 'months' } },
    { value: 'Outro', label: 'Outro' },
  ],
  vermifugo: [
    { value: 'Drontal Plus', label: 'Drontal Plus', interval: { amount: 3, unit: 'months' } },
    { value: 'Endogard', label: 'Endogard', interval: { amount: 3, unit: 'months' } },
    { value: 'Vetmax Plus', label: 'Vetmax Plus (Vetnil)', interval: { amount: 3, unit: 'months' } },
    { value: 'Outro', label: 'Outro' },
  ],
  antiparasitario: [
    { value: 'Bravecto', label: 'Bravecto (3 meses)', interval: { amount: 3, unit: 'months' } },
    { value: 'NexGard Spectra', label: 'NexGard Spectra (30 dias)', interval: { amount: 30, unit: 'days' } },
    { value: 'NexGard', label: 'NexGard (30 dias)', interval: { amount: 30, unit: 'days' } },
    { value: 'Simparic', label: 'Simparic (30 dias)', interval: { amount: 30, unit: 'days' } },
    { value: 'Outro', label: 'Outro' },
  ],
};

export function getProducts(type: HealthEventType): HealthProduct[] | undefined {
  return healthProductsByType[type];
}

export function findProduct(type: HealthEventType, value: string): HealthProduct | undefined {
  return getProducts(type)?.find((p) => p.value === value);
}

export function typeRequiresProduct(type: HealthEventType): boolean {
  return getProducts(type) !== undefined;
}

/** Calcula a data do próximo vencimento a partir da data do evento e do protocolo. */
export function computeNextDue(eventDate: string, interval?: ProtocolInterval): string {
  if (!eventDate || !interval) return '';
  const base = parseISO(eventDate);
  const next =
    interval.unit === 'months'
      ? addMonths(base, interval.amount)
      : addDays(base, interval.amount);
  return format(next, 'yyyy-MM-dd');
}
