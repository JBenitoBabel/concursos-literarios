import { http, HttpResponse } from 'msw';
import { readFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

export const rssXml = readFileSync(join(FIXTURES_DIR, 'rss-sample.xml'), 'utf-8');
export const jinaMarkdown = readFileSync(join(FIXTURES_DIR, 'jina-sample.md'), 'utf-8');

export const handlers = [
  // Proxy 1: allorigins - returns XML
  http.get('https://api.allorigins.win/raw', ({ request }) => {
    const url = request.url.split('url=')[1];
    if (url?.includes('escritores.org')) {
      return new HttpResponse(rssXml, {
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Proxy 2: corsproxy.io - returns XML
  http.get('https://corsproxy.io/', ({ request }) => {
    const url = request.url.split('url=')[1];
    if (url?.includes('escritores.org')) {
      return new HttpResponse(rssXml, {
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Proxy 3: Jina AI HTTP - returns markdown
  http.get('https://r.jina.ai/http://www.escritores.org/recursos/escritores.xml', () => {
    return new HttpResponse(jinaMarkdown, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }),

  // Proxy 4: Jina AI HTTPS - returns markdown
  http.get('https://r.jina.ai/https://www.escritores.org/recursos/escritores.xml', () => {
    return new HttpResponse(jinaMarkdown, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }),
];

export const errorHandlers = [
  http.get('https://api.allorigins.win/raw', () => new HttpResponse(null, { status: 500 })),
  http.get('https://corsproxy.io/', () => new HttpResponse(null, { status: 500 })),
  http.get('https://r.jina.ai/http://www.escritores.org/recursos/escritores.xml', () => new HttpResponse(null, { status: 500 })),
  http.get('https://r.jina.ai/https://www.escritores.org/recursos/escritores.xml', () => new HttpResponse(null, { status: 500 })),
];
