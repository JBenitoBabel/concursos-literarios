import { EscritoresParser } from './escritores.parser';

const XML_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Escritores - Concursos</title>
    <item>
      <title>XII Concurso de Novela 2027</title>
      <link>https://www.escritores.org/concursos/novela-2027/</link>
      <description>Concurso de novela. Plazo: 31/12/2027. Premio de 500 €.</description>
      <pubDate>Sun, 20 Sep 2026 09:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

const JINA_MARKDOWN = `Title: Concursos literarios
URL Source: https://www.escritores.org/concursos/
Markdown Content:

### [XII Concurso de Poesía Internacional](https://www.escritores.org/concursos/poesia-2027/)
Published Time: 2026-09-18T10:30:00.000Z
https://www.escritores.org/concursos/poesia-2027/
BASES - Concurso de poesía. Premio de 1.000 euros. Plazo: 15/12/2027.
`;

describe('EscritoresParser', () => {
  const parser = new EscritoresParser();

  it('parsea el feed XML mínimo', () => {
    const [contest] = parser.parse(XML_FEED);
    expect(contest).toBeDefined();
    expect(contest.title).toBe('XII Concurso de Novela 2027');
    expect(contest.link).toBe('https://www.escritores.org/concursos/novela-2027/');
    expect(contest.source).toBe('escritores');
  });

  it('extrae categorías y deadline de la description XML', () => {
    const [contest] = parser.parse(XML_FEED);
    expect(contest.categories).toContain('novela');
    expect(contest.deadline).toEqual(new Date(2027, 11, 31));
    expect(contest.pubDate).toBeInstanceOf(Date);
  });

  it('parsea el fallback Jina (### [Title](url) + BASES -)', () => {
    const [contest] = parser.parse(JINA_MARKDOWN);
    expect(contest).toBeDefined();
    expect(contest.title).toBe('XII Concurso de Poesía Internacional');
    expect(contest.link).toBe('https://www.escritores.org/concursos/poesia-2027/');
    expect(contest.source).toBe('escritores');
    expect(contest.categories).toContain('poesia');
    expect(contest.deadline).toEqual(new Date(2027, 11, 15));
    expect(contest.pubDate).toEqual(new Date('2026-09-18T10:30:00.000Z'));
    expect(contest.description).toContain('BASES - Concurso de poesía');
  });

  it('devuelve [] con contenido no parseable', () => {
    expect(parser.parse('<rss><channel></rss>')).toEqual([]);
  });
});
