export function parseXml(content: string): Document | null {
  const doc = new DOMParser().parseFromString(content, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return null;
  }
  return doc;
}

export function getRssItems(doc: Document): Element[] {
  return Array.from(doc.querySelectorAll('item'));
}

export function getTextContent(parent: Element | Document, tagName: string): string {
  const element = parent.getElementsByTagName(tagName)[0];
  return element?.textContent?.trim() || '';
}

export function getRssCategories(item: Element): string[] {
  const categories: string[] = [];
  const elements = item.getElementsByTagName('category');
  for (let i = 0; i < elements.length; i++) {
    const text = elements[i].textContent?.trim().toLowerCase();
    if (text) {
      categories.push(text);
    }
  }
  return categories;
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
