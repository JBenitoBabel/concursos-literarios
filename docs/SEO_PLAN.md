# Plan SEO: Concursos Literarios

**Fecha:** 2026-09-22  
**Proyecto:** Angular 17 SPA desplegado en Vercel  
**URL producción:** https://concursos-literarios.vercel.app  
**Repo:** https://github.com/JBenitoBabel/concursos-literarios

---

## Objetivo

Que la web aparezca en Google cuando busquen:
- "concursos literarios"
- "premios literarios"
- "certámenes literarios"
- "convocatorias literarias 2024/2025"
- "concursos de poesía/novela/relato"

---

## Arquitectura elegida: **Prerendering (SSG) + Meta Tags Dinámicos**

**Por qué no SSR:**
- Contenido público y estático (viene de RSS)
- Sin datos por usuario ni autenticación
- SSG es más simple, rápido y barato (Vercel Hobby incluye builds estáticos ilimitados)
- Google indexa mejor HTML prerenderizado que SPA CSR

---

## Fases de Implementación

### 1. Prerendering (SSG) + RSS en Build-time (CRÍTICO)

**Objetivo:** Generar `index.html` con los concursos ya renderizados en el build.

| Archivo | Acción |
|---------|--------|
| `package.json` | Instalar `@angular/prerender` |
| `angular.json` | Configurar `prerender` builder y routes |
| `prerender.config.ts` | Definir rutas a prerenderizar (`/`) |
| `scripts/build-rss-data.ts` | **Nuevo**: Fetch RSS en Node.js durante build, generar JSON estático |
| `src/app/services/rss.service.ts` | Modificar: leer JSON estático en browser (no fetch en runtime) |

**Flujo build:**
```
npm run build
  └─► scripts/build-rss-data.ts (fetch RSS → src/assets/rss-data.json)
  └─► ng build (prerender: usa rss-data.json → genera dist/.../index.html con HTML completo)
  └─► scripts/generate-sitemap.ts (genera sitemap.xml en dist/)
```

---

### 2. Meta Tags Dinámicos + Open Graph + Twitter Cards

**Objetivo:** Snippets atractivos en SERP y redes sociales.

| Tag | Implementación |
|-----|----------------|
| `<title>` | `MetaService.updateTitle()` - dinámico según filtros |
| `<meta name="description">` | `MetaService.updateDescription()` - 150-160 chars |
| `<meta property="og:title">` | Igual que title |
| `<meta property="og:description">` | Igual que description |
| `<meta property="og:image">` | **Estática**: `/assets/og-image.png` (1200x630) |
| `<meta property="og:url">` | URL canónica actual |
| `<meta property="og:type">` | `website` |
| `<meta name="twitter:card">` | `summary_large_image` |
| `<link rel="canonical">` | URL absoluta actual |

**Archivos:**
- `src/app/services/meta.service.ts` (nuevo)
- `src/app/app.component.ts` (inyectar MetaService, llamar en `applyFilters()`)

---

### 3. Structured Data (JSON-LD) — Para Rich Snippets

**Objetivo:** Que Google muestre fechas, premios, organizador directo en resultados.

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Event",
        "name": "Premio Nadal 2024",
        "url": "https://...",
        "endDate": "2024-03-31",
        "organizer": {"@type": "Organization", "name": "Editorial Destino"},
        "offers": {"@type": "Offer", "price": "18000", "priceCurrency": "EUR"}
      }
    }
  ]
}
```

**Archivos:**
- `src/app/components/json-ld/json-ld.component.ts`
- `src/app/components/json-ld/json-ld.component.html` (script type="application/ld+json")
- Integrar en `app.component.html` pasando `filteredContests()`

---

### 4. Sitemap.xml + robots.txt (Auto-generados en Build)

| Archivo | Contenido |
|---------|-----------|
| `sitemap.xml` | URL raíz + lastmod + changefreq daily |
| `robots.txt` | `User-agent: * / Allow: / / Sitemap: https://concursos-literarios.vercel.app/sitemap.xml` |

**Implementación:** `scripts/generate-sitemap.ts` ejecutado en `postbuild` (package.json)

---

### 5. Vercel Cron Diario (Rebuild Automático) — Datos frescos

**Objetivo:** Actualizar concursos diariamente sin intervención manual.

| Configuración | Valor |
|---------------|-------|
| Schedule | `0 3 * * *` (03:00 UTC diario) |
| Acción | `vercel deploy --prod` (trigger build) |
| Costo | **Gratis** en Vercel Hobby |

**Archivo:** `vercel.json` con `crons` config.

---

### 6. Google Search Console + Vercel Analytics

| Acción | Estado |
|--------|--------|
| Verificar propiedad (DNS TXT) | Pendiente |
| Enviar sitemap.xml | Pendiente |
| Vercel Speed Insights | ✅ Automático en Hobby |
| Vercel Web Analytics | Opcional (gratis) |

---

## Decisiones Tomadas

| Decisión | Opción elegida | Justificación |
|----------|----------------|---------------|
| **URLs por concurso** | **No** (lista única con anchors `#concurso-{id}`) | Evita complejidad SSR; contenido dinámico único |
| **Imagen OG social** | **Estática** (`/assets/og-image.png`) | Simple, consistente, sin dependencias externas |
| **Idiomas** | **Solo ES** | Audiencia objetivo hispanohablante |
| **Frecuencia actualización** | **Cron diario (03:00 UTC)** | Gratis, automático, datos siempre frescos |

---

## Archivos a Crear / Modificar

### Nuevos
```
docs/SEO_PLAN.md
prerender.config.ts
scripts/
  build-rss-data.ts      # Fetch RSS → src/assets/rss-data.json
  generate-sitemap.ts    # dist/sitemap.xml + robots.txt
src/app/services/meta.service.ts
src/app/components/json-ld/
  json-ld.component.ts
  json-ld.component.html
vercel.json              # crons + rewrites SPA
```

### Modificados
```
package.json              # + @angular/prerender, scripts build
angular.json              # + prerender config, assets rss-data.json
src/index.html            # + meta tags base, og:image
src/app/app.config.ts     # + Meta services
src/app/app.component.ts  # + MetaService, JsonLdComponent
src/app/services/rss.service.ts  # Leer assets/rss-data.json en browser
```

---

## Scripts package.json (propuestos)

```json
{
  "scripts": {
    "build": "npm run build:rss && ng build && npm run build:sitemap",
    "build:rss": "node scripts/build-rss-data.ts",
    "build:sitemap": "node scripts/generate-sitemap.ts",
    "prerender": "ng run concursos-literarios:prerender"
  }
}
```

---

## angular.json — Configuración Prerender (extracto)

```json
"architect": {
  "build": { "...": "..." },
  "prerender": {
    "builder": "@angular/prerender:prerender",
    "options": {
      "routes": ["/"],
      "guessRoutes": false
    }
  }
}
```

---

## vercel.json

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "crons": [{
    "path": "/api/cron-rebuild",
    "schedule": "0 3 * * *"
  }]
}
```

> **Nota:** Vercel Cron Jobs en Hobby requieren Functions (edge). Alternativa gratis: GitHub Actions con cron programado.

---

## Orden de Implementación Sugerido

1. **Prerender + RSS en build** (base para indexación)
2. **Meta tags + OG + Twitter** (snippets atractivos)
3. **JSON-LD** (rich snippets)
4. **Sitemap + robots** (indexación completa)
5. **Cron diario** (datos frescos)
6. **GSC + Vercel Analytics** (medición)

---

## Checklist de Validación Post-Deploy

- [ ] `curl https://concursos-literarios.vercel.app/` devuelve HTML con concursos (no `<app-root></app-root>`)
- [ ] `curl https://concursos-literarios.vercel.app/sitemap.xml` válido
- [ ] `curl https://concursos-literarios.vercel.app/robots.txt` válido
- [ ] Meta tags OG presentes en HTML
- [ ] JSON-LD válido (test: https://validator.schema.org/)
- [ ] Google Search Console: sitemap enviado sin errores
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

---

## Referencias

- [Angular Prerendering Guide](https://angular.io/guide/prerendering)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Event](https://schema.org/Event)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Open Graph Protocol](https://ogp.me/)
