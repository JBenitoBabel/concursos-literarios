import { LetraliaParser } from './letralia.parser';

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Letralia - Convocatorias</title>
    <item>
      <title>Convocatorias - Letralia</title>
      <link>https://letralia.com/microrrelato-2027</link>
      <description><![CDATA[Concurso Nacional de Microrrelato 2027. Fecha: 23/10/2027. Premio: 1.500 euros. Ámbito: Nacional]]></description>
      <category>Concursos de microrrelato</category>
      <category>Convocatorias en las que se puede participar por internet</category>
      <pubDate>Mon, 21 Sep 2026 10:00:00 +0000</pubDate>
    </item>
    <item>
      <title>Convocatorias - Letralia</title>
      <link>https://letralia.com/prosa-2027</link>
      <description><![CDATA[Concurso de Prosa Viva. Fecha: 15/11/2027. Premio: 600 euros. Ámbito: Regional]]></description>
      <category>Concursos de prosa</category>
      <pubDate>Tue, 22 Sep 2026 10:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

describe('LetraliaParser', () => {
  const parser = new LetraliaParser();

  it('extrae el título real desde la description', () => {
    const contests = parser.parse(RSS);
    expect(contests.length).toBe(2);
    expect(contests[0].title).toBe('Concurso Nacional de Microrrelato 2027');
    expect(contests[1].title).toBe('Concurso de Prosa Viva');
  });

  it('convierte "Fecha:" en deadline', () => {
    const [first] = parser.parse(RSS);
    expect(first.deadline).toEqual(new Date(2027, 9, 23));
  });

  it('extrae el premio completo sin cortar en los decimales', () => {
    const [first] = parser.parse(RSS);
    expect(first.amount).toBe('1.500 euros');
  });

  it('mapea categorías y descarta el ruido', () => {
    const [first] = parser.parse(RSS);
    expect(first.categories).toEqual(['relato']);
  });

  it('mapea "Concursos de prosa" a relato', () => {
    const contests = parser.parse(RSS);
    expect(contests[1].categories).toEqual(['relato']);
    expect(contests[1].deadline).toEqual(new Date(2027, 10, 15));
  });

  it('asigna source letralia y pubDate válida', () => {
    const contests = parser.parse(RSS);
    for (const contest of contests) {
      expect(contest.source).toBe('letralia');
      expect(contest.pubDate).toBeInstanceOf(Date);
      expect(isNaN(contest.pubDate.getTime())).toBe(false);
    }
  });

  it('devuelve [] con XML malformado', () => {
    expect(parser.parse('<rss><channel></rss>')).toEqual([]);
  });
});
