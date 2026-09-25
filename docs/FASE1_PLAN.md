# Plan Fase 1 — Multi-fuentes (4 fuentes)

> Investigación verificada en vivo: 2026-09-25 · Plan aprobado: 2026-09-25
> Base: `docs/MULTI_SOURCE_PLAN.md` (diseño) + `docs/REFACTOR_PLAN.md` (arquitectura objetivo)

---

## Contexto y decisiones tomadas

| Decisión | Detalle |
|----------|---------|
| Orden | **Fase 1 (multi-fuentes) primero**, P2 (strategy parsers XML/Jina) después — decisión del usuario 2026-09-25 |
| Virtual scrolling | **Descartado y revertido** (2026-09-25):185 items no lo justifican; la implementación con `cdk-virtual-scroll-viewport` sin `*cdkVirtualFor` no virtualizaba. Si escala → paginación/"cargar más", no virtual scrolling para grids |
| UI atribución | **Incluida**: badge de fuente en card + citación a Letras Españolas en footer (compromisos éticos 2 y5 de MULTI_SOURCE_PLAN) |
| Tests | **Incluidos**: Jest con fixtures para parsers y dedup |
| Filtro por fuente | No (solo si el usuario lo pide) |

---

## Verificación en vivo (2026-09-25)

| Componente | Estado real |
|---|---|
| Feed Letralia (45 items) | ✅ XML OK — `Fecha: 28/2/2027. Premio: 200 euros…` en `<description>`; `<category>` tipo `Concursos de microrrelato` |
| Feed Guiadeconcursos (12 items) | ✅ XML OK — categorías `Cuento-Relato`, `Por email-online` + tags libres; description truncada en `[…]` |
| JSON Letras Españolas (182 items) | ✅ CORS `*` (directo, sin proxy). **174/182 URLs = escritores.org** → dedup crítico. `categoria` usa `\|` (`'Relato corto\|Poesia'`) |
| `corsproxy.io` (proxy #2 actual) | ❌ **Muerto: exige API key (401)** — quitar de la cascada |
| `api.allorigins.win` | ⚠️ Flaky (500/408 ~1 de cada 3), funciona |
| `r.jina.ai` | ✅ Funciona. escritores: incluye descripción (BASES) → fallback completo. **WordPress: solo título+link+pubDate → fallback degradado** |
| CORS directo | escritores/letralia/guia: ❌ sin headers → proxy obligatorio. GitHub raw: ✅ `*` |
| `api.codetabs.com`, `cors.lol`, `whateverorigin`, `cors.eu.org` | ❌ 503/400/429 — no sirven como alternativas |

**Cascada resultante**: `[allorigins, jina]` para los 3 RSS; JSON directo sin proxy.

---

## Etapas

### A. Modelo y configuración
1. `src/app/models/contest.model.ts` — `export type ContestSource = 'escritores' | 'letralia' | 'guiadeconcursos' | 'letrasespanolas'` + `source?: ContestSource` en la interfaz (opcional, no rompe nada).
2. **Nuevo** `src/app/data/config/feed-sources.ts` — `FeedSource[]`:
   ```typescript
   interface FeedSource {
     id: ContestSource;
     url: string;
     kind: 'rss-escritores' | 'rss-wordpress' | 'json-letrasespanolas';
     useProxy: boolean; // false para raw.githubusercontent.com
   }
   ```
3. `src/app/data/config/contest-keywords.ts` — mapas de categorías por fuente:
   - Letralia: `Concursos de poesía→poesia`, `Concursos de cuento/narrativa/microrrelato→relato`, `Concursos de novela→novela`, `Concursos de ensayo→ensayo`, `Concursos de dramaturgia→teatro`, `Concursos de infantil→infantil`; **ruido a ignorar**: `Convocatorias en las que se puede participar por Internet`, `Convocatorias a publicaciones`, `Otros concursos y convocatorias`, artes plásticas/fotografía/audiovisuales.
   - Guia: `Poesía→poesia`, `Novela→novela`, `Cuento-Relato/Microrrelato→relato`, `Ensayo→ensayo`, `Dramaturgia→teatro`, `Infantil/Juvenil→infantil`; **ruido**: `Concursos Literarios`, `Por email-online`, tags libres en minúsculas.
   - Letras Españolas: `Poesia→poesia`, `Relato corto/Relato/Microrrelato→relato`, `Novela corta→novela`, `Teatro→teatro`, `Infantil→infantil`, `Otro→otro`; **split por `|`**.

### B. Parsers — `src/app/data/services/parsers/` (nuevo)
4. `source-parser.interface.ts` — `export interface SourceParser { parse(content: string): Contest[] }` (clases puras, sin DI; registro plano).
5. `xml-utils.ts` — `parseXml`, `getRssItems`, `getTextContent`, `getRssCategories` (mover helpers privados de `rss.service.ts:185-198`).
6. `escritores.parser.ts` — mover `parseRSS` (detección Jina: `Markdown Content:` + `URL Source:`), `parseJinaMarkdown`, `parseJinaEntry`, `parseContestItem`, `extractContestInfo`. Comportamiento idéntico al actual; etiqueta `source: 'escritores'`. La detección XML/Jina queda dentro (P2 la extraerá).
7. `letralia.parser.ts` — título real = description **antes de** `. Fecha:`; `deadline` con regex `Fecha:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})` + `parseDate` (`deadline.extractor.ts:36`); `amount` de `Premio:`; `prizeTypes` con `extractPrizeTypes`; categorías mapeadas de `<category>`; `pubDate` del RSS; description completo. Fallback jina degradado: título editorial + link + pubDate (sin deadline/amount).
8. `guiadeconcursos.parser.ts` — título del `<title>` (ya incluye premio); `amount` con `PRIZE_REGEX` sobre título; categorías filtrando ruido; description truncada en `[…]`; `deadline` best-effort con `extractDeadline(title + description)`; fallback jina degradado análogo.
9. `letrasespanolas.parser.ts` — JSON → `Contest[]`: validar `Array.isArray` (si no → `[]`); `titulo→title`, `url→link`, `fecha_limite` (`dd/mm/yyyy`) con `parseDate`, `organizacion==='No especificada'→undefined`, `pais→country`, `premio→amount`, `categoria` split `|` + map, `prizeTypes` con `extractPrizeTypes(premio + descripcion)`, `pubDate = new Date()`; `source: 'letrasespanolas'`.
10. `parser-registry.ts` — `const PARSERS: Record<ContestSource, SourceParser>` (añadir fuente = config + parser + 1 línea).

### C. Fetch + dedup
11. **Nuevo** `src/app/data/services/dedup.ts`:
    - `normalizeUrl` — exacto de `MULTI_SOURCE_PLAN.md:180-195` (quitar `utm_*`, hash, `www.`, trailing slash, lowercase).
    - `dedupeContests(contests: Contest[]): Contest[]` — prioridad `escritores > letrasespanolas > letralia > guiadeconcursos`; **unión de categorías**; rellenar `deadline`/`amount`/`organizer` del perdedor si el ganador no los tiene.
12. Refactor `src/app/services/rss.service.ts` — **contrato `fetchContests(): Observable<Contest[]>` intacto → `contest-store.service.ts` NO cambia**:
    - `forkJoin` sobre las 4 fuentes; por fuente `catchError → null`.
    - Si las 4 fuentes fallan → `throwError` → el store muestra estado de error + "Reintentar" (hoy es **inalcanzable**: `rss.service.ts:33-34` devuelve `of([])`).
    - Si al menos una OK → combinar no-null → parsers por fuente → `dedupeContests`.
    - **Cascada corregida**: quitar `corsproxy.io` (401); `[allorigins, jina]` para RSS; JSON directo (`responseType` apropiado, sin proxy).
    - Quitar los ~12 `console.log` de debug al mover código; conservar `console.warn/error` por fuente caída + 1 log resumen de conteos por source (verificación manual).
    - Sin sort en service (el store ya ordena por deadline).

### D. UI atribución
13. Badge de fuente en `card-footer` (`app.component.html:274-281`) — chip ghost estilo `tag-country` (variables CSS por tema); labels: `Escritores`, `Letralia`, `Guía de Concursos`, `Letras Españolas`. Icono Lucide (convención AGENTS.md, p.ej. `rss` o `globe`).
14. Footer (`app.component.html:291`) — ampliar a las 4 fuentes + **citación obligatoria**: "Datos de Letras Españolas (letrasespanolas.org)" enlazando al original (compromiso ético 5).

### E. Tests Jest (fixtures mínimos)
15. `dedup.spec.ts` — normalizeUrl (utm/www/trailing/slash), prioridad de colisión, unión de categorías, fill de deadline/amount.
16. `letralia.parser.spec.ts` — título desde description, Fecha→deadline, Premio→amount, categorías mapeadas + ruido ignorado.
17. `guiadeconcursos.parser.spec.ts` — amount del título, categorías filtradas, truncado `[…]`.
18. `letrasespanolas.parser.spec.ts` — split `|`, `parseDate`, `Array.isArray` inválido → `[]`, organizacion vacía.
19. `escritores.parser.spec.ts` — fixture XML mínimo + fixture Jina mínimo (formato `### [Title](url)` + `BASES -`).

### F. Verificación, docs, commits
20. `npm run build` + `npm run test` + manual `ng serve`:
    - log resumen de conteos por source en consola;
    - certamen duplicado escritores+JSON → **1 sola card**;
    - filtros, búsqueda (debounce), temas, header scroll → sin regresiones;
    - badge visible en las 4 fuentes; footer con cita.
21. Docs: `CHANGELOG.md` (`Unreleased → Added`), `AGENTS.md` (línea "RSS Source" → 4 fuentes; la nota "No hay tests" es obsoleta — hay Jest con31 tests).
22. Commits separados: `feat` (modelo/config/parsers/dedup/fetch/UI) · `test` · `docs`. Push con flujo `push-develop`.

---

## Estimación y riesgos

**Esfuerzo**: 5-7h (MULTI_SOURCE_PLAN) + 2h tests ≈ **7-9h**.

| Riesgo | Mitigación |
|--------|------------|
| allorigins flaky (500/408) | Cascada a jina; escritores fallback completo, wordpress degradado (solo título+link) |
| Fallback jina degradado para wordpress | Ruta rara (solo si allorigins falla); dedup enmascara solapamientos |
| Categorías nuevas de Guia no mapeadas | Fallback `['otro']` |
| JSON desaparece o cambia | Validar `Array.isArray` + longitud; si falla → esa fuente `[]` |
| Duplicados con URL distinta (mismo certamen) | Fase 2 (fuzzy match por título) — fuera de alcance |

## Fuera de alcance (explicitamente)

- P2 strategy pattern parsers (XML vs Jina) — **después**, como decidió el usuario
- Mover `rss.service.ts` a `src/app/data/services/` (refactor posterior)
- Filtro por fuente en UI
- `LoggerService` (P2/P3)
- Fuzzy dedup por título (Fase 2)
