export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  poesia: ['poesía', 'poesia', 'poemas', 'verso'],
  novela: ['novela', 'novelas'],
  relato: ['relato', 'relatos', 'cuento', 'cuentos', 'narrativa breve'],
  ensayo: ['ensayo', 'ensayos'],
  teatro: ['teatro', 'dramaturgia', 'obra de teatro'],
  infantil: ['infantil', 'juvenil', 'niños', 'jóvenes'],
};

export const COMBINED_PATTERNS: Array<{ pattern: RegExp; cats: string[] }> = [
  { pattern: /(narrativa|novela)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['novela', 'poesia'] },
  { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(narrativa|novela)/i, cats: ['poesia', 'novela'] },
  { pattern: /(narrativa|novela)\s+y\s+(cuento|relato|microrrelato)/i, cats: ['novela', 'relato'] },
  { pattern: /(cuento|relato|microrrelato)\s+y\s+(narrativa|novela)/i, cats: ['relato', 'novela'] },
  { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(cuento|relato|microrrelato)/i, cats: ['poesia', 'relato'] },
  { pattern: /(cuento|relato|microrrelato)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['relato', 'poesia'] },
  { pattern: /(teatro|dramaturgia)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['teatro', 'poesia'] },
  { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(teatro|dramaturgia)/i, cats: ['poesia', 'teatro'] },
  { pattern: /(ensayo)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['ensayo', 'poesia'] },
  { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(ensayo)/i, cats: ['poesia', 'ensayo'] },
  { pattern: /(infantil|juvenil)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['infantil', 'poesia'] },
  { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(infantil|juvenil)/i, cats: ['poesia', 'infantil'] },
];

export type PrizeKeywordKey = 'publicacion' | 'becas' | 'dinero' | 'reconocimiento';

export const PRIZE_KEYWORDS: Record<PrizeKeywordKey, string[]> = {
  publicacion: ['publicación', 'publicacion', 'edición', 'edicion'],
  becas: ['beca', 'residencia'],
  dinero: ['€', 'eur', 'dólar', 'dolar', 'premio en metálico', 'premio economico'],
  reconocimiento: ['trofeo', 'placa', 'diploma', 'reconocimiento', 'mención', 'mencion'],
};

export const PRIZE_REGEX = {
  dinero: /\d+\.?\d*\s*(€|eur|euros)/i,
};

export type MappedSource = 'letralia' | 'guiadeconcursos' | 'letrasespanolas';

export const SOURCE_CATEGORY_MAPS: Record<MappedSource, Record<string, string>> = {
  letralia: {
    'concursos de poesía': 'poesia',
    'concursos de poesia': 'poesia',
    'concursos de poema': 'poesia',
    'concursos de poemas': 'poesia',
    'concursos de cuento': 'relato',
    'concursos de cuentos': 'relato',
    'concursos de narrativa': 'relato',
    'concursos de microrrelato': 'relato',
    'concursos de relato': 'relato',
    'concursos de prosa': 'relato',
    'concursos de novela': 'novela',
    'concursos de ensayo': 'ensayo',
    'concursos de dramaturgia': 'teatro',
    'concursos de teatro': 'teatro',
    'concursos de infantil': 'infantil',
    'concursos infantiles': 'infantil',
  },
  guiadeconcursos: {
    'poesía': 'poesia',
    'poesia': 'poesia',
    'novela': 'novela',
    'cuento-relato': 'relato',
    'cuento': 'relato',
    'relato': 'relato',
    'microrrelato': 'relato',
    'ensayo': 'ensayo',
    'dramaturgia': 'teatro',
    'teatro': 'teatro',
    'infantil': 'infantil',
    'juvenil': 'infantil',
    'infantil/juvenil': 'infantil',
  },
  letrasespanolas: {
    'poesia': 'poesia',
    'poesía': 'poesia',
    'relato corto': 'relato',
    'relato': 'relato',
    'microrrelato': 'relato',
    'cuento': 'relato',
    'novela corta': 'novela',
    'novela': 'novela',
    'ensayo': 'ensayo',
    'teatro': 'teatro',
    'dramaturgia': 'teatro',
    'infantil': 'infantil',
    'otro': 'otro',
  },
};

export const SOURCE_CATEGORY_NOISE: Record<MappedSource, string[]> = {
  letralia: [
    'convocatorias en las que se puede participar por internet',
    'convocatorias a publicaciones',
    'otros concursos y convocatorias',
    'artes plásticas',
    'artes plasticas',
    'fotografía',
    'fotografia',
    'audiovisual',
    'periodismo',
  ],
  guiadeconcursos: [
    'concursos literarios',
    'por email-online',
    'por email online',
  ],
  letrasespanolas: [],
};

export function mapSourceCategory(source: MappedSource, raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;

  const mapped = SOURCE_CATEGORY_MAPS[source][normalized];
  if (mapped) return mapped;

  if (SOURCE_CATEGORY_NOISE[source].some(noise => normalized === noise || normalized.includes(noise))) {
    return null;
  }

  if (source === 'guiadeconcursos' && raw === raw.toLowerCase()) {
    return null;
  }

  return 'otro';
}
