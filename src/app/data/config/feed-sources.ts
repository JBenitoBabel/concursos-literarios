import { ContestSource } from '../../models/contest.model';

export type FeedKind = 'rss-escritores' | 'rss-wordpress' | 'json-letrasespanolas';

export interface FeedSource {
  id: ContestSource;
  url: string;
  kind: FeedKind;
  useProxy: boolean;
}

export const SOURCE_LABELS: Record<ContestSource, string> = {
  escritores: 'Escritores',
  letralia: 'Letralia',
  guiadeconcursos: 'Guía de Concursos',
  letrasespanolas: 'Letras Españolas',
};

export const FEED_SOURCES: FeedSource[] = [
  {
    id: 'escritores',
    url: 'https://www.escritores.org/recursos/escritores.xml',
    kind: 'rss-escritores',
    useProxy: true,
  },
  {
    id: 'letralia',
    url: 'https://letralia.com/category/convocatorias/feed/',
    kind: 'rss-wordpress',
    useProxy: true,
  },
  {
    id: 'guiadeconcursos',
    url: 'https://www.guiadeconcursos.com/category/concursos-literarios/feed/',
    kind: 'rss-wordpress',
    useProxy: true,
  },
  {
    id: 'letrasespanolas',
    url: 'https://raw.githubusercontent.com/groguer1/concursos-literarios/main/concursos.json',
    kind: 'json-letrasespanolas',
    useProxy: false,
  },
];
