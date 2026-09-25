import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError, catchError, mergeMap } from 'rxjs';
import { Contest } from '../models/contest.model';
import { FEED_SOURCES, FeedSource } from '../data/config/feed-sources';
import { PARSERS } from '../data/services/parsers/parser-registry';
import { dedupeContests } from '../data/services/dedup';

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://r.jina.ai/https://',
];

@Injectable({
  providedIn: 'root'
})
export class RssService {
  private http = inject(HttpClient);

  fetchContests(): Observable<Contest[]> {
    const requests$ = FEED_SOURCES.map(source =>
      this.fetchSource(source).pipe(
        catchError((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[RSS] Fuente caída: ${source.id} — ${message}`);
          return of(null);
        })
      )
    );

    return forkJoin(requests$).pipe(
      mergeMap(results => {
        if (results.every(result => result === null)) {
          return throwError(() => new Error('[RSS] Las 4 fuentes fallaron'));
        }
        return of(this.combine(results));
      })
    );
  }

  private fetchSource(source: FeedSource): Observable<string> {
    if (!source.useProxy) {
      return this.http.get(source.url, { responseType: 'text' });
    }
    return this.tryProxies(source, 0);
  }

  private tryProxies(source: FeedSource, index: number): Observable<string> {
    if (index >= CORS_PROXIES.length) {
      return throwError(() => new Error(`sin respuesta tras ${index} proxies`));
    }

    const proxy = CORS_PROXIES[index];
    const url = proxy.startsWith('https://r.jina.ai/')
      ? `${proxy}${source.url}`
      : `${proxy}${encodeURIComponent(source.url)}`;

    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(() => this.tryProxies(source, index + 1))
    );
  }

  private combine(results: (string | null)[]): Contest[] {
    const counts = new Map<string, number>();
    const contests: Contest[] = [];

    FEED_SOURCES.forEach((source, index) => {
      const content = results[index];
      if (content === null) {
        counts.set(source.id, -1);
        return;
      }
      const parsed = PARSERS[source.id].parse(content);
      counts.set(source.id, parsed.length);
      contests.push(...parsed);
    });

    const deduped = dedupeContests(contests);
    const summary = FEED_SOURCES
      .map(source => {
        const count = counts.get(source.id);
        return `${source.id}=${count === -1 ? 'falló' : count}`;
      })
      .join(', ');
    console.log(`[RSS] conteos por fuente: ${summary} → total ${contests.length}, tras dedup ${deduped.length}`);

    return deduped;
  }
}
