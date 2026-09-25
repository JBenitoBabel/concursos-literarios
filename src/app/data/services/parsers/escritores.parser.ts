import { Contest } from '../../../models/contest.model';
import { SourceParser } from './source-parser.interface';
import { parseXml, getRssItems, getTextContent, getRssCategories, stripTags } from './xml-utils';
import { isJinaMarkdown, parseJinaEntries } from './jina-utils';
import { extractCategories } from '../../extractors/category.extractor';
import { extractPrizeTypes } from '../../extractors/prize-type.extractor';
import { extractDeadline } from '../../extractors/deadline.extractor';
import { extractOrganizer } from '../../extractors/organizer.extractor';
import { extractAmount } from '../../extractors/amount.extractor';
import { extractOpenTo } from '../../extractors/open-to.extractor';
import { extractCountry } from '../../extractors/country.extractor';
import { cleanDescription } from '../../extractors/description-cleaner';

interface ExtractedInfo {
  categories: string[];
  prizeTypes: string[];
  deadline?: Date;
  organizer?: string;
  amount?: string;
  openTo?: string;
  cleanDescription: string;
}

export class EscritoresParser implements SourceParser {
  parse(content: string): Contest[] {
    if (isJinaMarkdown(content)) {
      return this.parseJinaMarkdown(content);
    }
    return this.parseXmlFeed(content);
  }

  private parseXmlFeed(content: string): Contest[] {
    const doc = parseXml(content);
    if (!doc) {
      return [];
    }

    const contests: Contest[] = [];
    getRssItems(doc).forEach(item => {
      const contest = this.parseContestItem(item);
      if (contest) {
        contests.push(contest);
      }
    });
    return contests;
  }

  private parseJinaMarkdown(markdown: string): Contest[] {
    const contests: Contest[] = [];
    for (const entry of parseJinaEntries(markdown)) {
      const contest = this.parseJinaEntry(entry.text, entry.title, entry.link, entry.pubDate);
      if (contest) {
        contests.push(contest);
      }
    }
    return contests;
  }

  private parseJinaEntry(entry: string, title: string, link: string, pubDate: Date): Contest | null {
    if (!title || !link) {
      return null;
    }

    const basesContentMatch = entry.match(/BASES\s*-\s*[^\n]+/);
    const description = basesContentMatch ? basesContentMatch[0].trim() : entry.substring(0, 300);
    const parsed = this.extractContestInfo(description);

    return {
      title,
      link,
      description: parsed.cleanDescription,
      pubDate,
      categories: parsed.categories,
      prizeTypes: parsed.prizeTypes,
      deadline: parsed.deadline,
      organizer: parsed.organizer,
      amount: parsed.amount,
      openTo: parsed.openTo,
      country: extractCountry(title),
      rawDescription: description,
      source: 'escritores',
    };
  }

  private parseContestItem(item: Element): Contest | null {
    const title = getTextContent(item, 'title');
    const link = getTextContent(item, 'link');
    const description = getTextContent(item, 'description') || getTextContent(item, 'content:encoded');
    const pubDate = getTextContent(item, 'pubDate');
    const rssCategories = getRssCategories(item);

    if (!title || !link) {
      return null;
    }

    const rawDescription = description || '';
    const parsed = this.extractContestInfo(rawDescription);

    return {
      title: title.trim(),
      link: link.trim(),
      description: parsed.cleanDescription,
      pubDate: pubDate ? new Date(pubDate) : new Date(),
      categories: parsed.categories.length > 0 ? parsed.categories : rssCategories.length > 0 ? rssCategories : ['otro'],
      prizeTypes: parsed.prizeTypes,
      deadline: parsed.deadline,
      organizer: parsed.organizer,
      amount: parsed.amount,
      openTo: parsed.openTo,
      country: extractCountry(title),
      rawDescription,
      source: 'escritores',
    };
  }

  private extractContestInfo(html: string): ExtractedInfo {
    const text = stripTags(html);

    return {
      categories: extractCategories(text),
      prizeTypes: extractPrizeTypes(text),
      deadline: extractDeadline(text),
      organizer: extractOrganizer(text),
      amount: extractAmount(text),
      openTo: extractOpenTo(text),
      cleanDescription: cleanDescription(text),
    };
  }
}
