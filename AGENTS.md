# ConcursosLiterarios - Agentes Guide

## Información del Proyecto

**Nombre:** ConcursosLiterarios  
**Framework:** Angular 17.2 (standalone components, signals)  
**Estilo:** SCSS con CSS Variables theming  
**RSS Source:** escritores.org (RSS XML + fallback Jina AI markdown)  
**Deployment:** Vercel (ver `.vercel/project.json`)  

### Stack Tecnológico
- Angular 17.2 (core, common, compiler, forms, platform-browser, router, animations)
- RxJS 7.8
- date-fns 4.4
- TypeScript 5.3
- Karma/Jasmine (testing configurado, sin tests aún)
- Angular CLI 17.2.1

### Estructura Principal
```
src/app/
├── app.component.ts       # Componente raíz (282 líneas - violación SRP)
├── app.config.ts          # Configuración app (providers, routes)
├── models/
│   └── contest.model.ts   # Interfaces Contest + tipos de filtro
└── services/
    └── rss.service.ts     # Fetch + parsing RSS (367 líneas - violación SRP)
```

### Comandos Principales
```bash
npm start          # ng serve (dev server en localhost:4200)
npm run build      # ng build (producción en dist/)
npm run test       # ng test (Karma)
npm run watch      # ng build --watch --configuration development
```

---

## Instrucciones Básicas para Proyectos Angular

### Arquitectura Recomendada (Angular 17+)

1. **Standalone Components** - Sin NgModule, usar `imports: []` en `@Component`
2. **Signals** - Estado reactivo con `signal()`, `computed()`, `effect()`
3. **Dependency Injection** - `inject()` function, `providedIn: 'root'`
4. **ChangeDetectionStrategy.OnPush** - Por defecto en componentes nuevos
5. **Functional Guards/Resolvers** - En lugar de clases

### Patrones de Código

```typescript
// ✅ Componente moderno
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
  styleUrl: './feature.component.scss'
})
export class FeatureComponent {
  private service = inject(DataService);
  data = signal<Data[]>([]);
  filtered = computed(() => this.data().filter(...));
}

// ✅ Servicio con signals
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  fetch(): Observable<Data[]> {
    return this.http.get<Data[]>(url);
  }
}
```

### Type Safety
- Evitar `any`, usar tipos estrictos
- `FilterMonth = 'all' | \`${number}-\${'01'|'02'|...'12'}\``
- Uniones para enums: `type PrizeType = 'dinero' | 'publicacion' | ...`

### Performance
- **OnPush** + signals = change detection óptima
- **Debounce** en inputs de búsqueda (300ms)
- **Virtual scrolling** (`@angular/cdk/scrolling`) para listas >100 items
- **Pipes puros** para transformaciones en template

### Testing
- Jest recomendado sobre Karma (más rápido, mejor DX)
- Testear services con `HttpTestingController`
- E2E con Playwright

---

## Documentación en `/docs`

| Archivo | Descripción | Ver |
|---------|-------------|-----|
| `REFACTOR_PLAN.md` | Auditoría SOLID + Angular Best Practices, arquitectura objetivo, prioridades P0-P3 | [docs/REFACTOR_PLAN.md](./docs/REFACTOR_PLAN.md) |
| `MULTI_SOURCE_PLAN.md` | Expansión a 4 fuentes (escritores.org, Letralia, Guiadeconcursos, Letras Españolas) con deduplicación | [docs/MULTI_SOURCE_PLAN.md](./docs/MULTI_SOURCE_PLAN.md) |
| `SEO_PLAN.md` | SEO técnico: prerendering SSG, meta tags dinámicos, JSON-LD, sitemap, cron diario Vercel | [docs/SEO_PLAN.md](./docs/SEO_PLAN.md) |
| `CHANGELOG.md` (raíz) | Registro de cambios por versión (Keep a Changelog 1.1.0); mover `Unreleased` a nueva versión al lanzar | [CHANGELOG.md](./CHANGELOG.md) |

> **Importante:** No duplicar contenido de estos archivos aquí. Consultar los originales para detalles completos.

---

## Decisiones Pendientes (ver `docs/REFACTOR_PLAN.md`)

- [ ] ¿Mantener multi-tema (modern/scifi/wonderful/retro) o simplificar?
- [ ] ¿Virtual scrolling necesario ya? (185 items OK sin él, pero escala)
- [ ] ¿IndexedDB para cache histórico entre sesiones?
- [ ] ¿Service Worker / PWA para offline?

---

## Notas para Agentes Futuros

1. **El refactor SOLID y multi-fuentes son complementarios** - El plan multi-fuentes ya prevé strategy pattern para parsers que encaja en la arquitectura objetivo del refactor
2. **Recomendación:** Implementar multi-fuentes primero (valor inmediato usuario), luego refactor SOLID
3. **No hay tests** - Cualquier cambio debe verificarse manualmente con `ng serve`
4. **CSS Variables theming** - Temas definidos en `:root` y `[data-theme="..."]` en `styles.scss`
5. **CORS Proxies** - Cascada de 4 proxies en `rss.service.ts:CORS_PROXIES`
6. **SEO requiere prerendering** - `SEO_PLAN.md` prevé SSG + RSS en build-time (`scripts/build-rss-data.ts` → `src/assets/rss-data.json`); esto afecta a `rss.service.ts` (debe leer JSON estático en browser, no fetch runtime)
7. **Iconos: usar exclusivamente Lucide** - Todos los iconos SVG inline del proyecto (título, favicon, UI, estados, tags) provienen de [Lucide](https://lucide.dev) (licencia ISC, sin atribución obligatoria; hay crédito voluntario en el footer). **Convención:**
   - Copiar el path desde [lucide.dev/icons](https://lucide.dev/icons) o `github.com/lucide-icons/lucide/main/icons/<nombre>.svg`
   - Formato inline: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">` + paths de Lucide (sin `width`/`height`, sin `stroke`/`fill` en el `<svg>` — hereda de CSS `.icon { fill: none; stroke: currentColor; ... }`)
   - `aria-hidden="true"` en iconos decorativos
   - El favicon (`src/assets/favicon.svg` + `src/favicon.ico`) usa el glifo `book` de Lucide sobre badge `#4f46e5`; si se cambia, regenerar `.ico` (resvg + png-to-ico)
   - **No usar Flaticon, Font Awesome ni otras fuentes** — mantener consistencia visual con Lucide
   - Al añadir un icono nuevo, verificar que el path coincida con la versión actual de Lucide (los paths antiguos de versiones previas no deben reutilizarse)