import { Contest } from '../../../models/contest.model';
import { SourceParser } from './source-parser.interface';
import { parseXml, getRssItems, getTextContent, getRssCategories, stripTags } from './xml-utils';
import { isJinaMarkdown, parseJinaEntries, jinaEntryBody } from './jina-utils';
import { mapSourceCategory, PRIZE_REGEX } from '../../config/contest-keywords';
import { extractAmount } from '../../extractors/amount.extractor';
import { extractDeadline } from '../../extractors/deadline.extractor';
import { extractCategories } from '../../extractors/category.extractor';
import { extractPrizeTypes } from '../../extractors/prize-type.extractor';
import { cleanDescription } from '../../extractors/description-cleaner';

const TRUNCATION_MARKERS = ['[…]', '[...]', '&hellip;', '&#8230;'];

export class GuiadeconcursosParser implements SourceParser {
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
    const title = getTextContent(item, 'title');
    const link = getTextContent(item, 'link');
    const rawDescription = getTextContent(item, 'description') || getTextContent(item, 'content:encoded');
    const pubDate = getTextContent(item, 'pubDate');

    if (!title || !link) {
      return null;
    }

    const description = cleanDescription(this.truncate(rawDescription));
    const text = stripTags(rawDescription);

    return {
      title,
      link,
      description,
      pubDate: pubDate ? new Date(pubDate) : new Date(),
      categories: this.mapCategories(getRssCategories(item)),
      prizeTypes: extractPrizeTypes(`${title} ${text}`),
      deadline: extractDeadline(`${title} ${text}`),
      amount: this.extractAmount(title),
      rawDescription,
      source: 'guiadeconcursos',
    };
  }

  private truncate(text: string): string {
    const stripped = stripTags(text);
    const index = TRUNCATION_MARKERS
      .map(marker => stripped.indexOf(marker))
      .filter(position => position >= 0)
      .sort((a, b) => a - b)[0];
    return index === undefined ? stripped : stripped.substring(0, index);
  }

  private extractAmount(title: string): string | undefined {
    const match = title.match(PRIZE_REGEX.dinero);
    if (match) {
      return match[0].trim();
    }
    return extractAmount(title);
  }

  private mapCategories(rawCategories: string[]): string[] {
    const mapped = new Set<string>();
    for (const raw of rawCategories) {
      const category = mapSourceCategory('guiadeconcursos', raw);
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
        categories: extractCategories(entry.title),
        prizeTypes: extractPrizeTypes(entry.title),
        amount: this.extractAmount(entry.title),
        rawDescription: description,
        source: 'guiadeconcursos',
      };
      return contest;
    });
  }
}
