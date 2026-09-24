export function extractAmount(text: string): string | undefined {
  const match = text.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|euros|eur|dólares|dolares|\$))/i);
  return match ? match[1] : undefined;
}