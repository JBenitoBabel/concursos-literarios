import { LetrasEspanolasParser } from './letrasespanolas.parser';

const FEED = JSON.stringify([
  {
    titulo: 'Certamen Internacional de Relato Corto',
    url: 'https://www.ejemplo.org/certamen-relato',
    descripcion: 'Certamen abierto a autores de todo el mundo',
    fecha_limite: '23/10/2027',
    organizacion: 'No especificada',
    pais: 'España',
    premio: '1.000 euros',
    categoria: 'Relato corto|Poesia',
  },
  {
    titulo: 'Premio de Novela Juvenil',
    url: 'https://www.ejemplo.org/premio-novela',
    descripcion: 'Premio de novela para jóvenes escritores',
    fecha_limite: '31/12/2027',
    organizacion: 'Fundación Letras',
    pais: 'México',
    premio: '5.000 €',
    categoria: 'Novela',
  },
  {
    titulo: 'Concurso sin enlace',
    descripcion: 'Debe ignorarse',
    categoria: 'Poesia',
  },
]);

describe('LetrasEspanolasParser', () => {
  const parser = new LetrasEspanolasParser();

  it('parsea el array y descarta los items sin título o enlace', () => {
    const result = parser.parse(FEED);
    expect(result.length).toBe(2);
    expect(result[0].source).toBe('letrasespanolas');
    expect(result[0].title).toBe('Certamen Internacional de Relato Corto');
  });

  it('divide categoria por |', () => {
    const result = parser.parse(FEED);
    expect(result[0].categories).toEqual(['relato', 'poesia']);
    expect(result[1].categories).toEqual(['novela']);
  });

  it('convierte fecha_limite dd/mm/yyyy en deadline', () => {
    const [first, second] = parser.parse(FEED);
    expect(first.deadline).toEqual(new Date(2027, 9, 23));
    expect(second.deadline).toEqual(new Date(2027, 11, 31));
  });

  it('interpreta "No especificada" como organizacion ausente', () => {
    const [first, second] = parser.parse(FEED);
    expect(first.organizer).toBeUndefined();
    expect(second.organizer).toBe('Fundación Letras');
  });

  it('extrae premio y país', () => {
    const [first] = parser.parse(FEED);
    expect(first.amount).toBe('1.000 euros');
    expect(first.country).toBe('España');
  });

  it('asigna un pubDate válido', () => {
    const [first] = parser.parse(FEED);
    expect(first.pubDate).toBeInstanceOf(Date);
    expect(isNaN(first.pubDate.getTime())).toBe(false);
  });

  it('devuelve [] con JSON inválido', () => {
    expect(parser.parse('esto no es json {')).toEqual([]);
  });

  it('devuelve [] si el JSON no es un array', () => {
    expect(parser.parse('{"titulo":"x"}')).toEqual([]);
    expect(parser.parse('"cadena"')).toEqual([]);
  });
});
