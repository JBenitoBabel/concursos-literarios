# Plan Fase 1 — Multi-fuentes (4 fuentes)

> Investigación verificada en vivo: 2026-09-25 · Plan aprobado: 2026-09-25 · Actualizado: 2026-09-25
> Base: `docs/MULTI_SOURCE_PLAN.md` (diseño) + `docs/REFACTOR_PLAN.md` (arquitectura objetivo)

---

## Estado de implementación

| Etapa | Estado | Commit / nota |
|-------|--------|---------------|
| A. Modelo y configuración | ✅ Hecha | `e1ccdc8 feat: add contest source model and multi-source feed config` (develop) |
| B. Parsers | ✅ Hecha | `6e1fbc9 feat: add per-source parsers and registry for the four feeds` (develop) |
| C. Fetch + dedup | ✅ Hecha | **⚠️ SIN COMMITEAR** — subir con flujo `push-develop` antes de empezar D |
| D. UI (badge, footer, orden, checkboxes fuente) | ⬜ Pendiente | Ampliada con decisiones de 2026-09-25 (ver abajo) |
| E. Tests Jest | ⬜ Pendiente | |
| F. Verificación, docs, commits | ⬜ Pendiente | |

**Siguiente sesión:** ① subir C → ② D → ③ E → ④ F.

### Archivos del estado actual

```
src/app/
├── models/contest.model.ts              # A: + ContestSource, + source? en Contest
├── data/config/
│   ├── feed-sources.ts                  # A: FEED_SOURCES (4 fuentes)
│   └── contest-keywords.ts              # A: SOURCE_CATEGORY_MAPS/NOISE + mapSourceCategory()
├── data/services/
│   ├── dedup.ts                         # C: normalizeUrl + dedupeContests (SIN COMMIT)
│   └── parsers/                         # B: 8 archivos (interface, xml-utils, jina-utils,
│                                        #     escritores/letralia/guiadeconcursos/letrasespanolas, registry)
└── services/rss.service.ts              # C: refactor forkJoin + cascada corregida (SIN COMMIT)
```

Pendiente de commit en C: `dedup.ts` (nuevo) · `rss.service.ts` · `contest-keywords.ts` · `letralia.parser.ts` · `guiadeconcursos.parser.ts` · `jina-utils.ts`.

---

## Contexto y decisiones tomadas

| Decisión | Detalle |
|----------|---------|
| Orden | **Fase 1 (multi-fuentes) primero**, P2 (strategy parsers XML/Jina) después — decisión del usuario 2026-09-25 |
| Virtual scrolling | **Descartado y revertido** (2026-09-25): 185 items no lo justifican; la implementación con `cdk-virtual-scroll-viewport` sin `*cdkVirtualFor` no virtualizaba. Si escala → paginación/"cargar más", no virtual scrolling para grids |
| UI atribución | **Incluida**: chips de fuente en card (varias si la tarjeta es fusionada) + citación a Letras Españolas en footer (compromisos éticos 2 y 5 de MULTI_SOURCE_PLAN) |
| Tests | **Incluidos**: Jest con fixtures para parsers y dedup |
| Filtro por fuente | **Incluido** (cambio de decisión 2026-09-25, usuario lo pidió): checkboxes en filtros, **filtro visual sin refetch** + `sources[]` unión en dedup. Ninguna marcada = todas |
| Orden de tarjetas | **Nuevo** (2026-09-25): en ambos órdenes → ① cierres futuros ② cerrados ③ **sin fecha al final**. Mismo criterio de "cerrado" que el badge (`deadline < new Date()`, `app.component.ts:85-88`) |
| Badge de fuente | **Multi-chip**: cada tarjeta muestra chips de **todas** sus fuentes (fusionadas escritores+LE → 2 chips). Iconos Lucide: `rss` (3 RSS) y `database` (JSON LE) |
| Smoke test | Temporal (borrado): pipeline end-to-end contra feeds reales antes de la verificación manual |

---

## Verificación en vivo (2026-09-25)

| Componente | Estado real |
|---|---|
| Feed Letralia (45 items) | ✅ XML OK — `Becas 2026-2027 …. Fecha: 23/10/2026. Premio: 9 becas. Ámbito: …` en `<description>` (CDATA); `<category>` tipo `Concursos de microrrelato`, **incluye** `Concursos de prosa` (añadido al map) |
| Feed Guiadeconcursos (12 items) | ✅ XML OK — categorías `Cuento-Relato`, `Por email-online` + tags libres en minúsculas; description truncada en `[…]`; títulos con premio (`… – 1.500€`) |
| JSON Letras Españolas (182 items) | ✅ CORS `*` (directo, sin proxy). **174/182 URLs = escritores.org** → dedup crítico. `categoria` usa `\|` (`'Relato corto\|Poesia'`); categorías reales: Infantil, Microrrelato, Novela, Novela corta, Otro, Poesia, Relato, Relato corto, Teatro (todas mapeadas) |
| `api.allorigins.win` | ⚠️ Flaky de verdad: en pruebas de C devolvió 522/408/522 (1 de cada 3 OK) — cascada a jina imprescindible |
| `r.jina.ai` | ✅ Siempre OK. escritores: descripción completa (`BASES -`) → fallback completo, 187 entradas `### [Title](url)`. **WordPress (letralia/guia): solo título+link+línea fecha → fallback degradado** con descripción (tras limpiar URL/fecha) **vacía** |
| `corsproxy.io` | ❌ Muerto (401 API key) — **eliminado de la cascada en C** |
| CORS directo | escritores/letralia/guia: ❌ sin headers → proxy obligatorio. GitHub raw: ✅ `*` |

**Cascada aplicada en C**: `[allorigins, jina]` para los 3 RSS (`https://r.jina.ai/https://` + URL); JSON directo `responseType: 'text'` sin proxy.

**Resultado smoke C (real):** 425 items raw → **250 tras dedup** (175 duplicados eliminados ≈ 174/182 previsto) · 193 con deadline · las 4 fuentes parsean > 0.

---

## Etapas

### A. Modelo y configuración ✅
1. `contest.model.ts` — `ContestSource` + `source?: ContestSource`. **Pendiente en D5**: `sources?: ContestSource[]`.
2. `data/config/feed-sources.ts` — `FeedSource[]` (`id`, `url`, `kind`, `useProxy`). **Pendiente en D5**: `SOURCE_LABELS`.
3. `data/config/contest-keywords.ts` — `SOURCE_CATEGORY_MAPS`, `SOURCE_CATEGORY_NOISE` y `mapSourceCategory()` por fuente (map primero, luego ruido, luego tag libre minúscula en Guia, si no → `'otro'`; parser hace fallback a `['otro']` si queda vacío). Incluye `concursos de prosa → relato`.

### B. Parsers ✅
4. `parsers/source-parser.interface.ts` — `SourceParser { parse(content: string): Contest[] }`.
5. `parsers/xml-utils.ts` — `parseXml` (null si `parsererror`), `getRssItems`, `getTextContent` (vía `getElementsByTagName`, soporta `content:encoded`), `getRssCategories`, `stripTags`.
6. `parsers/jina-utils.ts` (compartido) — `isJinaMarkdown`, `parseJinaEntries` (pubDate: `Published Time:` → línea RFC822 por entrada → `new Date()`), `jinaEntryBody` (limpia línea título, URL suelta, fecha y `Published Time:`).
7. `parsers/escritores.parser.ts` — lógica original intacta (detección XML/Jina interna, `BASES -`), `source: 'escritores'`.
8. `parsers/letralia.parser.ts` — título = description antes de `. Fecha:`; `Fecha:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})` + `parseDate`; amount del segmento `Premio:` (split por `.\s+` para no cortar en `1.500`); `<category>` mapeadas; fallback Jina degradado con `extractCategories(título)`.
9. `parsers/guiadeconcursos.parser.ts` — amount con `PRIZE_REGEX.dinero` sobre título (fallback `extractAmount`); categorías con ruido; truncado en `[…]`/`[...]`/`&hellip;`; deadline best-effort `extractDeadline(title + description)`; fallback Jina análogo (amount desde título, que ya lo lleva).
10. `parsers/letrasespanolas.parser.ts` — valida `JSON.parse` + `Array.isArray`; `fecha_limite` dd/mm/yyyy; `organizacion === 'No especificada' → undefined`; `categoria` split `|`.
11. `parsers/parser-registry.ts` — `PARSERS: Record<ContestSource, SourceParser>` (añadir fuente = config + parser + 1 línea).

### C. Fetch + dedup ✅ (sin commitear)
12. `data/services/dedup.ts` — `normalizeUrl` (exacto del plan; **usar `searchParams.forEach`**, `URLSearchParams.keys()` no compila: falta `lib: dom.iterable`) + `dedupeContests` (prioridad `escritores > letrasespanolas > letralia > guiadeconcursos`, unión de categorías, fill `deadline`/`amount`/`organizer`; clave fallback `sin-url:${title}` si no hay link). **D5 añadirá unión de `sources[]` + exportar `sourcesOf(contest)`** (la usará el store).
13. `services/rss.service.ts` — `forkJoin` sobre `FEED_SOURCES`; por fuente `catchError → of(null)` + `console.warn` ("Fuente caída"); todas fallan → `throwError` (store muestra error + Reintentar); parsers por fuente + `dedupeContests`; **1 solo** `console.log` resumen (`conteos por fuente: X=… → total N, tras dedup M`); sin sort; sin `console.log` de debug.

**Desviaciones respecto al plan (hechas en C, mantener):**
- `concursos de prosa → relato` (aparecía en el feed real de Letralia).
- Fallback Jina WordPress: `pubDate` desde la línea RFC822 de la entrada (si no, "hoy" siempre) y descripción degradada limpia (puede quedar vacía — comportamiento previsto).
- Categorías en fallback Jina vía `extractCategories(title)` en vez de `['otro']`, para que las tarjetas degradadas sean filtrables.

### D. UI — badge, footer, orden y checkboxes de fuente (ampliada 2026-09-25)

> Ejecutar en este orden: D5 → D3 → D4 → D1 → D2 → D6.

**D5 — Modelo, dedup, config** (base de D1/D4)
- `contest.model.ts` — `sources?: ContestSource[]` (opcional, no rompe nada).
- `dedup.ts` — `export function sourcesOf(contest: Contest): ContestSource[]` = `contest.sources ?? (contest.source ? [contest.source] : [])`; en `mergeContests`, `sources` = unión sin duplicados de `sourcesOf(ganador) + sourcesOf(perdedor)`.
- `feed-sources.ts` — `export const SOURCE_LABELS: Record<ContestSource, string>` = `{ escritores: 'Escritores', letralia: 'Letralia', guiadeconcursos: 'Guía de Concursos', letrasespanolas: 'Letras Españolas' }`.

**D3 — Orden** (`contest-store.service.ts`, `applyFilters`, ~líneas 127-132)
```typescript
// bloques en AMBOS órdenes: 0=futuro, 1=cerrado, 2=sin fecha (final)
const now = Date.now(); // 1 vez por sort, no en cada comparación
const rank = (c: Contest) => (!c.deadline ? 2 : c.deadline.getTime() < now ? 1 : 0);
// rank distinto → ordenar por rank; si no → diff por (deadline ?? pubDate) según sortOrder
```
- Mismo criterio de "cerrado" que `isDeadlinePassed` (`app.component.ts:85-88`): los cierres de hoy pasan a bloque 2 a medianoche.
- Suborden dentro del bloque sin fecha: `pubDate` según `sortOrder`.

**D4 — Checkboxes "Fuente"**
- `contest-store.service.ts` — `selectedSources = signal<ContestSource[]>([])`, `toggleSource(src)` (mismo patrón que `toggleCategory`), filtro en `applyFilters`: si hay marcadas → `result.filter(c => sourcesOf(c).some(s => selected.includes(s)))`; **ninguna marcada = todas**; añadir a `hasActiveFilters` y `clearFilters`.
- `app.component.html` — nuevo `filter-group` "Fuente" tras "Mes de cierre" (patrón `checkbox-group` existente, líneas 95-127): `@for (s of sources; track s.value)`, `[checked]="store.selectedSources().includes(s.value)"`, `(change)="store.toggleSource(s.value)"`, `data-testid="checkbox-source-{{s.value}}"`.
- `app.component.ts` — `sources: { value: ContestSource; label: string }[]` derivado de `FEED_SOURCES` + `SOURCE_LABELS`.
- **Sin refetch** — se filtra lo ya descargado (evita re-peticiones; compromiso ético 4 de MULTI_SOURCE_PLAN). Tarjeta fusionada aparece si alguna de sus fuentes está marcada (ej. "solo Letras Españolas" → ~182 tarjetas, no 8).
- Responsive: el media query de `.filters-row` (`app.component.scss:1174`) ya gestiona grupos extra.

**D1 — Badge de fuente en card** (`app.component.html:274-281`)
- `card-footer` pasa a flex: chips a la izquierda, botón "Ver bases completas" a la derecha.
- Chip por cada fuente de `sourcesOf(contest)`:
```html
<span class="tag tag-source source-{{ src }}" role="listitem">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><!-- Lucide: rss (3 RSS) | database (letrasespanolas) --></svg>
  {{ SOURCE_LABELS[src] }}
</span>
```
- Métodos pequeños en `app.component.ts`: `sourcesOf(contest)`, `sourceLabel(src)`, `sourceIcon(src)` (o exponer `SOURCE_LABELS` en el componente) — mismo estilo que `getDisplayTitle`.
- SCSS: `.tag-source` chip ghost al estilo `.tag-country` (`app.component.scss:666-687`), variables CSS por tema (reutilizar patrón de `--badge-country-*` en `styles.scss`), icono 10px.

**D2 — Footer** (`app.component.html:290-293`)
- Ampliar a las 4 fuentes + **citación obligatoria**: enlace a `https://www.letrasespanolas.org` (el original, **no** el JSON de GitHub) con texto "Datos de Letras Españolas (letrasespanolas.org)".

**D6 — Docs**
- `docs/FASE1_PLAN.md` — marcar decisiones nuevas (ya hecho en esta actualización).

### E. Tests Jest (fixtures mínimos)
15. `dedup.spec.ts` — `normalizeUrl` (utm/www/trailing/slash), prioridad de colisión, unión de categorías, **unión de `sources`**, fill de deadline/amount/organizer.
16. `letralia.parser.spec.ts` — título desde description, Fecha→deadline, Premio→amount (`1.500 euros` sin cortar), categorías mapeadas + ruido ignorado.
17. `guiadeconcursos.parser.spec.ts` — amount del título, categorías filtradas, truncado `[…]`.
18. `letrasespanolas.parser.spec.ts` — split `|`, `parseDate`, JSON inválido / no-array → `[]`, `organizacion === 'No especificada'`.
19. `escritores.parser.spec.ts` — fixture XML mínimo + fixture Jina mínimo (formato `### [Title](url)` + `BASES -`).
- El store **no tiene tests** (no los hay en el repo) → orden y checkboxes se verifican manualmente en F.

### F. Verificación, docs, commits
20. `npm run build` + `npm run test` + manual `ng serve`:
    - log resumen de conteos por source en consola;
    - certamen duplicado escritores+JSON → **1 sola card** con **2 chips** de fuente;
    - badge presente en las 4 fuentes; footer con las 4 fuentes + cita de Letras Españolas;
    - **orden**: cierres futuros → cerrados → sin fecha al final (en "más antiguo" y "más reciente");
    - **checkboxes Fuente**: ninguna marcada = todas; "solo Letras Españolas" ≈ 182; combinar varias; `clearFilters` los resetea; `hasActiveFilters` reacciona;
    - filtros, búsqueda (debounce), temas, header scroll → sin regresiones.
21. Docs: `CHANGELOG.md` (`Unreleased → Added`: badge de fuente, filtro por fuente, orden con sin-fecha al final, 4 fuentes + cita) · `AGENTS.md` (línea "RSS Source" → 4 fuentes; la nota "No hay tests" es obsoleta — hay Jest con 31 tests).
22. Commits separados: `feat` (D completo) · `test` (E) · `docs` (F). Push con flujo `push-develop`. **El commit de C va primero.**

---

## Estimación y riesgos

**Restante estimado**: D ≈ 3-4h (ampliada) + E ≈ 2h + F ≈ 1h.

| Riesgo | Mitigación |
|--------|------------|
| allorigins flaky (500/408/522 ~1 de cada 3) | Cascada a jina; escritores fallback completo, wordpress degradado (descripción vacía, categorías del título) |
| Fallback jina degradado para wordpress | No es ruta rara: allorigins falla a menudo; ya contemplado (descripción vacía OK) |
| Categorías nuevas de Guia/Letralia no mapeadas | Fallback `['otro']` + smoke manual |
| JSON desaparece o cambia | Validar `Array.isArray` + `JSON.parse`; si falla → esa fuente `[]` |
| Duplicados con URL distinta (mismo certamen) | Fase 2 (fuzzy match por título) — fuera de alcance |
| Tarjetas fusionadas y filtro por fuente | Resuelto con `sources[]` (unión en dedup) — no filtrar por fuente ganadora |

## Fuera de alcance (explicitamente)

- P2 strategy pattern parsers (XML vs Jina) — **después**, como decidió el usuario
- Mover `rss.service.ts` a `src/app/data/services/` (refactor posterior)
- `LoggerService` (P2/P3)
- Fuzzy dedup por título (Fase 2)
- Re-fetch selectivo de fuentes (el filtro por fuente es visual; si se quiere, será decisión futura)
