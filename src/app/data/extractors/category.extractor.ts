import { CATEGORY_KEYWORDS, COMBINED_PATTERNS } from '../config/contest-keywords';

export function extractCategories(text: string): string[] {
  const categories: string[] = [];
  const lowerText = text.toLowerCase();

  for (const { pattern, cats } of COMBINED_PATTERNS) {
    if (pattern.test(lowerText)) {
      for (const cat of cats) {
        if (!categories.includes(cat)) {
          categories.push(cat);
        }
      }
    }
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      if (!categories.includes(cat)) {
        categories.push(cat);
      }
    }
  }

  return categories.length > 0 ? categories : ['otro'];
}