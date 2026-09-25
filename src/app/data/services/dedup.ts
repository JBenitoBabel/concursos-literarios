import { Contest, ContestSource } from '../../models/contest.model';

const SOURCE_PRIORITY: Record<ContestSource, number> = {
  escritores: 0,
  letrasespanolas: 1,
  letralia: 2,
  guiadeconcursos: 3,
};

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace(/^www\./, '');
    const utmKeys: string[] = [];
    u.searchParams.forEach((_, key) => {
      if (key.startsWith('utm_')) {
        utmKeys.push(key);
      }
    });
    utmKeys.forEach(key => u.searchParams.delete(key));
    u.hash = '';
    const normalized = u.toString().replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

function priorityOf(contest: Contest): number {
  return contest.source ? SOURCE_PRIORITY[contest.source] : Number.MAX_SAFE_INTEGER;
}

export function sourcesOf(contest: Contest): ContestSource[] {
  return contest.sources ?? (contest.source ? [contest.source] : []);
}

function mergeContests(winner: Contest, loser: Contest): Contest {
  return {
    ...winner,
    categories: Array.from(new Set([...winner.categories, ...loser.categories])),
    sources: Array.from(new Set([...sourcesOf(winner), ...sourcesOf(loser)])),
    deadline: winner.deadline ?? loser.deadline,
    amount: winner.amount ?? loser.amount,
    organizer: winner.organizer ?? loser.organizer,
  };
}

export function dedupeContests(contests: Contest[]): Contest[] {
  const byUrl = new Map<string, Contest>();

  for (const contest of contests) {
    const key = contest.link ? normalizeUrl(contest.link) : `sin-url:${contest.title}`;
    const existing = byUrl.get(key);

    if (!existing) {
      byUrl.set(key, contest);
      continue;
    }

    const winner = priorityOf(contest) <= priorityOf(existing) ? contest : existing;
    const loser = winner === contest ? existing : contest;
    byUrl.set(key, mergeContests(winner, loser));
  }

  return Array.from(byUrl.values());
}
