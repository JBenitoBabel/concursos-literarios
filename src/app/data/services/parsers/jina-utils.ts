export function isJinaMarkdown(content: string): boolean {
  return content.includes('Markdown Content:') && content.includes('URL Source:');
}

export interface JinaEntry {
  title: string;
  link: string;
  pubDate: Date;
  text: string;
}

const RFC822_DATE = /^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/;
const URL_LINE = /^\[?https?:\/\/\S+\]?(\(\S*\))?$/;

export function parseJinaEntries(markdown: string): JinaEntry[] {
  const entries: JinaEntry[] = [];
  const parts = markdown.split(/###\s*\[/);

  for (let i = 1; i < parts.length; i++) {
    const titleLink = parts[i].match(/^([^\]]+)\]\(([^)]+)\)/);
    if (!titleLink) {
      continue;
    }
    const publishedTime = parts[i].match(/Published Time:\s*([^\n]+)/);
    const entryDate = parts[i]
      .split('\n')
      .map(line => line.trim())
      .find(line => RFC822_DATE.test(line));
    const rawDate = publishedTime?.[1].trim() ?? entryDate;
    entries.push({
      title: titleLink[1].trim(),
      link: titleLink[2].trim(),
      pubDate: rawDate ? new Date(rawDate) : new Date(),
      text: parts[i],
    });
  }

  return entries;
}

export function jinaEntryBody(entry: string): string {
  const bodyLines = entry
    .split('\n')
    .slice(1)
    .map(line => line.trim())
    .filter(line => {
      if (!line) {
        return false;
      }
      if (line.startsWith('Published Time:')) {
        return false;
      }
      if (RFC822_DATE.test(line)) {
        return false;
      }
      return !URL_LINE.test(line);
    });

  return bodyLines
    .join(' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
}
