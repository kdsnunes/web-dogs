const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata um valor monetário armazenado em centavos (inteiro) como BRL.
 * Regra do sistema: dinheiro é sempre armazenado em centavos inteiros,
 * nunca em ponto flutuante.
 */
export function formatBRL(cents: number): string {
  return brlFormatter.format(cents / 100);
}
