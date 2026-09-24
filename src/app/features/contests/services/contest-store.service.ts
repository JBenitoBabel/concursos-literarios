import { Injectable, inject, signal, computed } from '@angular/core';
import { RssService } from '../../../services/rss.service';
import { Contest, FilterCategory, FilterPrizeType, FilterMonth, SortOrder } from '../../../models/contest.model';

@Injectable({ providedIn: 'root' })
export class ContestStoreService {
  private rssService = inject(RssService);

  contests = signal<Contest[]>([]);
  filteredContests = signal<Contest[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);

  searchTerm = signal('');
  selectedCategories = signal<FilterCategory[]>([]);
  selectedPrizeTypes = signal<FilterPrizeType[]>([]);
  selectedMonths = signal<FilterMonth[]>([]);
  sortOrder = signal<SortOrder>('oldest');

  hasContestsWithoutDate = computed(() => {
    return this.contests().some(c => !c.deadline);
  });

  availableMonths = computed(() => {
    const months = new Set<string>();
    this.contests().forEach(c => {
      if (c.deadline) {
        const m = c.deadline.toISOString().substring(0, 7);
        months.add(m);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)).map(m => ({
      value: m,
      label: this.formatMonthLabel(m)
    }));
  });

  hasActiveFilters = computed(() => {
    return this.searchTerm().trim() !== '' ||
           this.selectedCategories().length > 0 ||
           this.selectedPrizeTypes().length > 0 ||
           this.selectedMonths().length > 0;
  });

  loadContests(): void {
    this.loading.set(true);
    this.error.set(null);

    this.rssService.fetchContests().subscribe({
      next: (contests: Contest[]) => {
        this.contests.set(contests);
        this.applyFilters();
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: (err: unknown) => {
        this.error.set('Error al cargar los concursos. Inténtalo de nuevo más tarde.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    let result = this.contests();

    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      result = result.filter((c: Contest) =>
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.organizer?.toLowerCase().includes(term) ||
        c.categories.some((cat: string) => cat.toLowerCase().includes(term))
      );
    }

    const cats = this.selectedCategories();
    if (cats.length > 0) {
      result = result.filter((c: Contest) => c.categories.some((cat: string) => cats.includes(cat as FilterCategory)));
    }

    const prizes = this.selectedPrizeTypes();
    if (prizes.length > 0) {
      result = result.filter((c: Contest) => c.prizeTypes.some((pt: string) => prizes.includes(pt as FilterPrizeType)));
    }

    const months = this.selectedMonths();
    if (months.length > 0) {
      const hasNoDateFilter = months.includes('no-date');
      const monthFilters = months.filter(m => m !== 'no-date');

      result = result.filter(c => {
        if (!c.deadline) {
          return hasNoDateFilter;
        }
        if (monthFilters.length === 0) {
          return hasNoDateFilter;
        }
        return monthFilters.includes(c.deadline.toISOString().substring(0, 7) as FilterMonth);
      });
    }

    result.sort((a, b) => {
      const dateA = a.deadline || a.pubDate;
      const dateB = b.deadline || b.pubDate;
      const diff = dateA.getTime() - dateB.getTime();
      return this.sortOrder() === 'newest' ? -diff : diff;
    });

    this.filteredContests.set(result);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  toggleCategory(cat: FilterCategory): void {
    this.selectedCategories.update(current =>
      current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat]
    );
    this.applyFilters();
  }

  togglePrizeType(type: FilterPrizeType): void {
    this.selectedPrizeTypes.update(current =>
      current.includes(type) ? current.filter(t => t !== type) : [...current, type]
    );
    this.applyFilters();
  }

  toggleMonth(month: FilterMonth): void {
    this.selectedMonths.update(current =>
      current.includes(month) ? current.filter(m => m !== month) : [...current, month]
    );
    this.applyFilters();
  }

  setSortOrder(order: SortOrder): void {
    this.sortOrder.set(order);
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategories.set([]);
    this.selectedPrizeTypes.set([]);
    this.selectedMonths.set([]);
    this.sortOrder.set('oldest');
    this.applyFilters();
  }

  formatMonthLabel(ym: string): string {
    const [year, month] = ym.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

  trackByLink(index: number, contest: Contest): string {
    return contest.link || contest.title;
  }
}