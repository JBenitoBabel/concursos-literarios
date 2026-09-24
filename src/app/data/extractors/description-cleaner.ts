export function cleanDescription(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 300);
}