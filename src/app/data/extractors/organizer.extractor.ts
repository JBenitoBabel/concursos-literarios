export function extractOrganizer(text: string): string | undefined {
  const patterns = [
    /(?:convoca|organiza|convocante|promueve)[:\s]*([^.\n]+)/i,
    /(?:ayuntamiento|diputación|diputacion|fundación|fundacion|universidad|editorial|instituto|centro|asociación|asociacion)[^.\n]*/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0]?.trim();
    }
  }
  return undefined;
}