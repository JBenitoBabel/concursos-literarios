export function isJinaMarkdown(content: string): boolean {
  return content.includes('Markdown Content:') && content.includes('URL Source:');
}

export interface JinaEntry {
  title: string;
  link: string;
  pubDate: Date;
  text: string;
}

export function parseJinaEntries(markdown: string): JinaEntry[] {
  const entries: JinaEntry[] = [];
  const parts = markdown.split(/###\s*\[/);

  for (let i = 1; i < parts.length; i++) {
    const titleLink = parts[i].match(/^([^\]]+)\]\(([^)]+)\)/);
    if (!titleLink) {
      continue;
    }
    const publishedTime = parts[i].match(/Published Time:\s*([^\n]+)/);
    entries.push({
      title: titleLink[1].trim(),
      link: titleLink[2].trim(),
      pubDate: publishedTime ? new Date(publishedTime[1].trim()) : new Date(),
      text: parts[i],
    });
  }

  return entries;
}

export function jinaEntryBody(entry: string): string {
  return entry
    .replace(/^[^\n]*\]\([^\)]*\)\s*/, '')
    .replace(/Published Time:[^\n]*\n?/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
}
