import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RssService } from './rss.service';

describe('RSS Parser - Pure Logic Tests', () => {
  let service: RssService;
  // Acceso a métodos privados para testear la lógica real del servicio
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logic: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(RssService);
    logic = service as unknown as Record<string, (...args: unknown[]) => unknown>;
  });

  describe('extractCategories', () => {
    it('should detect combined categories "Novela y Poesía"', () => {
      const text = 'BASES - Novela y Poesía. Premio 1000 €.';
      const result = logic.extractCategories(text) as string[];
      expect(result).toContain('novela');
      expect(result).toContain('poesia');
    });

    it('should detect combined categories "Poesía y Cuento"', () => {
      const text = 'Poesía y Cuento. Convoca Ayuntamiento.';
      const result = logic.extractCategories(text) as string[];
      expect(result).toContain('poesia');
      expect(result).toContain('relato');
    });

    it('should detect individual categories', () => {
      const text = 'Concurso de novela para autores noveles.';
      const result = logic.extractCategories(text) as string[];
      expect(result).toContain('novela');
    });

    it('should return ["otro"] when no match', () => {
      const text = 'Concurso de fotografía digital.';
      const result = logic.extractCategories(text) as string[];
      expect(result).toEqual(['otro']);
    });

    it('should not duplicate categories', () => {
      const text = 'Novela y Poesía. También novela.';
      const result = logic.extractCategories(text) as string[];
      const novelaCount = result.filter((c: string) => c === 'novela').length;
      expect(novelaCount).toBe(1);
    });
  });

  describe('extractPrizeTypes', () => {
    it('should detect "dinero" from € amounts', () => {
      const text = 'Premio de 1.500 € para el ganador.';
      const result = logic.extractPrizeTypes(text) as string[];
      expect(result).toContain('dinero');
    });

    it('should detect "dinero" from "premio en metálico"', () => {
      const text = 'Premio en metálico de 5000 euros.';
      const result = logic.extractPrizeTypes(text) as string[];
      expect(result).toContain('dinero');
    });

    it('should detect "publicacion" from keywords', () => {
      const text = 'Se otorga publicación en editorial reconocida.';
      const result = logic.extractPrizeTypes(text) as string[];
      expect(result).toContain('publicacion');
    });

    it('should detect "becas" from beca/residencia', () => {
      const text = 'Beca de residencia en Madrid por 3 meses.';
      const result = logic.extractPrizeTypes(text) as string[];
      expect(result).toContain('becas');
    });

    it('should detect "reconocimiento" from trofeo/placa', () => {
      const text = 'Trofeo y diploma para los finalistas.';
      const result = logic.extractPrizeTypes(text) as string[];
      expect(result).toContain('reconocimiento');
    });

    it('should return ["otro"] when none match', () => {
      const text = 'Concurso sin premio económico.';
      const result = logic.extractPrizeTypes(text) as string[];
      expect(result).toEqual(['otro']);
    });
  });

  describe('extractDeadline', () => {
    it('should parse dd/mm/yyyy from "plazo: 15/03/2027"', () => {
      const text = 'Plazo: 15/03/2027. Bases completas en web.';
      const result = logic.extractDeadline(text) as Date | undefined;
      expect(result).toEqual(new Date(2027, 2, 15));
    });

    it('should parse dd-mm-yyyy', () => {
      const text = 'Fecha límite 30-06-2027.';
      const result = logic.extractDeadline(text) as Date | undefined;
      expect(result).toEqual(new Date(2027, 5, 30));
    });

    it('should ignore past dates', () => {
      const text = 'Plazo 01/01/2020 (ya pasó).';
      const result = logic.extractDeadline(text) as Date | undefined;
      expect(result).toBeUndefined();
    });

    it('should return undefined when no valid future date', () => {
      const text = 'Sin fecha límite especificada.';
      const result = logic.extractDeadline(text) as Date | undefined;
      expect(result).toBeUndefined();
    });
  });

  describe('parseDate', () => {
    it('should parse dd/mm/yyyy', () => {
      const result = logic.parseDate('15/03/2024') as Date | null;
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should parse dd-mm-yyyy', () => {
      const result = logic.parseDate('30-06-2024') as Date | null;
      expect(result).toEqual(new Date(2024, 5, 30));
    });

    it('should handle 2-digit year (24 -> 2024)', () => {
      const result = logic.parseDate('15/03/24') as Date | null;
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should return null for invalid', () => {
      const result = logic.parseDate('not-a-date') as Date | null;
      expect(result).toBeNull();
    });
  });

  describe('extractAmount', () => {
    it('should extract "1.500 €"', () => {
      const text = 'Premio: 1.500 €.';
      const result = logic.extractAmount(text) as string | undefined;
      expect(result).toBe('1.500 €');
    });

    it('should extract "30000€"', () => {
      const text = 'Dotación de 30000€.';
      const result = logic.extractAmount(text) as string | undefined;
      expect(result).toBe('30000€');
    });

    it('should return undefined when no amount', () => {
      const text = 'Solo diploma y reconocimiento.';
      const result = logic.extractAmount(text) as string | undefined;
      expect(result).toBeUndefined();
    });
  });
});
