import { Contest } from '../../app/models/contest.model';

export const mockContests: Contest[] = [
  {
    title: 'Premio Nadal 2024',
    link: 'https://www.escritores.org/premio-nadal-2024',
    description: 'Premio en metálico de 18.000 € y publicación. Convoca Editorial Destino.',
    pubDate: new Date('2024-01-15'),
    categories: ['novela'],
    prizeTypes: ['dinero', 'publicacion'],
    deadline: new Date('2024-04-30'),
    organizer: 'Editorial Destino',
    amount: '18.000 €',
    rawDescription: 'BASES - (15:03:2024 / 30:04:2024). Premio en metálico de 18.000 € y publicación. Convoca Editorial Destino. Novela.'
  },
  {
    title: 'Certamen de Poesía "Ciudad de Madrid"',
    link: 'https://www.escritores.org/poesia-madrid-2024',
    description: 'Premio: 3.000 €. Poesía. Convoca Ayuntamiento de Madrid.',
    pubDate: new Date('2024-02-01'),
    categories: ['poesia'],
    prizeTypes: ['dinero'],
    deadline: new Date('2024-05-15'),
    organizer: 'Ayuntamiento de Madrid',
    amount: '3.000 €',
    rawDescription: 'BASES - (01:02:2024 / 15:05:2024). Premio: 3.000 €. Poesía. Convoca Ayuntamiento de Madrid.'
  },
  {
    title: 'Concurso de Relatos "Primavera 2024"',
    link: 'https://www.escritores.org/relatos-primavera-2024',
    description: 'Beca de residencia. Relato y Narrativa breve. Organiza Fundación Cultural.',
    pubDate: new Date('2024-04-10'),
    categories: ['relato'],
    prizeTypes: ['becas'],
    deadline: new Date('2024-06-30'),
    organizer: 'Fundación Cultural',
    amount: undefined,
    rawDescription: 'BASES - (10:04:2024 / 30:06:2024). Beca de residencia. Relato y Narrativa breve. Organiza Fundación Cultural.'
  },
  {
    title: 'Concurso Sin Premio Específico',
    link: 'https://www.escritores.org/sin-premio',
    description: 'Solo reconocimiento. Teatro.',
    pubDate: new Date('2024-03-01'),
    categories: ['teatro'],
    prizeTypes: ['reconocimiento'],
    deadline: undefined,
    organizer: undefined,
    amount: undefined,
    rawDescription: 'Solo reconocimiento. Teatro.'
  }
];

export const emptyContests: Contest[] = [];

export function createMockContest(overrides: Partial<Contest> = {}): Contest {
  return {
    title: 'Test Contest',
    link: 'https://test.com/contest',
    description: 'Test description',
    pubDate: new Date('2024-01-01'),
    categories: ['otro'],
    prizeTypes: ['otro'],
    rawDescription: 'Test raw description',
    ...overrides
  };
}