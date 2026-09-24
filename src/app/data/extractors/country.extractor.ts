export function extractCountry(title: string): string | undefined {
  const match = title.trim().match(/\(([^()]+)\)\s*$/);
  const value = match?.[1]?.trim();
  return value || undefined;
}