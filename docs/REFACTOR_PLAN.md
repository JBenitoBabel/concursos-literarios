# Plan de Refactor - Auditoría Angular + SOLID

> Generado tras auditoría del código el 2026-09-22

---

## Resumen General

La aplicación es **Angular 17+ standalone** con signals, SSR-ready, CSS variables theming y arquitectura funcional. **Funciona correctamente** pero presenta violaciones de SOLID y oportunidades de mejora en mantenibilidad, testabilidad y escalabilidad.

---

## 1. Violaciones de SOLID

### ❌ Single Responsibility Principle (SRP)

| Archivo | Líneas | Responsabilidades mezcladas | Severidad |
|---------|--------|----------------------------|-----------|
| `app.component.ts` | 282 | UI, estado global, filtros, tema, scroll, labels, formateo fechas, tracking | **Alta** |
| `rss.service.ts` | 367 | HTTP + retry proxies, parsing XML, parsing Jina markdown, extracción categorías (combinadas + simples), extracción prizeTypes, deadline, organizador, amount, genre, limpieza descripción | **Alta** |

**Refactor propuesto:**
- `ContestStoreService` / `ContestFilterService` → estado + filtros + computed
- `ThemeService` → tema + localStorage + `Renderer2`
- `ScrollService` / `InViewportDirective` → scrollY + back-to-top
- `RssParserStrategy` (interface) + `XmlRssParser` + `JinaMarkdownParser`
- `CategoryExtractor`, `PrizeTypeExtractor`, `DeadlineExtractor`, `OrganizerExtractor`, `AmountExtractor`, `GenreExtractor`

---

### ❌ Open/Closed Principle (OCP)

| Ubicación | Problema | Solución |
|-----------|----------|----------|
| `rss.service.ts:226-239` | `combinedPatterns` hardcodeado - nueva combinación = modificar clase | Config externa `contest-keywords.ts` + registry pattern |
| `rss.service.ts:268-286` | `extractPrizeTypes` if/else chain | Array de `{ keywords: string[], type: PrizeType }` |
| `app.component.ts:36-43` + `app.component.scss:817-875` | Temas hardcodeados | `ThemeConfig` registry + CSS vars generadas dinámicamente |

---

### ❌ Dependency Inversion (DIP)

| Problema | Fix |
|----------|-----|
| `RssService` sin abstracción para parser → no testeable sin HTTP real | `RssParser` interface + `InjectionToken<RssParser>` |
| `AppComponent` inyecta `RssService` concreto | Inyectar `ContestDataSource` (interface) |
| `document.documentElement.setAttribute` directo | Usar `Renderer2` via `ThemeService` |

---

### ✅ Liskov Substitution (LSP) - OK
No herencia problemática.

### ⚠️ Interface Segregation (ISP) - Parcial
`contest.model.ts` mezcla dominio (`Contest`) con UI (`FilterCategory`, `FilterPrizeType`, `FilterMonth`, `SortOrder`). Separar en `contest.model.ts` + `filter.model.ts`.

---

## 2. Angular Best Practices - Mejoras

| Issue | Ubicación | Fix |
|-------|-----------|-----|
| `$any($event.target)` rompe type safety | Template: selects/inputs múltiples | Tipar handlers: `(input)="onSearchChange($event)"` con `HTMLInputElement` |
| Casts `as FilterCategory` en filters | `app.component.ts:150,155,160` | Tipar `selectedCategories = signal<FilterCategory[]>([])` |
| Lógica en template: `getCategoryClass()`, `getPrizeTypeLabel()`, `formatMonthLabel()` | Component + Template | **Pipes puros**: `categoryClass`, `prizeLabel`, `monthLabel` |
| `HostListener('window:scroll')` en component | `app.component.ts:107-110` | Directiva `InViewportDirective` o `ScrollService` |
| `document.documentElement.setAttribute` directo | `app.component.ts:87,100` | `Renderer2` en `ThemeService` |
| Falta `ChangeDetectionStrategy.OnPush` | `@Component` | Añadir (compatible con signals) |
| `console.log` en producción | `rss.service.ts` múltiples | `LoggerService` condicional `environment.production` |

---

## 3. Type Safety

```typescript
// ❌ Actual
export type FilterMonth = 'all' | string;

// ✅ Mejor - branded type o unión estricta
export type FilterMonth = 'all' | `${number}-${'01'|'02'|'03'|'04'|'05'|'06'|'07'|'08'|'09'|'10'|'11'|'12'}`;

// ❌ prizeTypes: string[]
prizeTypes: string[];

// ✅ Union type
type PrizeType = 'dinero' | 'publicacion' | 'becas' | 'reconocimiento' | 'otro';
prizeTypes: PrizeType[];
```

---

## 4. Rendimiento

| Problema | Impacto | Solución |
|----------|---------|----------|
| `applyFilters()` en cada keystroke + click filtro | Re-filtra 185 items cada vez | **Debounce 300ms** en search (`debounceTime` en service o signal debounced) |
| Sin virtual scrolling | 185+ cards renderizadas | `@angular/cdk/scrolling` `*cdkVirtualFor` |
| Regex complejas por item en parse | CPU en carga inicial | Pre-compilar regex + memoizar con `Map<string, Result>` |

---

## 5. Testing & Mantenibilidad

| Falta | Acción |
|-------|--------|
| **0 tests unitarios** | Jest: `RssService` (mock HTTP), `CategoryExtractor`, `PrizeTypeExtractor`, `parseJinaEntry`, `extractDeadline` |
| **No E2E** | Playwright: carga, filtros multi-select, tema, scroll, back-to-top |
| **Hardcoded strings** en extractores | Extraer a `contest-keywords.ts` (export const `COMBINED_PATTERNS`, `CATEGORY_KEYWORDS`, `PRIZE_KEYWORDS`) |
| **Magic numbers** en SCSS | Design tokens: `$spacing-*`, `$radius-*`, `$breakpoint-*` |

---

## 6. Arquitectura Objetivo (Refactor)

```
src/app/
├── core/
│   ├── services/
│   │   ├── theme.service.ts
│   │   ├── scroll.service.ts
│   │   └── logger.service.ts
│   ├── models/
│   │   ├── contest.model.ts
│   │   └── filter.model.ts
│   └── tokens/
│       └── contest-data-source.token.ts
├── data/
│   ├── services/
│   │   ├── rss.service.ts              # implementa ContestDataSource
│   │   ├── parsers/
│   │   │   ├── rss-parser.interface.ts
│   │   │   ├── xml-rss.parser.ts
│   │   │   └── jina-markdown.parser.ts
│   │   └── extractors/
│   │       ├── category.extractor.ts
│   │       ├── prize-type.extractor.ts
│   │       ├── deadline.extractor.ts
│   │       └── organizer.extractor.ts
│   └── config/
│       └── contest-keywords.ts
├── features/
│   └── contests/
│       ├── components/
│       │   ├── contest-list/
│       │   ├── contest-card/
│       │   ├── contest-filters/
│       │   └── contest-search/
│       ├── services/
│       │   └── contest-store.service.ts
│       └── pipes/
│           ├── category-class.pipe.ts
│           ├── prize-label.pipe.ts
│           └── month-label.pipe.ts
└── shared/
    ├── ui/
    │   ├── checkbox-group.component.ts
    │   ├── filter-select.component.ts
    │   └── theme-selector.component.ts
    └── directives/
        └── in-viewport.directive.ts
```

---

## 7. Prioridad de Cambios

| Prioridad | Acción | Esfuerzo estimado |
|-----------|--------|-------------------|
| **P0** | Extraer extractores a clases separadas + config `contest-keywords.ts` | 2-3h |
| **P0** | `ContestStoreService` (signals + filters + computed) fuera del component | 2h |
| **P0** | `ChangeDetectionStrategy.OnPush` en `AppComponent` | 5 min |
| **P1** | Pipes: `categoryClass`, `prizeLabel`, `monthLabel` | 1h |
| **P1** | `ThemeService` + `ScrollService` fuera del component | 1-2h |
| **P1** | Debounce 300ms en search input | 30 min |
| **P2** | Strategy pattern parsers (XML vs Jina) | 2h |
| **P2** | Virtual scrolling (`cdkVirtualFor`) | 1h |
| **P3** | Tests unitarios (Jest) | 4-6h |
| **P3** | Design tokens SCSS | 1h |

---

## 8. Comandos Útiles

```bash
# Verificar build
npm run build

# Tests (cuando existan)
npm run test

# Lint
npm run lint

# Ver bundle size
npm run build -- --stats-json && npx webpack-bundle-analyzer dist/stats.json
```

---

## 9. Decisiones Pendientes

- [ ] ¿Mantener multi-tema (modern/scifi/wonderful/retro) o simplificar?
- [ ] ¿Virtual scrolling necesario ya? (185 items OK sin él, pero escala)
- [ ] ¿IndexedDB para cache histórico entre sesiones?
- [ ] ¿Service Worker / PWA para offline?

---

> **Nota**: Este plan es incremental. Cada P0/P1 se puede hacer en PRs separados sin romper funcionalidad existente.