export interface Contest {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  categories: string[];
  prizeTypes: string[];
  deadline?: Date;
  startDate?: Date;
  organizer?: string;
  amount?: string;
  genre?: string[];
  rawDescription: string;
}

export type FilterCategory = 'all' | 'poesia' | 'novela' | 'relato' | 'ensayo' | 'teatro' | 'infantil' | 'otro';
export type FilterPrizeType = 'all' | 'dinero' | 'publicacion' | 'becas' | 'reconocimiento' | 'otro';
export type FilterMonth = 'all' | 'no-date' | string; // YYYY-MM format
export type SortOrder = 'newest' | 'oldest';