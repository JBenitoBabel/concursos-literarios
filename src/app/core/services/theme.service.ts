import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Renderer2, RendererFactory2 } from '@angular/core';

export type ThemeId = 'modern' | 'scifi' | 'wonderful' | 'retro';

const THEME_IDS: ThemeId[] = ['modern', 'scifi', 'wonderful', 'retro'];
const THEME_STORAGE_KEY = 'concursos-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly renderer: Renderer2;

  theme = signal<ThemeId>('modern');

  themes: { id: ThemeId; label: string }[] = [
    { id: 'modern', label: 'Moderno' },
    { id: 'scifi', label: 'Sci-Fi' },
    { id: 'wonderful', label: 'Wonderful' },
    { id: 'retro', label: 'Retro' },
  ];

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.restoreTheme();
  }

  setTheme(id: ThemeId): void {
    this.theme.set(id);
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setAttribute(document.documentElement, 'data-theme', id);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, id);
      } catch {
        // localStorage no disponible
      }
    }
  }

  private restoreTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEME_IDS.includes(saved)) {
        this.theme.set(saved);
        this.renderer.setAttribute(document.documentElement, 'data-theme', saved);
      }
    } catch {
      // localStorage no disponible
    }
  }
}