type Cell = string | number | null | undefined;

/** Serializa linhas em CSV (separador ';', compatível com Excel pt-BR). */
export function toCSV(rows: Cell[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? '' : String(cell);
          return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(';'),
    )
    .join('\r\n');
}

/** Dispara o download de um CSV no navegador (com BOM para acentos no Excel). */
export function downloadCSV(filename: string, rows: Cell[][]): void {
  const blob = new Blob(['\ufeff' + toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
