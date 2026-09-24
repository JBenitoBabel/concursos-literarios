import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Contest } from '../models/contest.model';
import { extractCategories } from '../data/extractors/category.extractor';
import { extractPrizeTypes } from '../data/extractors/prize-type.extractor';
import { extractDeadline } from '../data/extractors/deadline.extractor';
import { extractOrganizer } from '../data/extractors/organizer.extractor';
import { extractAmount } from '../data/extractors/amount.extractor';
import { extractOpenTo } from '../data/extractors/open-to.extractor';
import { extractCountry } from '../data/extractors/country.extractor';
import { cleanDescription } from '../data/extractors/description-cleaner';

@Injectable({
  providedIn: 'root'
})
export class RssService {
  private http = inject(HttpClient);
  private readonly RSS_URL = 'https://www.escritores.org/recursos/escritores.xml';
  private readonly CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?url=',
    'https://r.jina.ai/http://',
    'https://r.jina.ai/https://'
  ];

  fetchContests(): Observable<Contest[]> {
    return this.tryProxies(0);
  }

  private tryProxies(index: number): Observable<Contest[]> {
    if (index >= this.CORS_PROXIES.length) {
      console.error('[RSS] All CORS proxies failed');
      return of([]);
    }

    const proxy = this.CORS_PROXIES[index];
    const url = proxy.startsWith('https://r.jina.ai/') 
      ? `${proxy}${this.RSS_URL}` 
      : `${proxy}${encodeURIComponent(this.RSS_URL)}`;

    console.log(`[RSS] Trying proxy ${index}: ${proxy}`);
    console.log(`[RSS] Full URL: ${url}`);

    return this.http.get(url, { responseType: 'text' }).pipe(
      map(xml => {
        console.log(`[RSS] Proxy ${index} success! Response length: ${xml.length}`);
        console.log(`[RSS] First 500 chars: ${xml.substring(0, 500)}`);
        return this.parseRSS(xml);
      }),
      catchError(error => {
        console.warn(`[RSS] Proxy ${index} failed:`, error.message || error);
        return this.tryProxies(index + 1);
      })
    );
  }

  private parseRSS(content: string): Contest[] {
    // Check if it's Jina AI markdown format
    if (content.includes('Markdown Content:') && content.includes('URL Source:')) {
      console.log('[RSS] Detected Jina AI markdown format, parsing...');
      return this.parseJinaMarkdown(content);
    }

    console.log('[RSS] Parsing XML...');
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    
    // Check for parser errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('[RSS] XML Parse error:', parseError.textContent);
      return [];
    }

    const items = doc.querySelectorAll('item');
    console.log(`[RSS] Found ${items.length} <item> elements`);

    // Log first item raw for debugging
    if (items.length > 0) {
      const firstItem = items[0];
      console.log('[RSS] First item raw XML:', firstItem.outerHTML.substring(0, 1000));
    }

    const contests: Contest[] = [];

    items.forEach((item, idx) => {
      const contest = this.parseContestItem(item);
      if (contest) {
        contests.push(contest);
      } else {
        console.warn(`[RSS] Item ${idx} returned null`);
      }
    });

    console.log(`[RSS] Successfully parsed ${contests.length} contests`);
    return contests;
  }

  private parseJinaMarkdown(markdown: string): Contest[] {
    const contests: Contest[] = [];
    
    // Split by "### [" which marks each contest entry in Jina AI format
    const entries = markdown.split(/###\s*\[/);
    
    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const contest = this.parseJinaEntry(entry);
      if (contest) {
        contests.push(contest);
      }
    }

    console.log(`[RSS] Successfully parsed ${contests.length} contests from Jina AI markdown`);
    return contests;
  }

  private parseJinaEntry(entry: string): Contest | null {
    // Extract title and link from first line: "TITLE](URL)"
    const titleLinkMatch = entry.match(/^([^\]]+)\]\(([^)]+)\)/);
    if (!titleLinkMatch) return null;
    
    const title = titleLinkMatch[1].trim();
    const link = titleLinkMatch[2].trim();

    const pubTimeMatch = entry.match(/Published Time:\s*([^\n]+)/);
    const pubDate = pubTimeMatch ? new Date(pubTimeMatch[1].trim()) : new Date();

    // Extract content after "BASES - " or the main description
    const basesContentMatch = entry.match(/BASES\s*-\s*[^\n]+/);
    const description = basesContentMatch ? basesContentMatch[0].trim() : entry.substring(0, 300);

    const rawDescription = description;
    const parsed = this.extractContestInfo(rawDescription);

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
      rawDescription
    };
  }

  private parseContestItem(item: Element): Contest | null {
    const title = this.getTextContent(item, 'title');
    const link = this.getTextContent(item, 'link');
    const description = this.getTextContent(item, 'description') || this.getTextContent(item, 'content:encoded');
    const pubDate = this.getTextContent(item, 'pubDate');
    const categories = this.getCategories(item);

    console.log(`[RSS] Parsing item: title="${title?.substring(0, 50)}", link="${link}", hasDescription=${!!description}, pubDate="${pubDate}"`);

    if (!title || !link) {
      console.warn('[RSS] Skipping item - missing title or link');
      return null;
    }

    const rawDescription = description || '';
    const parsed = this.extractContestInfo(rawDescription);

    return {
      title: title.trim(),
      link: link.trim(),
      description: parsed.cleanDescription,
      pubDate: pubDate ? new Date(pubDate) : new Date(),
      categories: parsed.categories.length > 0 ? parsed.categories : categories.length > 0 ? categories : ['otro'],
      prizeTypes: parsed.prizeTypes,
      deadline: parsed.deadline,
      organizer: parsed.organizer,
      amount: parsed.amount,
      openTo: parsed.openTo,
      country: extractCountry(title),
      rawDescription
    };
  }

  private getTextContent(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }

  private getCategories(item: Element): string[] {
    const categories: string[] = [];
    const categoryElements = item.querySelectorAll('category');
    categoryElements.forEach(el => {
      const text = el.textContent?.trim().toLowerCase();
      if (text) categories.push(text);
    });
    return categories;
  }

  private extractContestInfo(html: string) {
    const cleanHtml = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const text = cleanHtml;

    const categories = extractCategories(text);
    const prizeTypes = extractPrizeTypes(text);
    const deadline = extractDeadline(text);
    const organizer = extractOrganizer(text);
    const amount = extractAmount(text);
    const openTo = extractOpenTo(text);
    const cleanDesc = cleanDescription(text);

    return {
      categories,
      prizeTypes,
      deadline,
      organizer,
      amount,
      openTo,
      cleanDescription: cleanDesc
    };
  }
}
