import type { Source } from '../core/source';
import { DogShowSource } from './dogshow';

export interface SourceContext {
  userAgent: string;
  minIntervalMs: number;
  onWarning: (message: string) => void;
}

/** Fontes disponíveis. Para adicionar uma, implemente `Source` e registre aqui. */
const factories: Record<string, (ctx: SourceContext) => Source> = {
  dogshow: (ctx) => new DogShowSource(ctx),
};

export const sourceIds = Object.keys(factories);

export function createSource(id: string, ctx: SourceContext): Source {
  const factory = factories[id];
  if (!factory) {
    throw new Error(`Fonte desconhecida: "${id}". Disponíveis: ${sourceIds.join(', ')}.`);
  }
  return factory(ctx);
}
