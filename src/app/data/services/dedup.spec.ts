import { Contest } from '../../models/contest.model';
import { normalizeUrl, dedupeContests, sourcesOf } from './dedup';

function makeContest(overrides: Partial<Contest> = {}): Contest {
  return {
    title: 'Concurso de prueba',
    link: '',
    description: '',
    pubDate: new Date('2026-09-01T10:00:00Z'),
    categories: [],
    prizeTypes: [],
    rawDescription: '',
    ...overrides,
  };
}

describe('normalizeUrl', () => {
  it('elimina parámetros utm', () => {
    expect(normalizeUrl('https://example.com/concurso?id=1&utm_source=rss&utm_medium=feed')).toBe(
      'https://example.com/concurso?id=1'
    );
  });

  it('elimina el prefijo www', () => {
    expect(normalizeUrl('https://www.example.com/concurso')).toBe('https://example.com/concurso');
  });

  it('elimina la barra final', () => {
    expect(normalizeUrl('https://example.com/concurso/')).toBe('https://example.com/concurso');
  });

  it('elimina el hash', () => {
    expect(normalizeUrl('https://example.com/concurso#bases')).toBe('https://example.com/concurso');
  });

  it('convierte a minúsculas', () => {
    expect(normalizeUrl('https://example.com/CONCURSO')).toBe('https://example.com/concurso');
  });

  it('normaliza URLs inválidas sin lanzar error', () => {
    expect(normalizeUrl('No es una URL/')).toBe('no es una url');
  });

  it('trata variantes www/trailing/utm como la misma URL', () => {
    expect(normalizeUrl('https://www.example.com/concurso/?utm_source=rss')).toBe(
      normalizeUrl('https://example.com/concurso')
    );
  });
});

describe('sourcesOf', () => {
  it('usa sources cuando existe', () => {
    expect(sourcesOf(makeContest({ sources: ['escritores', 'letrasespanolas'] }))).toEqual([
      'escritores',
      'letrasespanolas',
    ]);
  });

  it('hace fallback a source individual', () => {
    expect(sourcesOf(makeContest({ source: 'letralia' }))).toEqual(['letralia']);
  });

  it('devuelve vacío si no hay fuente', () => {
    expect(sourcesOf(makeContest())).toEqual([]);
  });
});

describe('dedupeContests', () => {
  it('fusiona duplicados con URL equivalente', () => {
    const result = dedupeContests([
      makeContest({ title: 'A', link: 'https://example.com/a', source: 'escritores' }),
      makeContest({ title: 'B', link: 'https://www.example.com/a/?utm_source=rss', source: 'letralia' }),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('A');
    expect(result[0].source).toBe('escritores');
    expect(result[0].sources).toEqual(['escritores', 'letralia']);
  });

  it('respeta la prioridad escritores > letrasespanolas > letralia > guiadeconcursos', () => {
    const link = 'https://example.com/x';
    const guia = makeContest({ link, source: 'guiadeconcursos' });
    const letralia = makeContest({ link, source: 'letralia' });
    const le = makeContest({ link, source: 'letrasespanolas' });
    const esc = makeContest({ link, source: 'escritores' });

    expect(dedupeContests([guia, letralia])[0].source).toBe('letralia');
    expect(dedupeContests([letralia, le])[0].source).toBe('letrasespanolas');
    expect(dedupeContests([le, esc])[0].source).toBe('escritores');
    expect(dedupeContests([esc, guia])[0].source).toBe('escritores');
  });

  it('une categorías sin duplicados', () => {
    const result = dedupeContests([
      makeContest({ link: 'https://example.com/c', source: 'escritores', categories: ['relato', 'novela'] }),
      makeContest({ link: 'https://example.com/c', source: 'letralia', categories: ['relato', 'poesia'] }),
    ]);
    expect(result[0].categories).toEqual(['relato', 'novela', 'poesia']);
  });

  it('une sources de ambas tarjetas', () => {
    const result = dedupeContests([
      makeContest({ link: 'https://example.com/s', source: 'letralia' }),
      makeContest({ link: 'https://example.com/s/', source: 'letrasespanolas' }),
    ]);
    expect(result[0].sources).toEqual(['letrasespanolas', 'letralia']);
  });

  it('completa deadline, amount y organizer desde el perdedor', () => {
    const deadline = new Date(2027, 9, 23);
    const result = dedupeContests([
      makeContest({ link: 'https://example.com/f', source: 'escritores' }),
      makeContest({
        link: 'https://example.com/f',
        source: 'letrasespanolas',
        deadline,
        amount: '1.000 euros',
        organizer: 'Fundación Letras',
      }),
    ]);
    expect(result[0].deadline).toEqual(deadline);
    expect(result[0].amount).toBe('1.000 euros');
    expect(result[0].organizer).toBe('Fundación Letras');
  });

  it('conserva los campos del ganador si ya los tiene', () => {
    const winnerDeadline = new Date(2027, 11, 31);
    const result = dedupeContests([
      makeContest({ link: 'https://example.com/g', source: 'escritores', deadline: winnerDeadline, amount: '500 €' }),
      makeContest({ link: 'https://example.com/g', source: 'letralia', deadline: new Date(2027, 0, 1), amount: '999 €' }),
    ]);
    expect(result[0].deadline).toEqual(winnerDeadline);
    expect(result[0].amount).toBe('500 €');
  });

  it('usa clave sin-url cuando no hay link', () => {
    const result = dedupeContests([
      makeContest({ title: 'Mismo certamen', link: '', source: 'escritores' }),
      makeContest({ title: 'Mismo certamen', link: '', source: 'letralia' }),
      makeContest({ title: 'Otro certamen', link: '' }),
    ]);
    expect(result.length).toBe(2);
    const merged = result.find(c => c.title === 'Mismo certamen');
    expect(merged?.sources).toEqual(['escritores', 'letralia']);
  });

  it('conserva como distintos los concursos con URL diferente', () => {
    const result = dedupeContests([
      makeContest({ link: 'https://example.com/uno', source: 'escritores' }),
      makeContest({ link: 'https://example.com/dos', source: 'escritores' }),
    ]);
    expect(result.length).toBe(2);
  });
});
