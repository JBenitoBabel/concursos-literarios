import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RssService } from './services/rss.service';
import { Contest, FilterCategory, FilterPrizeType, FilterMonth, SortOrder } from './models/contest.model';

export type ThemeId = 'modern' | 'scifi' | 'wonderful' | 'retro';

const THEME_IDS: ThemeId[] = ['modern', 'scifi', 'wonderful', 'retro'];
const THEME_STORAGE_KEY = 'concursos-theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
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
  sortOrder = signal<SortOrder>('newest');

  scrolled = signal(false);

  theme = signal<ThemeId>('modern');

  themes: { id: ThemeId; label: string }[] = [
    { id: 'modern', label: 'Moderno' },
    { id: 'scifi', label: 'Sci-Fi' },
    { id: 'wonderful', label: 'Wonderful' },
    { id: 'retro', label: 'Retro' }
  ];

  categories: { value: FilterCategory; label: string }[] = [
    { value: 'poesia', label: 'Poesía' },
    { value: 'novela', label: 'Novela' },
    { value: 'relato', label: 'Relato/Cuento' },
    { value: 'ensayo', label: 'Ensayo' },
    { value: 'teatro', label: 'Teatro' },
    { value: 'infantil', label: 'Infantil/Juvenil' },
    { value: 'otro', label: 'Otro' }
  ];

  prizeTypes: { value: FilterPrizeType; label: string }[] = [
    { value: 'dinero', label: 'Premio en metálico' },
    { value: 'publicacion', label: 'Publicación' },
    { value: 'becas', label: 'Becas/Residencias' },
    { value: 'reconocimiento', label: 'Reconocimiento' },
    { value: 'otro', label: 'Otro' }
  ];

  sortOptions: { value: SortOrder; label: string }[] = [
    { value: 'newest', label: 'Más recientes primero' },
    { value: 'oldest', label: 'Más antiguos primero' }
  ];

  availableMonths = computed(() => {
    const months = new Set<string>();
    this.contests().forEach(c => {
      const m = c.pubDate.toISOString().substring(0, 7);
      months.add(m);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)).map(m => ({
      value: m,
      label: this.formatMonthLabel(m)
    }));
  });

  ngOnInit() {
    this.restoreTheme();
    this.loadContests();
  }

  setTheme(id: ThemeId) {
    this.theme.set(id);
    document.documentElement.setAttribute('data-theme', id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // localStorage no disponible
    }
  }

  private restoreTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEME_IDS.includes(saved)) {
        this.theme.set(saved);
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch {
      // localStorage no disponible
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.scrolled.set(window.scrollY > 80);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadContests() {
    this.loading.set(true);
    this.error.set(null);

    this.rssService.fetchContests().subscribe({
      next: (contests) => {
        this.contests.set(contests);
        this.applyFilters();
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: (err) => {
        this.error.set('Error al cargar los concursos. Inténtalo de nuevo más tarde.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  applyFilters() {
    let result = this.contests();

    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.organizer?.toLowerCase().includes(term) ||
        c.categories.some(cat => cat.toLowerCase().includes(term))
      );
    }

    const cats = this.selectedCategories() as FilterCategory[];
    if (cats.length > 0) {
      result = result.filter(c => c.categories.some(cat => cats.includes(cat as FilterCategory)));
    }

    const prizes = this.selectedPrizeTypes() as FilterPrizeType[];
    if (prizes.length > 0) {
      result = result.filter(c => c.prizeTypes.some(pt => prizes.includes(pt as FilterPrizeType)));
    }

    const months = this.selectedMonths();
    if (months.length > 0) {
      result = result.filter(c => months.includes(c.pubDate.toISOString().substring(0, 7) as FilterMonth));
    }

    result.sort((a, b) => {
      const diff = a.pubDate.getTime() - b.pubDate.getTime();
      return this.sortOrder() === 'newest' ? -diff : diff;
    });

    this.filteredContests.set(result);
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  toggleCategory(cat: FilterCategory) {
    this.selectedCategories.update(current => 
      current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat]
    );
    this.applyFilters();
  }

  togglePrizeType(type: FilterPrizeType) {
    this.selectedPrizeTypes.update(current => 
      current.includes(type) ? current.filter(t => t !== type) : [...current, type]
    );
    this.applyFilters();
  }

  toggleMonth(month: FilterMonth) {
    this.selectedMonths.update(current => 
      current.includes(month) ? current.filter(m => m !== month) : [...current, month]
    );
    this.applyFilters();
  }

  onSortChange(order: SortOrder) {
    this.sortOrder.set(order);
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.selectedCategories.set([]);
    this.selectedPrizeTypes.set([]);
    this.selectedMonths.set([]);
    this.sortOrder.set('newest');
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm().trim() !== '' ||
           this.selectedCategories().length > 0 ||
           this.selectedPrizeTypes().length > 0 ||
           this.selectedMonths().length > 0;
  }

  getCategoryClass(category: string): string {
    const classes: Record<string, string> = {
      'poesia': 'cat-poesia',
      'novela': 'cat-novela',
      'relato': 'cat-relato',
      'ensayo': 'cat-ensayo',
      'teatro': 'cat-teatro',
      'infantil': 'cat-infantil',
      'otro': 'cat-otro'
    };
    return classes[category] || 'cat-otro';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'poesia': 'Poesía',
      'novela': 'Novela',
      'relato': 'Relato',
      'ensayo': 'Ensayo',
      'teatro': 'Teatro',
      'infantil': 'Infantil/Juvenil',
      'otro': 'Otro'
    };
    return labels[category] || category;
  }

  getPrizeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'dinero': 'Dinero',
      'publicacion': 'Publicación',
      'becas': 'Becas',
      'reconocimiento': 'Reconocimiento',
      'otro': 'Otro'
    };
    return labels[type] || type;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'No especificada';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatMonthLabel(ym: string): string {
    const [year, month] = ym.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

  isDeadlineSoon(deadline: Date | undefined): boolean {
    if (!deadline) return false;
    const diff = deadline.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }

  isDeadlinePassed(deadline: Date | undefined): boolean {
    if (!deadline) return false;
    return deadline < new Date();
  }

  trackByLink(index: number, contest: Contest): string {
    return contest.link || contest.title;
  }
}