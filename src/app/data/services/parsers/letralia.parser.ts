import { Contest } from '../../../models/contest.model';
import { SourceParser } from './source-parser.interface';
import { parseXml, getRssItems, getTextContent, getRssCategories, stripTags } from './xml-utils';
import { isJinaMarkdown, parseJinaEntries, jinaEntryBody } from './jina-utils';
import { mapSourceCategory } from '../../config/contest-keywords';
import { extractPrizeTypes } from '../../extractors/prize-type.extractor';
import { parseDate } from '../../extractors/deadline.extractor';
import { cleanDescription } from '../../extractors/description-cleaner';

export class LetraliaParser implements SourceParser {
  parse(content: string): Contest[] {
    if (isJinaMarkdown(content)) {
      return this.parseJinaFallback(content);
    }

    const doc = parseXml(content);
    if (!doc) {
      return [];
    }

    const contests: Contest[] = [];
    getRssItems(doc).forEach(item => {
      const contest = this.parseItem(item);
      if (contest) {
        contests.push(contest);
      }
    });
    return contests;
  }

  private parseItem(item: Element): Contest | null {
    const link = getTextContent(item, 'link');
    const description = getTextContent(item, 'description') || getTextContent(item, 'content:encoded');
    const editorialTitle = getTextContent(item, 'title');
    const pubDate = getTextContent(item, 'pubDate');

    if (!link) {
      return null;
    }

    const text = stripTags(description);
    const title = this.extractRealTitle(text) || editorialTitle || text.substring(0, 100);
    if (!title) {
      return null;
    }

    return {
      title,
      link,
      description: cleanDescription(text),
      pubDate: pubDate ? new Date(pubDate) : new Date(),
      categories: this.mapCategories(getRssCategories(item)),
      prizeTypes: extractPrizeTypes(text),
      deadline: this.extractDeadline(text),
      amount: this.extractAmount(text),
      rawDescription: description,
      source: 'letralia',
    };
  }

  private extractRealTitle(text: string): string {
    const match = text.match(/^(.*?)\.\s*Fecha:/);
    return match ? match[1].trim() : '';
  }

  private extractDeadline(text: string): Date | undefined {
    const match = text.match(/Fecha:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
    if (!match) {
      return undefined;
    }
    return parseDate(match[1]) ?? undefined;
  }

  private extractAmount(text: string): string | undefined {
    const segment = text
      .split(/\.\s+/)
      .map(part => part.trim())
      .find(part => /^Premio:/i.test(part));
    if (!segment) {
      return undefined;
    }
    const value = segment.replace(/^Premio:\s*/i, '').trim();
    return value || undefined;
  }

  private mapCategories(rawCategories: string[]): string[] {
    const mapped = new Set<string>();
    for (const raw of rawCategories) {
      const category = mapSourceCategory('letralia', raw);
      if (category) {
        mapped.add(category);
      }
    }
    return mapped.size > 0 ? Array.from(mapped) : ['otro'];
  }

  private parseJinaFallback(markdown: string): Contest[] {
    return parseJinaEntries(markdown).map(entry => {
      const description = jinaEntryBody(entry.text);
      const contest: Contest = {
        title: entry.title,
        link: entry.link,
        description,
        pubDate: entry.pubDate,
        categories: ['otro'],
        prizeTypes: extractPrizeTypes(description),
        rawDescription: description,
        source: 'letralia',
      };
      return contest;
    });
  }
}
