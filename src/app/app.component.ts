import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContestStoreService } from './features/contests/services/contest-store.service';
import { CategoryClassPipe } from './features/contests/pipes/category-class.pipe';
import { CategoryLabelPipe } from './features/contests/pipes/category-label.pipe';
import { PrizeLabelPipe } from './features/contests/pipes/prize-label.pipe';
import { ThemeService, type ThemeId } from './core/services/theme.service';
import { ScrollService } from './core/services/scroll.service';
import { InViewportDirective } from './shared/directives/in-viewport.directive';
import { Contest, FilterCategory, FilterPrizeType, FilterMonth, SortOrder } from './models/contest.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryClassPipe, CategoryLabelPipe, PrizeLabelPipe, InViewportDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  store = inject(ContestStoreService);
  themeService = inject(ThemeService);
  scrollService = inject(ScrollService);

  scrolled = signal(false);

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
    this.store.loadContests();
  }

  onScrolledChange(isScrolled: boolean): void {
    this.scrolled.set(isScrolled);
  }

  setTheme(id: ThemeId): void {
    this.themeService.setTheme(id);
  }

  scrollToTop(): void {
    this.scrollService.scrollToTop();
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