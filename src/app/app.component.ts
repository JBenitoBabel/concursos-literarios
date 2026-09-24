import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContestStoreService } from './features/contests/services/contest-store.service';
import { Contest, FilterCategory, FilterPrizeType, FilterMonth, SortOrder } from './models/contest.model';

export type ThemeId = 'modern' | 'scifi' | 'wonderful' | 'retro';

const THEME_IDS: ThemeId[] = ['modern', 'scifi', 'wonderful', 'retro'];
const THEME_STORAGE_KEY = 'concursos-theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  store = inject(ContestStoreService);

  scrolled = signal(false);

  @ViewChild('headerSentinel', { static: false }) headerSentinel?: ElementRef<HTMLElement>;
  private headerObserver?: IntersectionObserver;

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
    { value: 'oldest', label: 'Cierre más próximo primero' },
    { value: 'newest', label: 'Cierre más lejano primero' }
  ];

  ngOnInit() {
    this.restoreTheme();
    this.store.loadContests();
  }

  ngAfterViewInit() {
    this.syncScrolledFromPosition();
    this.setupHeaderObserver(!this.scrolled());
  }

  ngOnDestroy() {
    this.headerObserver?.disconnect();
  }

  private syncScrolledFromPosition() {
    const y = window.scrollY;
    if (!this.scrolled() && y > 80) this.scrolled.set(true);
    else if (this.scrolled() && y < 40) this.scrolled.set(false);
  }

  private setupHeaderObserver(forEnter: boolean) {
    const sentinel = this.headerSentinel?.nativeElement;
    if (!sentinel) return;
    this.headerObserver?.disconnect();
    sentinel.style.top = forEnter ? '80px' : '40px';
    this.headerObserver = new IntersectionObserver(([entry]) => {
      if (forEnter && !entry.isIntersecting) {
        this.scrolled.set(true);
        this.setupHeaderObserver(false);
      } else if (!forEnter && entry.isIntersecting) {
        this.scrolled.set(false);
        this.setupHeaderObserver(true);
      }
    }, { root: null, rootMargin: '0px', threshold: 0 });
    this.headerObserver.observe(sentinel);
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

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  getDisplayTitle(contest: Contest): string {
    return contest.country
      ? contest.title.replace(/\s*\([^()]+\)\s*$/, '').trim()
      : contest.title;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'No especificada';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
}