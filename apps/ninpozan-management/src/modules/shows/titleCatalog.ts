// Catálogo de títulos (pontos do art. 2 — regulamentos_17.pdf, edição 2026).
// Fonte: docs/catalogo_de_pontos.json. Versão de regra para 2027 é simulação
// baseada em 2026 até sair o regulamento oficial de 2027.

export const RULE_VERSION = '2027_SIMULACAO_BASE_2026';

export type TitleGroup =
  | 'Nacionais'
  | 'Pan-americanos'
  | 'Latino-americanos'
  | 'Internacionais'
  | 'Vencedores'
  | 'Seccional / Mundial (FCI)'
  | 'Copa do Brasil'
  | 'Guanabara'
  | 'Especiais';

export interface TitleCatalogEntry {
  id: string;
  titulo: string;
  pontos: number;
  grupo: TitleGroup;
  fonte: string;
}

export const titleCatalog: TitleCatalogEntry[] = [
  // Nacionais
  { id: 'CBKC_RANK_2026_02', titulo: 'Campeão Inicial', pontos: 5, grupo: 'Nacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_03', titulo: 'Campeão Filhote', pontos: 10, grupo: 'Nacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_04', titulo: 'Campeão Jovem', pontos: 15, grupo: 'Nacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_08', titulo: 'Grande Campeão Jovem', pontos: 25, grupo: 'Nacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_06', titulo: 'Campeão Nacional de Beleza', pontos: 25, grupo: 'Nacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_09', titulo: 'Grande Campeão Nacional de Beleza', pontos: 40, grupo: 'Nacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_05', titulo: 'Campeão Nacional Veterano de Beleza', pontos: 15, grupo: 'Nacionais', fonte: 'art. 2' },

  // Pan-americanos
  { id: 'CBKC_RANK_2026_15', titulo: 'Campeão Pan-americano Jovem', pontos: 15, grupo: 'Pan-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_18', titulo: 'Grande Campeão Pan-americano Jovem', pontos: 25, grupo: 'Pan-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_16', titulo: 'Campeão Pan-americano de Beleza', pontos: 25, grupo: 'Pan-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_19', titulo: 'Grande Campeão Pan-americano de Beleza', pontos: 45, grupo: 'Pan-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_17', titulo: 'Campeão Pan-americano Veterano de Beleza', pontos: 20, grupo: 'Pan-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_20', titulo: 'Grande Campeão Pan-americano Veterano de Beleza', pontos: 30, grupo: 'Pan-americanos', fonte: 'art. 2' },

  // Latino-americanos
  { id: 'CBKC_RANK_2026_21', titulo: 'Campeão Latino-americano Jovem', pontos: 20, grupo: 'Latino-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_22', titulo: 'Campeão Latino-americano', pontos: 25, grupo: 'Latino-americanos', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_23', titulo: 'Campeão Latino-americano Veterano', pontos: 20, grupo: 'Latino-americanos', fonte: 'art. 2' },

  // Internacionais
  { id: 'CBKC_RANK_2026_33', titulo: 'Campeão Internacional Jovem de Beleza', pontos: 45, grupo: 'Internacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_34', titulo: 'Campeão Internacional de Beleza', pontos: 55, grupo: 'Internacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_35', titulo: 'Campeão Internacional de Exposição', pontos: 55, grupo: 'Internacionais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_36', titulo: 'Campeão Internacional Veterano de Beleza', pontos: 45, grupo: 'Internacionais', fonte: 'art. 2' },

  // Vencedores
  { id: 'CBKC_RANK_2026_26', titulo: 'Jovem Vencedor Nacional', pontos: 45, grupo: 'Vencedores', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_27', titulo: 'Grande Vencedor Nacional', pontos: 50, grupo: 'Vencedores', fonte: 'art. 2' },

  // Seccional / Mundial (FCI)
  { id: 'CBKC_RANK_2026_28', titulo: 'Promissor Vencedor Exposição Seccional (FCI)', pontos: 30, grupo: 'Seccional / Mundial (FCI)', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_29', titulo: 'Jovem Vencedor Exposição Seccional (FCI)', pontos: 35, grupo: 'Seccional / Mundial (FCI)', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_30', titulo: 'Vencedor Exposição Seccional (FCI)', pontos: 40, grupo: 'Seccional / Mundial (FCI)', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_31', titulo: 'Jovem Vencedor Mundial', pontos: 40, grupo: 'Seccional / Mundial (FCI)', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_32', titulo: 'Vencedor Mundial', pontos: 45, grupo: 'Seccional / Mundial (FCI)', fonte: 'art. 2' },

  // Copa do Brasil
  { id: 'CBKC_RANK_2026_10', titulo: 'Campeão Inicial da Copa do Brasil', pontos: 5, grupo: 'Copa do Brasil', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_11', titulo: 'Campeão Filhote da Copa do Brasil', pontos: 10, grupo: 'Copa do Brasil', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_12', titulo: 'Campeão Jovem da Copa do Brasil', pontos: 15, grupo: 'Copa do Brasil', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_13', titulo: 'Campeão da Copa do Brasil', pontos: 20, grupo: 'Copa do Brasil', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_14', titulo: 'Campeão Veterano da Copa do Brasil', pontos: 15, grupo: 'Copa do Brasil', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_25', titulo: 'Campeão do Brasil', pontos: 40, grupo: 'Copa do Brasil', fonte: 'art. 2' },

  // Guanabara
  { id: 'CBKC_RANK_2026_38', titulo: 'Promissor Campeão da Guanabara', pontos: 20, grupo: 'Guanabara', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_39', titulo: 'Jovem Campeão da Guanabara', pontos: 25, grupo: 'Guanabara', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_40', titulo: 'Campeão da Guanabara', pontos: 30, grupo: 'Guanabara', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_41', titulo: 'Veterano Campeão da Guanabara', pontos: 25, grupo: 'Guanabara', fonte: 'art. 2' },

  // Especiais
  { id: 'CBKC_RANK_2026_01', titulo: 'Teste de Cão Sociável – TCS CBKC', pontos: 10, grupo: 'Especiais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_07', titulo: 'Campeão Pleno', pontos: 30, grupo: 'Especiais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_24', titulo: 'Título Nacional Conquistado no Exterior', pontos: 20, grupo: 'Especiais', fonte: 'art. 2' },
  { id: 'CBKC_RANK_2026_37', titulo: 'Campeão Reprodutor', pontos: 50, grupo: 'Especiais', fonte: 'art. 2' },
];

const byId = new Map(titleCatalog.map((t) => [t.id, t]));

export function titleById(id: string): TitleCatalogEntry | undefined {
  return byId.get(id);
}

export const titleGroups: TitleGroup[] = [
  'Nacionais',
  'Pan-americanos',
  'Latino-americanos',
  'Internacionais',
  'Vencedores',
  'Seccional / Mundial (FCI)',
  'Copa do Brasil',
  'Guanabara',
  'Especiais',
];
