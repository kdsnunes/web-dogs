// Modelo comum a todas as fontes. Cada adaptador traduz o que coleta para estes tipos;
// nada daqui para baixo (filtro dos cães do canil, gravação) conhece a fonte de origem.

/** Um evento do calendário: um clube promovendo exposições em uma data e cidade. */
export interface ShowEvent {
  /** Identificador da fonte, ex.: "dogshow". */
  source: string;
  /** Identificador do evento na fonte, ex.: "1422601A". */
  sourceEventId: string;
  /** Clube ou nome do evento, como publicado. */
  name: string;
  /** Data civil do evento, yyyy-mm-dd. */
  date: string;
  city: string | null;
  /** Unidade da federação (ou equivalente), quando a fonte informa. */
  state: string | null;
  /** País, ISO 3166-1 alfa-2. */
  country: string;
  hasResults: boolean;
  registrationOpen: boolean;
}

/** Certificado ou título concedido a um cão em um julgamento, ex.: CAC, CACPAB-J, CGC-J (4 pontos). */
export interface Award {
  code: string;
  /** Pontos associados ao certificado quando a fonte informa (ex.: pontos de CGC). */
  points: number | null;
}

/** A linha de um cão no julgamento de uma raça. */
export interface DogResult {
  registrationNumber: string | null;
  dogName: string;
  catalogNumber: string | null;
  sex: 'M' | 'F' | null;
  /** Classe em que competiu, como publicada (ex.: "JCh", "Ab."). */
  classCode: string | null;
  /** Classificação na classe, como publicada (ex.: "1o."). */
  placement: string | null;
  /** Texto original da coluna de certificados, preservado para auditoria. */
  awardsRaw: string;
  awards: Award[];
  /** Resultados no sexo, como siglas (ex.: "MM", "MF"). */
  sexAwards: string[];
  /** Resultados na raça, como siglas (ex.: "MR", "MJ", "MSO"). */
  breedAwards: string[];
  /** Pontuações de ranking publicadas pela fonte, por nome de coluna. */
  points: Record<string, number | null>;
}

/** O julgamento de uma raça em uma exposição de um evento. */
export interface BreedJudgement {
  source: string;
  sourceEventId: string;
  /** Identificador da exposição dentro do evento, na fonte. */
  sourceShowId: string;
  showName: string;
  /** Identificador da raça na fonte. */
  breedId: string;
  breedName: string;
  judge: string | null;
  dogsPresent: number | null;
  results: DogResult[];
}

/** Um cão do canil que queremos acompanhar nos resultados. */
export interface DogTarget {
  registrationNumber: string | null;
  registeredName: string | null;
}
