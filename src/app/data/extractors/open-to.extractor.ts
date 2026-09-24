export function extractOpenTo(text: string): string | undefined {
  const match = text.match(/Abierto a:\s*([^)\n]+)/i);
  const value = match?.[1]?.trim();
  return value ? value.replace(/\s+/g, ' ') : undefined;
}