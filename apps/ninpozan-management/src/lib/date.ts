/** Data de hoje no formato yyyy-mm-dd (para inputs type="date"). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Converte yyyy-mm-dd em dd/mm/yyyy para exibição. */
export function formatDateBR(value: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
