// Taxonomia compartilhada entre Estoque e Saúde & Protocolos.
// Categorias de estoque (consomem itens) + categoria Clínico (sem estoque).

export const stockTaxonomy = {
  Alimentação: ['Ração', 'Suplemento'],
  Grooming: ['Shampoo', 'Condicionador', 'Protetor térmico'],
  Saúde: [
    'Vacina',
    'Probiótico',
    'Corticóide',
    'Antiinflamatório',
    'Cicatrizantes',
    'Hidratantes de pele',
    'Antiparasitário',
    'Vermífugo',
  ],
} as const;

export type StockCategory = keyof typeof stockTaxonomy;

export const stockCategories = Object.keys(stockTaxonomy) as StockCategory[];

export const CLINICAL_CATEGORY = 'Clínico';

export const clinicalSubcategories = ['Cio', 'Troca de pelagem', 'Consulta', 'Peso'] as const;

/** Categorias disponíveis na tela de Saúde (estoque + clínico). */
export const healthCategories: string[] = [...stockCategories, CLINICAL_CATEGORY];

export function isStockCategory(category: string): boolean {
  return (stockCategories as string[]).includes(category);
}

export function subcategoriesFor(category: string): readonly string[] {
  if (category === CLINICAL_CATEGORY) return clinicalSubcategories;
  return stockTaxonomy[category as StockCategory] ?? [];
}
