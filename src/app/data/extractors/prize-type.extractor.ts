import { PRIZE_KEYWORDS, PRIZE_REGEX, type PrizeKeywordKey } from '../config/contest-keywords';

export function extractPrizeTypes(text: string): string[] {
  const lowerText = text.toLowerCase();
  const types: string[] = [];

  if (PRIZE_KEYWORDS['publicacion'].some((k) => lowerText.includes(k))) {
    types.push('publicacion');
  }
  if (PRIZE_KEYWORDS['becas'].some((k) => lowerText.includes(k))) {
    types.push('becas');
  }
  if (
    PRIZE_KEYWORDS['dinero'].some((k) => lowerText.includes(k)) ||
    PRIZE_REGEX.dinero.test(lowerText)
  ) {
    types.push('dinero');
  }
  if (PRIZE_KEYWORDS['reconocimiento'].some((k) => lowerText.includes(k))) {
    types.push('reconocimiento');
  }

  return types.length > 0 ? types : ['otro'];
}