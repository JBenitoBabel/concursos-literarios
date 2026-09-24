import { extractCategories } from './category.extractor';
import { extractPrizeTypes } from './prize-type.extractor';
import { extractDeadline, parseDate } from './deadline.extractor';
import { extractOpenTo } from './open-to.extractor';
import { extractCountry } from './country.extractor';
import { extractAmount } from './amount.extractor';

describe('Extractors - Pure Logic Tests', () => {
  describe('extractCategories', () => {
    it('should detect combined categories "Novela y Poesía"', () => {
      const text = 'BASES - Novela y Poesía. Premio 1000 €.';
      const result = extractCategories(text);
      expect(result).toContain('novela');
      expect(result).toContain('poesia');
    });

    it('should detect combined categories "Poesía y Cuento"', () => {
      const text = 'Poesía y Cuento. Convoca Ayuntamiento.';
      const result = extractCategories(text);
      expect(result).toContain('poesia');
      expect(result).toContain('relato');
    });

    it('should detect individual categories', () => {
      const text = 'Concurso de novela para autores noveles.';
      const result = extractCategories(text);
      expect(result).toContain('novela');
    });

    it('should return ["otro"] when no match', () => {
      const text = 'Concurso de fotografía digital.';
      const result = extractCategories(text);
      expect(result).toEqual(['otro']);
    });

    it('should not duplicate categories', () => {
      const text = 'Novela y Poesía. También novela.';
      const result = extractCategories(text);
      const novelaCount = result.filter((c) => c === 'novela').length;
      expect(novelaCount).toBe(1);
    });
  });

  describe('extractPrizeTypes', () => {
    it('should detect "dinero" from € amounts', () => {
      const text = 'Premio de 1.500 € para el ganador.';
      const result = extractPrizeTypes(text);
      expect(result).toContain('dinero');
    });

    it('should detect "dinero" from "premio en metálico"', () => {
      const text = 'Premio en metálico de 5000 euros.';
      const result = extractPrizeTypes(text);
      expect(result).toContain('dinero');
    });

    it('should detect "publicacion" from keywords', () => {
      const text = 'Se otorga publicación en editorial reconocida.';
      const result = extractPrizeTypes(text);
      expect(result).toContain('publicacion');
    });

    it('should detect "becas" from beca/residencia', () => {
      const text = 'Beca de residencia en Madrid por 3 meses.';
      const result = extractPrizeTypes(text);
      expect(result).toContain('becas');
    });

    it('should detect "reconocimiento" from trofeo/placa', () => {
      const text = 'Trofeo y diploma para los finalistas.';
      const result = extractPrizeTypes(text);
      expect(result).toContain('reconocimiento');
    });

    it('should return ["otro"] when none match', () => {
      const text = 'Concurso sin premio económico.';
      const result = extractPrizeTypes(text);
      expect(result).toEqual(['otro']);
    });
  });

  describe('extractDeadline', () => {
    it('should parse dd/mm/yyyy from "plazo: 15/03/2027"', () => {
      const text = 'Plazo: 15/03/2027. Bases completas en web.';
      const result = extractDeadline(text);
      expect(result).toEqual(new Date(2027, 2, 15));
    });

    it('should parse dd-mm-yyyy', () => {
      const text = 'Fecha límite 30-06-2027.';
      const result = extractDeadline(text);
      expect(result).toEqual(new Date(2027, 5, 30));
    });

    it('should ignore past dates', () => {
      const text = 'Plazo 01/01/2020 (ya pasó).';
      const result = extractDeadline(text);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no valid future date', () => {
      const text = 'Sin fecha límite especificada.';
      const result = extractDeadline(text);
      expect(result).toBeUndefined();
    });

    it('should parse single colon date from real RSS BASES format as deadline', () => {
      const text = 'BASES - (01:10:2026 / Teatro / 6.000 euros / Abierto a: sin restricciones)';
      const result = extractDeadline(text);
      expect(result).toEqual(new Date(2026, 9, 1));
    });

    it('should take the LAST colon date when BASES has two dates', () => {
      const text = 'BASES - (15:03:2024 / 30:04:2024). Premio en metálico.';
      const result = extractDeadline(text);
      expect(result).toEqual(new Date(2024, 3, 30));
    });

    it('should keep past BASES dates so the UI can show "Cerrado"', () => {
      const text = 'BASES - (01:01:2020 / Teatro / 300 euros / Abierto a: sin restricciones)';
      const result = extractDeadline(text);
      expect(result).toEqual(new Date(2020, 0, 1));
    });
  });

  describe('extractOpenTo', () => {
    it('should extract "sin restricciones" closing at parenthesis', () => {
      const text = 'BASES - (01:10:2026 / Teatro / 6.000 euros / Abierto a: sin restricciones)';
      const result = extractOpenTo(text);
      expect(result).toBe('sin restricciones');
    });

    it('should extract free text and collapse whitespace', () => {
      const text = 'BASES - (25:09:2026 / Premio / Abierto a:  mayores   de edad\nresidentes en España)';
      const result = extractOpenTo(text);
      expect(result).toBe('mayores de edad');
    });

    it('should return undefined when "Abierto a" is missing', () => {
      const text = 'BASES - (01:10:2026 / Teatro / 6.000 euros)';
      const result = extractOpenTo(text);
      expect(result).toBeUndefined();
    });
  });

  describe('extractCountry', () => {
    it('should extract trailing "(España)" from title', () => {
      const result = extractCountry('XXII CERTAMEN DE TEATRO 2026 (España)');
      expect(result).toBe('España');
    });

    it('should extract trailing "(Argentina)" from title', () => {
      const result = extractCountry('PREMIO MARÍA ELENA WALSH (Argentina)');
      expect(result).toBe('Argentina');
    });

    it('should return undefined when title has no trailing parentheses', () => {
      const result = extractCountry('Concurso sin país en el título');
      expect(result).toBeUndefined();
    });
  });

  describe('parseDate', () => {
    it('should parse dd/mm/yyyy', () => {
      const result = parseDate('15/03/2024');
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should parse dd-mm-yyyy', () => {
      const result = parseDate('30-06-2024');
      expect(result).toEqual(new Date(2024, 5, 30));
    });

    it('should handle 2-digit year (24 -> 2024)', () => {
      const result = parseDate('15/03/24');
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should return null for invalid', () => {
      const result = parseDate('not-a-date');
      expect(result).toBeNull();
    });
  });

  describe('extractAmount', () => {
    it('should extract "1.500 €"', () => {
      const text = 'Premio: 1.500 €.';
      const result = extractAmount(text);
      expect(result).toBe('1.500 €');
    });

    it('should extract "30000€"', () => {
      const text = 'Dotación de 30000€.';
      const result = extractAmount(text);
      expect(result).toBe('30000€');
    });

    it('should return undefined when no amount', () => {
      const text = 'Solo diploma y reconocimiento.';
      const result = extractAmount(text);
      expect(result).toBeUndefined();
    });
  });
});
