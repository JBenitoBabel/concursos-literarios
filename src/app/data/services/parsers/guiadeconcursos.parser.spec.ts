import { GuiadeconcursosParser } from './guiadeconcursos.parser';

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Guía de Concursos</title>
    <item>
      <title>Concurso de Relato Corto – 1.500€</title>
      <link>https://www.guiadeconcursos.com/concursos/relato-corto/</link>
      <description>Participa en el concurso de relato corto abierto […]</description>
      <category>Cuento-Relato</category>
      <category>Por email-online</category>
      <category>certamen local</category>
      <pubDate>Tue, 22 Sep 2026 08:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

describe('GuiadeconcursosParser', () => {
  const parser = new GuiadeconcursosParser();

  it('extrae el importe del título', () => {
    const [first] = parser.parse(RSS);
    expect(first.amount).toBe('1.500€');
  });

  it('mapea categorías y descarta ruido y tags libres en minúscula', () => {
    const [first] = parser.parse(RSS);
    expect(first.categories).toEqual(['relato']);
  });

  it('recorta la description en el marcador […]', () => {
    const [first] = parser.parse(RSS);
    expect(first.description).toBe('Participa en el concurso de relato corto abierto');
    expect(first.description).not.toContain('[…]');
  });

  it('asigna source guiadeconcursos', () => {
    const [first] = parser.parse(RSS);
    expect(first.source).toBe('guiadeconcursos');
    expect(first.link).toBe('https://www.guiadeconcursos.com/concursos/relato-corto/');
  });

  it('devuelve [] con XML malformado', () => {
    expect(parser.parse('<rss><channel></rss>')).toEqual([]);
  });
});
