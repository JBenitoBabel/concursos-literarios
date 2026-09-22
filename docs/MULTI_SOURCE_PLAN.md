# Plan de Fuentes Múltiples de Concursos

> Investigación y diseño — 2026-09-22

---

## Resumen

Ampliar la app de **1 fuente RSS** (escritores.org) a **4 fuentes** con parsers específicos y deduplicación, para cubrir más concursos literarios en español.

---

## Fuentes verificadas

| Fuente | Tipo de endpoint | Volumen | Calidad de datos |
|--------|------------------|---------|------------------|
| **escritores.org** (actual) | RSS/XML `https://www.escritores.org/recursos/escritores.xml` | ~100+/semana | Formato BASES estructurado |
| **Letralia** | RSS WordPress `https://letralia.com/category/convocatorias/feed/` | ~45 items | Descripción estructurada: `Nombre. Fecha: dd/mm/yyyy. Premio: …. Ámbito: …`. El `<title>` RSS es editorial (el nombre real está al inicio de la descripción) |
| **Guiadeconcursos** | RSS WordPress `https://www.guiadeconcursos.com/category/concursos-literarios/feed/` | ~13 items | Título con premio (`… – 1.500€`); `<category>` con género y modalidad (`Por email-online`) |
| **Letras Españolas** | **JSON GitHub** `https://raw.githubusercontent.com/groguer1/concursos-literarios/main/concursos.json` | **175 concursos** | Campos limpios: `titulo, categoria, fecha_limite (dd/mm/yyyy), premio, organizacion, pais, descripcion, url, nuevo`. CORS abierto en raw.githubusercontent.com |

### Descartadas

| Fuente | Motivo |
|--------|--------|
| escribir.com.ar | Sindica contenido idéntico de escritores.org → solo duplicados |
| finalescerrados.com | RSS de Blogger = artículos del blog, no el listado de concursos |
| delectoralector.com | RSS = reseñas de libros, no concursos |
| Google Sheets de Letras Españolas | CSV vacío (solo cabecera) |
| Fallback IA de Letras Españolas | Proxy + Claude solo en su web; no reutilizar |

### Nota de solapamiento

El JSON de Letras Españolas incluye muchos concursos de escritores.org (mismo `url` de escritores) → **deduplicar por URL normalizada**.

---

## Uso ético y licencias (verificado 2026-09-22)

| Fuente | ¿Uso permitido? | Base |
|--------|-----------------|------|
| escritores.org / Letralia / Guiadeconcursos (RSS) | **Sí** | RSS es un protocolo de sindicación: existe para que terceros se suscriban. Sus `robots.txt` no bloquean los feeds (Letralia solo pide `Crawl-delay: 5`). |
| Letras Españolas (JSON GitHub) | **Sí, con cita** | Su `llm.txt` lo declara explícito: *"Optimizado para citabilidad"*, *"Citar como fuente: Letras Españolas (letrasespanolas.org)"*. Sin LICENSE formal, pero los datos son información factual (bases públicas de concursos). URL correcta: `https://raw.githubusercontent.com/groguer1/concursos-literarios/main/concursos.json` (la raíz del repo no sirve el JSON). |

**Compromisos de la app (no robar contenido):**

1. Cada card enlaza al original (`link`) — ya en el modelo.
2. Badge/atribución de fuente en UI (previsto P2).
3. Descripciones resumidas, no copia íntegra de artículos.
4. Fetch con frecuencia razonable (1 petición por sesión/refresh, sin polling agresivo).
5. Citar Letras Españolas en un pie/acerca de si se usa su JSON.

---

## Cambios de modelo

### `contest.model.ts`

```typescript
export type ContestSource =
  | 'escritores'
  | 'letralia'
  | 'guiadeconcursos'
  | 'letrasespanolas';

export interface Contest {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  categories: string[];
  prizeTypes: string[];
  deadline?: Date;
  organizer?: string;
  amount?: string;
  genre?: string[];
  rawDescription: string;
  source?: ContestSource;   // nuevo — opcional para no romper nada
}
```

---

## Arquitectura del servicio

### Fuentes como configuración

```typescript
interface FeedSource {
  id: ContestSource;
  url: string;
  kind: 'rss-escritores' | 'rss-wordpress' | 'json-letrasespanolas';
  useProxy: boolean;   // false para raw.githubusercontent.com (CORS OK)
}
```

### Flujo `fetchContests()`

1. `forkJoin` en paralelo sobre las 4 fuentes.
2. Fuente fallida → `[]` (no rompe el resto); log warn.
3. Cada fuente se parsea con su parser dedicado.
4. **Deduplicación** global:
   - Clave: URL normalizada (quitar `utm_*`, trailing slash, host `www.`).
   - Si colisión: priorizar `escritores` / `letrasespanolas` (datos más estructurados) y **fusionar** `categories` de ambas.
5. Ordenar por `pubDate` descendente.

### Proxies CORS (mantener cascada actual)

```
https://api.allorigins.win/raw?url=
https://corsproxy.io/?url=
https://r.jina.ai/http://
https://r.jina.ai/https://
```

Solo se usan para los 3 RSS; el JSON de GitHub se puede pedir directo.

---

## Parsers por fuente

### 1. escritores.org — actual (mantener)

- XML RSS + fallback Jina markdown (`BASES - (dd:mm:yyyy / …)`).
- Sin cambios de lógica, solo etiquetar `source: 'escritores'`.

### 2. Letralia (RSS WordPress)

| Campo | Origen |
|-------|--------|
| `title` | Texto de `<description>` **antes de** `. Fecha:` (no el título editorial del RSS) |
| `link` | `<link>` |
| `deadline` | `Fecha: dd/mm/yyyy` del description |
| `amount` / prize | `Premio: …` del description |
| `categories` | Mapeo de `<category>` RSS: `Concursos de poesía` → `poesia`, `Concursos de cuento`/`narrativa`/`microrrelato` → `relato`, `Concursos de novela` → `novela`, `Concursos de ensayo` → `ensayo`, `Concursos de dramaturgia` → `teatro`, etc. |
| `description` | Description completo o restante |
| `pubDate` | `<pubDate>` |
| `source` | `'letralia'` |

Filtrar categorías no literarias si hace falta (`Concursos de periodismo`, `fotografía`, `artes plásticas`) — decidir si se incluyen en `otro` o se descartan.

### 3. Guiadeconcursos (RSS WordPress)

| Campo | Origen |
|-------|--------|
| `title` | `<title>` del RSS (ya incluye nombre + premio) |
| `amount` | Extraer del título: `– 1.500€` / `30.000€` |
| `categories` | `<category>`: `Poesía` → `poesia`, `Novela` → `novela`, `Cuento-Relato`/`Microrrelato` → `relato`, … |
| `prizeTypes` | Categoría `Por email-online` → indicador de envío online; texto con `€` → `dinero` |
| `description` | CDATA del `<description>` (recortar en `[…]`) |
| `source` | `'guiadeconcursos'` |

### 4. Letras Españolas (JSON)

```typescript
// GET https://raw.githubusercontent.com/groguer1/concursos-literarios/main/concursos.json
// → Contest[]
{
  title: item.titulo,
  link: item.url,
  description: item.descripcion,
  deadline: parseEsDate(item.fecha_limite),  // dd/mm/yyyy
  organizer: item.organizacion !== 'No especificada' ? item.organizacion : undefined,
  amount: item.premio,
  categories: mapCategoria(item.categoria),  // 'Poesia' → 'poesia', etc.
  pubDate: new Date(),  // el JSON no tiene fecha de publicación
  source: 'letrasespanolas',
  rawDescription: item.descripcion,
}
```

---

## Deduplicación (detalle)

```typescript
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace(/^www\./, '');
    // quitar query utm_* y hash
    [...u.searchParams.keys()].forEach(k => {
      if (k.startsWith('utm_')) u.searchParams.delete(k);
    });
    u.hash = '';
    let s = u.toString().replace(/\/$/, '');
    return s.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}
```

Prioridad en colisión: `escritores` > `letrasespanolas` > `letralia` > `guiadeconcursos`.

---

## UI (opcional, P2)

- Badge pequeño de fuente en cada card (texto o color sutil).
- Filtro por fuente solo si el usuario lo pide; no priorario.

---

## Orden de implementación sugerido

| Paso | Acción | Esfuerzo |
|------|--------|----------|
| 1 | Añadir `source?` al modelo + array de fuentes + `forkJoin` (solo etiquetar, parsers aún compartidos) | 1h |
| 2 | Parser Letralia (extraer nombre real + Fecha/Premio) | 1-1.5h |
| 3 | Parser Guiadeconcursos (título/€/categorías) | 1h |
| 4 | Parser JSON Letras Españolas (directo, sin proxy) | 0.5-1h |
| 5 | Deduplicación por URL normalizada + fusión de categorías | 1h |
| 6 | Verificación manual (`ng serve`): conteos por fuente, sin duplicados evidentes | 0.5h |
| 7 | (Opcional) Badge de fuente en UI | 0.5h |

**Total estimado: 5-7h.**

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Proxy CORS cae para un RSS | Cascada de 4 proxies + tolerancia a fallo parcial |
| Cambia el formato del description de Letralia | Regex con fallback a description crudo |
| JSON de GitHub desaparece o cambia | Validar `Array.isArray` y longitud; si falla, esa fuente → `[]` |
| Duplicados no detectados por URL distinta (mismo certamen, 2 sitios) | Fase 2: fuzzy match por título normalizado (sin acentos, sin "XX Premio…") |
| Feed Guiadeconcursos mezcla foto/pintura | Usar solo la categoría `concursos-literarios` del feed (ya filtrada) |

---

## Verificación

```bash
npm run build
# o
npx ng build

# manual en dev server:
npx ng serve
# - abrir app, comprobar badge/log de 4 fuentes
# - contar concursos por source en consola
# - buscar un certamen conocido que aparezca en 2 fuentes → solo 1 card
```

---

> **Relación con `REFACTOR_PLAN.md`**: este plan toca sobre todo `rss.service.ts` y `contest.model.ts`. Ver documento de prioridades: se recomienda **primero multi-fuentes** (valor para el usuario inmediato) y **después el refactor SOLID** (que ya prevé strategy pattern para parsers — al llegar ahí, los parsers por fuente ya existirán y encajan en la arquitectura objetivo).
