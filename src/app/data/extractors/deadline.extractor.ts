export function extractDeadline(text: string): Date | undefined {
  const basesSection = text.match(/BASES\s*-\s*\(([^)]*)\)/i);
  if (basesSection) {
    const colonDates = basesSection[1].match(/\d{1,2}:\d{1,2}:\d{4}/g);
    if (colonDates && colonDates.length > 0) {
      const last = colonDates[colonDates.length - 1];
      const [day, month, year] = last.split(':').map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  const patterns = [
    /(?:plazo|fecha l[ií]mite|fecha limite|deadline|hasta el|antes del)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const dateStr = match.replace(/.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}).*/, '$1');
        const date = parseDate(dateStr);
        if (date && date > new Date()) {
          return date;
        }
      }
    }
  }

  return undefined;
}

export function parseDate(str: string): Date | null {
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) {
      year += 2000;
    }
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}