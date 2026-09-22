---
name: push-develop
description: Use when the user wants to commit, upload, or push changes to the develop branch (e.g. "subir a develop", "push a develop", "commit y push"). Reviews the diff, formats the commit message properly, and updates CHANGELOG.md when applicable.
---

# Push a develop

Flujo para subir cambios a la rama `develop` con revisión, commit con formato correcto y actualización del changelog si aplica.

## Flujo obligatorio

Ejecuta estos pasos **en orden**. No hagas `git push` sin completar los anteriores.

### 1. Estado y revisión de cambios

```bash
git status -sb
git diff
git diff --stat
```

- Confirma que estás en `develop` (`git branch --show-current`). Si no, pide confirmación antes de cambiar.
- Revisa el diff completo: busca bugs evidentes, código muerto, secretos/keys, `console.log` olvidados, comentarios innecesarios.
- Si hay problemas, repórtalos al usuario y espera antes de continuar.
- Archivos que **nunca** deben subirse: `.env`, claves, `node_modules/`, basura de build.

### 2. Decidir si el CHANGELOG aplica

Actualiza `CHANGELOG.md` **solo si** los cambios son notables para quien usa o mantiene el proyecto:

| Cambio | ¿Actualiza CHANGELOG? |
|--------|----------------------|
| Feature nueva / comportamiento visible | Sí → `### Added` |
| Cambio en comportamiento, UI o interfaz existente | Sí → `### Changed` |
| Corrección de bug | Sí → `### Fixed` |
| Docs, refactor interno, CI, deps menores, estilo | No |
| Solo merge/rebase sin cambios propios | No |

Si aplica:

1. Edita la sección `## [Unreleased]` (nunca crees una versión nueva salvo que el usuario pida release).
2. Añade el bullet **bajo la subsección existente** (`Added` / `Changed` / `Fixed`). Si la subsección está vacía, escribe una línea en blanco tras el encabezado y añade el bullet.
3. Formato de bullet: frase corta en español, termina en punto, empieza con mayúscula. Menciona lo relevante (componente, archivo, comportamiento).
4. No toques versiones ya publicadas (`0.1.0`, etc.).

Ejemplo:

```markdown
## [Unreleased]

### Added

- Filtro por estado de convocatoria (abierta/cerrada) en la listado principal.

### Changed
```

Si **no** aplica, no toques el archivo.

### 3. Stage selectivo

```bash
git add <paths-intencionales>
```

- No hagas `git add -A` / `git add .` a ciegas. Añade solo los archivos relacionados con el cambio.
- Excluye basura, secrets y archivos no relacionados; coméntalos al usuario.

### 4. Commit con formato

Usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
<tipo>: <descripción corta en imperativo, minúsculas, sin punto final>
```

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

- Ámbito opcional en paréntesis: `feat(rss): ...`
- Un solo commit lógico por cambio; si hay varios cambios independientes, propón separarlos.
- Si el usuario da un mensaje explícito, úsalo (o pide confirmación si no cumple el formato).

Ejemplos del historial del repo:

```
docs: add refactor plan from SOLID/Angular audit
feat: add book favicon (SVG + ICO)
fix: handle empty RSS feed fallback
```

```bash
git commit -m "tipo: mensaje"
```

### 5. Push

```bash
git push origin develop
```

- Si el push falla por remotos adelantados, **no** hagas `push --force`. Propón `git pull --rebase origin develop` y vuelve al paso 1 si hay conflictos.
- Al terminar, resume: commits creados, changelog actualizado sí/no, y estado del push.

## Reglas duras

- Nunca `git push --force` a `develop` sin permiso explícito.
- Nunca commitear secretos.
- Nunca saltarte la revisión del diff.
- Si el usuario solo pide "revisar" sin subir, para en el paso 1.
