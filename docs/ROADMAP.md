# Roadmap y estado de planes

> Última revisión: 2026-10-29
> Este archivo responde a **"¿qué está hecho y qué queda pendiente?"** — el detalle de cada desarrollo vive en su plan dentro de `docs/`. No duplicar aquí el contenido de los planes, solo su estado.

---

## Vista general

| Plan | Estado | Prioridad | Siguiente paso |
|------|--------|-----------|----------------|
| [`FASE1_PLAN.md`](./FASE1_PLAN.md) — Multi-fuentes (4 fuentes) | ✅ **Completado** (2026-09-25) | — | Nada; cerrado con 73 tests en verde |
| [`MULTI_SOURCE_PLAN.md`](./MULTI_SOURCE_PLAN.md) — Diseño multi-fuentes | ✅ **Ejecutado** (vía Fase 1) | — | Documento de diseño histórico |
| [`REFACTOR_PLAN.md`](./REFACTOR_PLAN.md) — SOLID + Angular best practices | 🟡 **Parcial (~70%)** | P1 (media) | Ver "Pendiente del refactor" abajo |
| [`PROPUESTAS_PLAN.md`](./PROPUESTAS_PLAN.md) — Formulario de propuestas + admin Firebase | 📋 **Aprobado, no iniciado** | P1 (siguiente) | Fase A: router + extracción de `HomeComponent` |
| [`SEO_PLAN.md`](./SEO_PLAN.md) — Prerender SSG, sitemap, JSON-LD, cron | ⏳ **Pendiente** | P2 | Prerender + `scripts/build-rss-data.ts` |
| [`NEWSLETTER_PLAN.md`](./NEWSLETTER_PLAN.md) — Newsletter email | ⏸️ **No iniciado** (P2 post-SEO) | P3 | Bloqueado por SEO + decisión de backend |

**Leyenda:** ✅ hecho · 🟡 parcial · 📋 aprobado sin empezar · ⏳ pendiente · ⏸️ bloqueado/no prioritario

---

## Pendiente del refactor (REFACTOR_PLAN)

Ya hecho:
- `ContestStoreService` con signals + filtros + computed
- Extractor separados (`data/extractors/`) + `contest-keywords.ts`
- Pipes puros (`category-class`, `category-label`, `month-label`, `prize-label`)
- `ThemeService` + `ScrollService` en `core/services/`
- `ChangeDetectionStrategy.OnPush` en `AppComponent`
- Debounce 300 ms en búsqueda
- Strategy pattern de parsers (PARSERS registry, hecho en Fase 1)

Queda:
- [ ] `LoggerService` condicional (hoy hay `console.log`/`warn` en `rss.service.ts`)
- [ ] Eliminar el último `$any($event.target)` del template
- [ ] Separar `filter.model.ts` de `contest.model.ts` (ISP)
- [x] ~~Virtual scrolling~~ — **descartado y revertido** (2026-09-25): 185 items no lo justifican; si escala, paginación / "cargar más"

---

## Dependencias y conflictos entre planes

| Relación | Detalle |
|----------|---------|
| `PROPUESTAS_PLAN` → `SEO_PLAN` | El router de PROPUESTAS (rutas `/enviar`, `/admin`) es base para el prerender SSG; al implementarse SEO, excluir `/admin` del sitemap/prerender |
| `PROPUESTAS_PLAN` ↔ `NEWSLETTER_PLAN` | **Conflicto de backend**: PROPUESTAS elige Firebase (Firestore + Auth); NEWSLETTER propone Supabase. Si se acomete NEWSLETTER, valorar unificar en un solo backend antes de añadir el segundo servicio |
| `SEO_PLAN` → `rss.service.ts` | El SSG implica mover la carga de feeds a build-time (`src/assets/rss-data.json`); `rss.service.ts` deberá leer el JSON estático en el browser |
| `REFACTOR_PLAN` ↔ todos | Los planes nuevos deberían seguir la arquitectura objetivo (extracción en servicios, pipes, OnPush) para no generar deuda |

---

## Decisiones abiertas (no bloquean ningún plan)

- [ ] ¿Mantener multi-tema (modern/scifi/wonderful/retro) o simplificar?
- [ ] ¿IndexedDB para cache histórico entre sesiones?
- [ ] ¿Service Worker / PWA para offline?

---

## Cómo mantener este archivo

1. Al **empezar** un plan: cambiar su estado a 🟡/⏳ y anotar el siguiente paso.
2. Al **terminar** una fase: actualizar la fila correspondiente (y las casillas de su plan).
3. Al **cerrar** un plan: marcar ✅ con fecha y retirar sus pendientes de aquí.
4. No copiar aquí el detalle técnico: enlazar al plan.
