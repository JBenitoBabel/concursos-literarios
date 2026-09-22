# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto está adherido al [Versionamiento Semántico](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Favicon de libro en SVG (`src/assets/favicon.svg`) con enlace desde `index.html` e ICO actualizado.

### Changed

### Fixed

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
