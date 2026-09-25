import { Contest } from '../../../models/contest.model';
import { SourceParser } from './source-parser.interface';
import { mapSourceCategory } from '../../config/contest-keywords';
import { extractPrizeTypes } from '../../extractors/prize-type.extractor';
import { parseDate } from '../../extractors/deadline.extractor';
import { cleanDescription } from '../../extractors/description-cleaner';

interface LetrasEspanolasItem {
  titulo?: unknown;
  url?: unknown;
  descripcion?: unknown;
  fecha_limite?: unknown;
  organizacion?: unknown;
  pais?: unknown;
  premio?: unknown;
  categoria?: unknown;
}

export class LetrasEspanolasParser implements SourceParser {
  parse(content: string): Contest[] {
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    const contests: Contest[] = [];
    for (const entry of data) {
      const contest = this.parseItem(entry);
      if (contest) {
        contests.push(contest);
      }
    }
    return contests;
  }

  private parseItem(entry: unknown): Contest | null {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const item = entry as LetrasEspanolasItem;
    const title = this.asString(item.titulo).trim();
    const link = this.asString(item.url).trim();
    if (!title || !link) {
      return null;
    }

    const description = this.asString(item.descripcion);
    const amount = this.asString(item.premio).trim() || undefined;
    const organizer = this.asString(item.organizacion).trim();

    const contest: Contest = {
      title,
      link,
      description: cleanDescription(description),
      pubDate: new Date(),
      categories: this.mapCategories(this.asString(item.categoria)),
      prizeTypes: extractPrizeTypes(`${amount ?? ''} ${description}`),
      deadline: this.parseDeadline(this.asString(item.fecha_limite)),
      organizer: organizer && organizer !== 'No especificada' ? organizer : undefined,
      amount,
      country: this.asString(item.pais).trim() || undefined,
      rawDescription: description,
      source: 'letrasespanolas',
    };
    return contest;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private parseDeadline(value: string): Date | undefined {
    const date = parseDate(value.trim());
    return date ?? undefined;
  }

  private mapCategories(categoria: string): string[] {
    const mapped = new Set<string>();
    for (const raw of categoria.split('|')) {
      const category = mapSourceCategory('letrasespanolas', raw);
      if (category) {
        mapped.add(category);
      }
    }
    return mapped.size > 0 ? Array.from(mapped) : ['otro'];
  }
}
