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