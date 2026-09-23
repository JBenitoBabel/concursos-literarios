# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto está adherido al [Versionamiento Semántico](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Favicon de libro en SVG (`src/assets/favicon.svg`) con enlace desde `index.html` e ICO actualizado.
- Filtro "Sin fecha" en selector de mes para concursos sin fecha parseable.
- Campos `openTo` y `country` en el modelo `Contest`, con fila "Abierto a:" y badge de país en la tarjeta.
- Scrollbars tematizados (ventana y filtros) con variables CSS por tema y ajustes específicos para retro y sci-fi.

### Changed

- Paleta de los 4 temas revisada para accesibilidad AA y mayor viveza: `modern` más claro con glass 16px y radio 20, `wonderful` como Mr. Wonderful kraft `#fdf6e3` con `Caveat` manuscrita, `retro` 100% brutalist en amarillo realista `#fffbeb`, y `scifi` con grid cian sutil; fondos `cat`/`prize` más saturados por tema.
- Badge `¡Pronto!` sin animación y con color único por tema (sólido `#991b1b`/`#be123c`/`#000`/`#22d3ee` neón en `scifi`) distinto de `poesía` y `dinero`; `Cierre:` en `#0f172a`/`#4a044e`/`#000` visible y neón en `scifi`.
- Badges diferenciados por familia: país como rectángulo ghost 4px con icono `map-pin` en la cabecera de la tarjeta, categorías como pill con dot y premios como rectángulo 6px con icono y borde `color-mix`; filas separadas para categorías y premios con variables `--badge-country-*` por tema.
- Cabecera reorganizada: selector de temas a la derecha del título, encima de la fecha de actualización, y oculto al hacer scroll para reducir altura.
- La fecha del formato `BASES` se interpreta como fecha de cierre y se muestra como "Cierre:" en la tarjeta; los badges "¡Pronto!" y "Cerrado" se reactivan.
- Orden por defecto del listado: "Cierre más próximo primero"; etiquetas de orden y filtro de mes renombradas a cierre.
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
