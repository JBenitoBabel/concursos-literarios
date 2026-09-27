# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto está adherido al [Versionamiento Semántico](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Checkbox "Todas"/"Todos" como primera opción en los 4 grupos de filtros (categoría, tipo de premio, mes de cierre y fuente): marcado cuando el grupo no tiene filtro, indica que se muestran todos; al elegir una opción individual se desmarca y al desmarcar la última vuelve a marcarse.
- Redes sociales (Bluesky e Instagram) en el footer con iconos de Simple Icons, en la misma fila que el eslogan "Recursos escritoriles" y la autoría "© Julia Bengar"; crédito a Simple Icons en el pie y `meta author` en `index.html`.
- Panel de filtros colapsable en móvil (≤768 px): botón "Filtros" con contador de filtros activos y chevron; colapsado por defecto, con buscador y contador de resultados siempre visibles; en escritorio los filtros siguen siempre desplegados.
- Filtro por fuente con checkboxes en los filtros (ninguna marcada = todas las fuentes): aplica sobre lo ya descargado, sin volver a pedir los feeds, y se incluye en "Limpiar filtros".
- Chips de fuente en el pie de cada tarjeta con icono Lucide (`rss` para los RSS, `database` para Letras Españolas); las tarjetas fusionadas muestran todas sus fuentes.
- Footer con las 4 fuentes y citación a Letras Españolas (letrasespanolas.org), y subtítulo del header actualizado con las 4 fuentes.
- Listado con 4 fuentes de concursos (escritores.org, Letralia, Guía de Concursos y Letras Españolas): parsers por fuente, fetch en paralelo con tolerancia a fallos y deduplicación por URL normalizada que fusiona categorías y datos de cada tarjeta.
- Favicon de libro en SVG (`src/assets/favicon.svg`) con enlace desde `index.html` e ICO actualizado.
- Filtro "Sin fecha" en selector de mes para concursos sin fecha parseable.
- Campos `openTo` y `country` en el modelo `Contest`, con fila "Abierto a:" y badge de país en la tarjeta.
- Scrollbars tematizados (ventana y filtros) con variables CSS por tema y ajustes específicos para retro y sci-fi.

### Changed

- Cajas de los grupos de filtros alineadas y con la misma altura en escritorio: la caja de "Fuente" (con menos opciones) quedaba más pequeña y con la etiqueta por debajo del resto por la alineación inferior de la fila de filtros.
- Botón "Filtros" del acordeón con aspecto de cabecera (fondo `--bg-subtle`, borde, hover con `--bg-card` + borde `--accent`) y estado abierto con acento sólido (`--accent` con texto y badge invertidos), para que el estado activo sea inequívoco y no se confunda con el hover.
- "Ordenar por" (control segmentado de dos opciones que sustituye al `<select>` nativo) sacado del panel de filtros y ubicado en la barra de resultados junto al contador ("X concursos encontrados"): al ser una acción de vista y no un filtro, queda siempre visible en móvil sin abrir Filtros; las opciones llevan iconos Lucide de dirección (`arrow-up-narrow-wide` / `arrow-down-wide-narrow`) y en móvil se muestran en horizontal debajo del contador en lugar de apilarse dentro del panel.
- Hover de los chips del control segmentado corregido: `--accent-soft` coincide con `--bg-subtle` en el tema modern, por lo que no se veía; ahora usa `--bg-card` con borde interior, sin afectar al chip activo ni al anillo de foco.
- "Limpiar filtros" deja de resetear el orden de la lista: los filtros afectan al contenido y el orden a la presentación; se elimina `sortOrder` de `clearFilters()` para evitar cambios sorpresa.
- Limpieza de CSS muerto en `app.component.scss` (selectores `header-content`/`header-actions`/`header-side`, `.filter-actions` y bloque duplicado de `wonderful` en `.filters-section`).
- Búsqueda con debounce de 300 ms para no recalcular el listado en cada tecla.
- Iconos de UI unificados con Lucide: favicon con el glifo `book` del título, paths de iconos inline actualizados a la versión actual de Lucide y crédito voluntario en el footer.
- Botón `Limpiar filtros` reubicado debajo de la fila de filtros (no en línea) para mejor jerarquía.
- Paleta de los 4 temas revisada para accesibilidad AA y mayor viveza: `modern` más claro con glass 16px y radio 20, `wonderful` como Mr. Wonderful kraft `#fdf6e3` con `Caveat` manuscrita, `retro` 100% brutalist en amarillo realista `#fffbeb`, y `scifi` con grid cian sutil; fondos `cat`/`prize` más saturados por tema.
- Badge `¡Pronto!` sin animación y con color único por tema (sólido `#991b1b`/`#be123c`/`#000`/`#22d3ee` neón en `scifi`) distinto de `poesía` y `dinero`; `Cierre:` en `#0f172a`/`#4a044e`/`#000` visible y neón en `scifi`.
- Badges diferenciados por familia: país como rectángulo ghost 4px con icono `map-pin` en la cabecera de la tarjeta, categorías como pill con dot y premios como rectángulo 6px con icono y borde `color-mix`; filas separadas para categorías y premios con variables `--badge-country-*` por tema.
- Cabecera reorganizada: selector de temas a la derecha del título, encima de la fecha de actualización, y oculto al hacer scroll para reducir altura.
- La fecha del formato `BASES` se interpreta como fecha de cierre y se muestra como "Cierre:" en la tarjeta; los badges "¡Pronto!" y "Cerrado" se reactivan.
- Orden por defecto del listado: "Cierre más próximo primero"; etiquetas de orden y filtro de mes renombradas a cierre.
- Orden del listado por bloques: cierres futuros, después cerrados y concursos sin fecha al final; al elegir "Cierre más lejano primero" los bloques se invierten (sin fecha al principio).
- Se eliminan de la tarjeta la descripción redundante (formato `dd:mm:yyyy`), las filas "Organizador" y "Género" y el meta "Publicado" (el RSS real no incluye `pubDate`).
- El título se muestra sin el sufijo de país, ahora representado como badge.

### Fixed

- Parpadeo de la cabecera al quedar en el límite entre estado normal y colapsado; sustituido el `scroll` con umbral único por `IntersectionObserver` con histéresis 40/80 y colapso suave de subtítulo y selector.
- Filtrado por mes mostraba solo septiembre porque el RSS no incluye `<pubDate>` por item.
- La fecha `BASES` del RSS se mostraba como "Inicio" cuando en realidad es la fecha de cierre de la convocatoria.

## [0.1.0] - 2026-09-22

### Added

- Proyecto Angular 17.2 con standalone components, signals y `inject()`.
- UI con listado de concursos literarios, filtros (búsqueda, mes, tipo de premio) y 4 temas (`modern`, `scifi`, `wonderful`, `retro`) mediante CSS Variables.
- Servicio RSS (`rss.service.ts`): fetch y parsing del feed de escritores.org, con fallback a Jina AI markdown y cascada de 4 proxies CORS.
- Modelo de datos `Contest` y tipos de filtro (`contest.model.ts`).
- Despliegue en Vercel (`.vercel/project.json`).
- Documentación inicial en `/docs`: `REFACTOR_PLAN.md`, `MULTI_SOURCE_PLAN.md`, `SEO_PLAN.md`.
- Guía de agentes (`AGENTS.md`) con arquitectura objetivo, convenciones Angular 17+ y comandos principales.

### Changed

- Archivos del proyecto movídos a la raíz del repositorio (antes en subcarpeta `concursos-literarios/`).

[Unreleased]: https://github.com/JBenitoBabel/concursos-literarios/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/JBenitoBabel/concursos-literarios/releases/tag/v0.1.0
