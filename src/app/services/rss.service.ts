import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Contest } from '../models/contest.model';

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

    // Extract date from BASES line: "BASES - (25:09:2026 / ...)"
    const basesMatch = entry.match(/BASES\s*-\s*\((\d{2}:\d{2}:\d{4})/);
    let pubDate: Date;
    if (basesMatch) {
      const [day, month, year] = basesMatch[1].split(':').map(Number);
      pubDate = new Date(year, month - 1, day);
    } else {
      const pubTimeMatch = entry.match(/Published Time:\s*([^\n]+)/);
      pubDate = pubTimeMatch ? new Date(pubTimeMatch[1].trim()) : new Date();
    }

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
      startDate: parsed.startDate,
      organizer: parsed.organizer,
      amount: parsed.amount,
      genre: parsed.genre,
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
      startDate: parsed.startDate,
      organizer: parsed.organizer,
      amount: parsed.amount,
      genre: parsed.genre,
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

    const categories = this.extractCategories(text);
    const prizeTypes = this.extractPrizeTypes(text);
    const deadline = this.extractDeadline(text);
    const startDate = this.extractStartDate(text);
    const organizer = this.extractOrganizer(text);
    const amount = this.extractAmount(text);
    const genre = this.extractGenre(text);
    const cleanDescription = this.cleanDescription(text);

    return {
      categories,
      prizeTypes,
      deadline,
      startDate,
      organizer,
      amount,
      genre,
      cleanDescription
    };
  }

  private extractCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    // First, check for combined categories (e.g., "Narrativa y Poesía", "Poesía y Cuento")
    const combinedPatterns: Array<{ pattern: RegExp; cats: string[] }> = [
      { pattern: /(narrativa|novela)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['novela', 'poesia'] },
      { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(narrativa|novela)/i, cats: ['poesia', 'novela'] },
      { pattern: /(narrativa|novela)\s+y\s+(cuento|relato|microrrelato)/i, cats: ['novela', 'relato'] },
      { pattern: /(cuento|relato|microrrelato)\s+y\s+(narrativa|novela)/i, cats: ['relato', 'novela'] },
      { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(cuento|relato|microrrelato)/i, cats: ['poesia', 'relato'] },
      { pattern: /(cuento|relato|microrrelato)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['relato', 'poesia'] },
      { pattern: /(teatro|dramaturgia)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['teatro', 'poesia'] },
      { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(teatro|dramaturgia)/i, cats: ['poesia', 'teatro'] },
      { pattern: /(ensayo)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['ensayo', 'poesia'] },
      { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(ensayo)/i, cats: ['poesia', 'ensayo'] },
      { pattern: /(infantil|juvenil)\s+y\s+(poes[ií]a|poemas|verso)/i, cats: ['infantil', 'poesia'] },
      { pattern: /(poes[ií]a|poemas|verso)\s+y\s+(infantil|juvenil)/i, cats: ['poesia', 'infantil'] },
    ];

    for (const { pattern, cats } of combinedPatterns) {
      if (pattern.test(lowerText)) {
        cats.forEach(cat => {
          if (!categories.includes(cat)) categories.push(cat);
        });
      }
    }

    // Then check individual categories
    const categoryKeywords: Record<string, string[]> = {
      'poesia': ['poesía', 'poesia', 'poemas', 'verso'],
      'novela': ['novela', 'novelas'],
      'relato': ['relato', 'relatos', 'cuento', 'cuentos', 'narrativa breve'],
      'ensayo': ['ensayo', 'ensayos'],
      'teatro': ['teatro', 'dramaturgia', 'obra de teatro'],
      'infantil': ['infantil', 'juvenil', 'niños', 'jóvenes'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(k => lowerText.includes(k))) {
        if (!categories.includes(cat)) categories.push(cat);
      }
    }

    return categories.length > 0 ? categories : ['otro'];
  }

  private extractPrizeTypes(text: string): string[] {
    const lowerText = text.toLowerCase();
    const types: string[] = [];

    if (lowerText.includes('publicación') || lowerText.includes('publicacion') || lowerText.includes('edición') || lowerText.includes('edicion')) {
      types.push('publicacion');
    }
    if (lowerText.includes('beca') || lowerText.includes('residencia')) {
      types.push('becas');
    }
    if (lowerText.includes('€') || lowerText.includes('eur') || lowerText.includes('dólar') || lowerText.includes('dolar') || lowerText.includes('premio en metálico') || lowerText.includes('premio economico') || /\d+\.?\d*\s*(€|eur|euros)/.test(lowerText)) {
      types.push('dinero');
    }
    if (lowerText.includes('trofeo') || lowerText.includes('placa') || lowerText.includes('diploma') || lowerText.includes('reconocimiento') || lowerText.includes('mención') || lowerText.includes('mencion')) {
      types.push('reconocimiento');
    }

    return types.length > 0 ? types : ['otro'];
  }

  private extractDeadline(text: string): Date | undefined {
    const patterns = [
      /(?:plazo|fecha l[ií]mite|fecha limite|deadline|hasta el|antes del)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const dateStr = match.replace(/.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}).*/, '$1');
          const date = this.parseDate(dateStr);
          if (date && date > new Date()) {
            return date;
          }
        }
      }
    }

    return undefined;
  }

  private extractStartDate(text: string): Date | undefined {
    // Extract from BASES format: "BASES - (DD:MM:YYYY / DD:MM:YYYY)" - first date is start
    const basesMatch = text.match(/BASES\s*-\s*\((\d{2}:\d{2}:\d{4})/);
    if (basesMatch) {
      const [day, month, year] = basesMatch[1].split(':').map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
    return undefined;
  }

  private parseDate(str: string): Date | null {
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  }

  private extractOrganizer(text: string): string | undefined {
    const patterns = [
      /(?:convoca|organiza|convocante|promueve)[:\s]*([^.\n]+)/i,
      /(?:ayuntamiento|diputación|diputacion|fundación|fundacion|universidad|editorial|instituto|centro|asociación|asociacion)[^.\n]*/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1]?.trim() || match[0]?.trim();
    }
    return undefined;
  }

  private extractAmount(text: string): string | undefined {
    const match = text.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|euros|eur|dólares|dolares|\$))/i);
    return match ? match[1] : undefined;
  }

  private extractGenre(text: string): string[] {
    const genres: string[] = [];
    const lowerText = text.toLowerCase();

    const genreKeywords = [
      'fantasía', 'fantasia', 'ciencia ficción', 'ciencia ficcion', 'terror', 'misterio',
      'romántica', 'romantica', 'histórica', 'historica', 'negra', 'policíaca', 'policiaca',
      'humor', 'realismo', 'experimental', 'lírica', 'lorica', 'épica', 'epica'
    ];

    for (const genre of genreKeywords) {
      if (lowerText.includes(genre)) {
        genres.push(genre);
      }
    }

    return genres;
  }

  private cleanDescription(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, 300);
  }
}