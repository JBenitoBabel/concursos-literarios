# Plan: Formulario de propuestas de concursos + admin con Firebase

> Plan aprobado: 2026-10-29 · Estado: **pendiente de implementación**
> Destino previsto al ejecutar: `docs/PROPUESTAS_PLAN.md` + enlace en la tabla de docs de `AGENTS.md`
> Base: decisiones del usuario 2026-10-29. Sustituye las decisiones iniciales (Upstash + JSON en repo) confirmadas por el usuario.

---

## Objetivo

Que cualquier persona pueda proponer un concurso desde la web, con **revisión manual obligatoria** antes de publicarse (nada aparece en el listado sin aprobación), anti-spam, comprobación de duplicados, limpieza automática de concursos pasados y **cero mantenimiento periódico**.

## Decisiones del usuario (2026-10-29)

| Decisión | Elección |
|----------|----------|
| Canal de revisión | Página de admin privada `/admin` con login **email + contraseña** (Firebase Auth) |
| Almacén de pendientes y aprobados | **Firebase Firestore** (plan Spark gratis) — sustituye a Upstash (pendientes) y al JSON en el repo (aprobados) |
| Anti-spam | Honeypot + validación de campos (+ mínimo 3 s de relleno) |
| Duplicados | Comprobación **antes de enviar** (URL normalizada) + ID determinista de documento |
| Limpieza de pasados | **Automática por TTL** de Firestore (~60 días tras el cierre); sin deadline → se purga desde admin |
| Navegación | **Añadir router** (extraer `<main>` a `HomeComponent`) |
| Aprobación | Manual en `/admin`; lo aprobado aparece **al instante** (lectura en runtime, sin redeploy) |

### Consideraciones explícitas del usuario
- "Que no requiera mucho mantenimiento" → TTL + un solo servicio gratis + sin tokens que caduquen.
- "Que no se suba de manera automática por si la gente miente o se equivoca" → `estado: 'pendiente'` por defecto; solo el admin cambia a `'aprobado'`.

---

## Arquitectura

```
/enviar (público)                     /admin (login)
   │ validación + honeypot                │ Aprobar / Rechazar
   │ check duplicado (URL normalizada)    │ (pendientes + borrado puntual)
   ▼                                      ▼
Firebase Firestore — colección `concursos`
   estado: 'pendiente'  ←── solo el admin la ve (no enumerable públicamente)
   estado: 'aprobado'  ←── lo lee la web pública
   purgeAfter (timestamp) ──► TTL la borra automáticamente
   ▼
App: forkJoin(RSS×4 + comunidad) → dedupeContests() → badge "Comunidad"
```

### Punto técnico clave
- **Firestore REST API + Auth por REST** con `HttpClient` existente — **cero dependencias nuevas**. El SDK de Firebase añadiría ~50-80 KB y roza el presupuesto de 500 KB (`angular.json` budgets).
- Config de Firebase (`apiKey`, `projectId`) es **pública por diseño** (SPA). La seguridad está en las **reglas de Firestore** + Firebase Auth, nunca en la config.
- Auth REST: `signInWithPassword` (identitytoolkit) → `idToken` (1 h) + refresh → `sessionStorage`.
- Firestore REST: `:runQuery` (listados), GET/PATCH/DELETE documentos, header `Authorization: Bearer <idToken>`; lecturas públicas con `?key=` de la config.

---

## Modelo del documento

Colección: `concursos` — **doc ID = `encodeURIComponent(URL normalizada)`** (clave de duplicado).

```
concursos/{urlKey}
  url           string   // enlace a las bases (obligatorio, http/https)
  urlKey        string   // === doc ID (la regla lo exige)
  title         string   // 5-200
  description   string   // 20-2000
  deadline      string | null   // ISO 'YYYY-MM-DD'
  organizer     string | null
  amount        string | null
  categories    string[] // valores de FilterCategory (≥1)
  prizeTypes    string[] // valores de FilterPrizeType (≥1)
  estado        'pendiente' | 'aprobado'
  submittedAt   string   // ISO
  approvedAt    string | null
  purgeAfter    timestamp | null   // (deadline ?? submittedAt) + 60 d → campo TTL
  website       ''       // honeypot, SIEMPRE vacío
```

- **Sin datos personales del proponente** (ni email ni IP): la revisión es solo sobre el concurso.
- Mapeo a `Contest`: `source: 'comunidad'`, `categories`/`prizeTypes` ya en formato filtro, `pubDate = approvedAt ?? submittedAt`, `rawDescription = description`.

### Duplicados (3 capas)
1. **Antes de enviar (cliente)**: `normalizeUrl()` (ya existe en `dedup.ts`) contra los concursos cargados en memoria (RSS + comunidad) → "ya aparece en el listado".
2. **Antes de enviar (Firestore)**: `get()` por doc ID → existe y `aprobado` → "ya en el listado"; existe y `pendiente` → "pendiente de revisión"; no existe → enviar.
3. **Red**: el `create` falla si el doc ya existe (condición de carrera) → mensaje amable de "pendiente de revisión".
- Si un duplicado respecto a un feed RSS se cuela, `dedupeContests()` lo fusiona en el frontend (misma URL → chips de fuentes unidos).

---

## Reglas de Firestore (pieza central — boceto)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /concursos/{docId} {
      // Lectura: pública solo por ID exacto (docs sin PII);
      // list solo de aprobados (la query pública DEBE filtrar estado=='aprobado');
      // el admin (auth != null) puede listar todo.
      allow get: if true;
      allow list: if request.auth != null || resource.data.estado == 'aprobado';

      // Creación pública solo como pendiente, con validación y honeypot
      allow create: if request.resource.data.estado == 'pendiente'
        && request.resource.data.urlKey == docId
        && request.resource.data.title is string
        && request.resource.data.title.size() >= 5
        && request.resource.data.description.size() >= 20
        && request.resource.data.categories is list && request.resource.data.categories.size() >= 1
        && request.resource.data.prizeTypes is list && request.resource.data.prizeTypes.size() >= 1
        && request.resource.data.website == '';

      // Cambiar estado / borrar: solo admin autenticado
      allow update, delete: if request.auth != null;
    }
  }
}
```

---

## Fases de implementación

> Regla de trabajo: **parada de verificación manual tras cada fase** (preferencia de la usuaria).

### Fase A — Router + extracción (frontend puro, sin Firebase)
1. `app.config.ts`: `provideRouter([{path:'', component: HomeComponent}, {path:'enviar', loadComponent}, {path:'admin', loadComponent}, {path:'**', redirectTo:''}], withInMemoryScrolling({scrollPositionRestoration:'enabled'}))`.
2. Extraer de `AppComponent` el `<main>` (filtros + lista + estados vacíos/loading/error) y sus miembros (`toggleFilters`, `filtersOpen`, `activeFilterCount`, `formatDate`, `isDeadlineSoon/Passed`, `sourcesOf`, `sourceLabel`, array `sources`, `trackByLink`…) a `features/contests/home.component.*`.
   - **AppComponent queda como shell**: header + `<router-outlet>` + footer.
   - Conservar intacta la lógica del header: `InViewportDirective` con **hysteresis 40/80** (bug conocido: recrear observer por modo y sincronizar con `window.scrollY` en `ngOnInit`).
   - `ContestStoreService.loadContests()` se dispara desde `HomeComponent.ngOnInit` (o se mantiene en shell — decidir al ejecutar; preferible en Home para no cargar RSS en `/admin`).
3. Dividir `app.component.scss` (1437 líneas): filtros/tarjetas/estados → `home.component.scss`; header/footer se quedan; utilidades compartidas (`.icon`, `.visually-hidden`, `.btn` base) → `styles.scss` (verificar que no duplican reglas globales existentes). Los `@media` 768/480 se parten según el selector.
4. `vercel.json` nuevo con rewrite SPA: `{ "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }` — sin él, entrar directo a `/enviar` o `/admin` da 404 en Vercel.
5. Enlace "Proponer un concurso" en el footer (Lucide `send`, `routerLink="/enviar"`). `/admin` **no se enlaza** públicamente.
- **Verificación**: `npm run build` ✓ · `npm run test` (73) ✓ · `ng serve` manual: 4 temas × desktop/móvil, filtros, orden, buscador, scroll del header, acordeón móvil.

### Fase B — Firebase + nueva fuente "comunidad"
1. **Pasos manuales de Julia** (instrucciones al ejecutar): crear proyecto Firebase → Firestore (modo producción, región UE) → Auth email/contraseña (crear su usuario) → desplegar reglas → activar **TTL** en `purgeAfter` → añadir dominios autorizados (`concursos-literarios.vercel.app`, `localhost`, previews `*.vercel.app` si se quiere probar el login allí) → copiar config web.
2. `src/app/data/config/firebase-config.ts` + `src/app/services/firebase.service.ts` (REST: `runQuery`, `get`, `signInWithPassword` + refresh; `catchError` → `[]` tolerando caídas, igual que las 4 fuentes).
3. Nuevo `ContestSource: 'comunidad'`:
   - `contest.model.ts` (unión) · `feed-sources.ts` `SOURCE_LABELS.comunidad = 'Comunidad'` · `dedup.ts` `SOURCE_PRIORITY.comunidad = 4` (pierde ante fuentes oficiales).
   - `PARSERS` → `Partial<Record<ContestSource, SourceParser>>` (la comunidad no es un feed; `rss.service.ts` solo recorre `FEED_SOURCES`).
   - Badge `.source-comunidad` (SCSS + color por tema), icono propio en el pie de tarjeta (switch de iconos de fuente), **checkbox "Comunidad" en filtros** (el array `sources` de la UI no se deriva de `FEED_SOURCES` para este caso), mención en el subtítulo del header.
4. `store.loadContests()`: `forkJoin([rssService.fetchContests(), firebaseService.fetchApproved()])` → concatenar → `dedupeContests()`.
- **Verificación**: crear un doc `aprobado` a mano (consola Firebase) → aparece en la lista con badge "Comunidad" y checkbox de filtro funcionando; query pública sin `estado=='aprobado'` → denegada.

### Fase C — Formulario `/enviar`
1. `SubmitComponent` standalone con **ReactiveFormsModule**: título, URL, descripción, categorías (checkboxes, ≥1), tipos de premio (checkboxes, ≥1), fecha de cierre y organizador/dotación opcionales — reutilizando `FilterCategory`/`FilterPrizeType` (labels con pipes existentes) para que los filtros funcionen directos.
2. Honeypot (input `website` oculto, `tabindex=-1`, `autocomplete=off`) + mínimo 3 s desde el render + validación cliente; la **reglas de Firestore son la validación server-side** (doble barrera, sin funciones serverless).
3. Flujo de duplicados con mensajes claros: "ya aparece en el listado" / "está pendiente de revisión" / envío correcto.
4. Éxito: "¡Gracias! Tu propuesta se revisará antes de publicarse" (sin promesa de plazo). Botón de envío deshabilitado mientras dura el request; errores de red reintentables.
- **Verificación**: propuestas válidas/inválidas/duplicadas/honeypot relleno → ver `pendiente` (o rechazo por reglas) en consola Firebase.

### Fase D — Admin `/admin`
1. Login (REST `signInWithPassword`, token en `sessionStorage` + refresh; logout).
2. Lista de **pendientes** (título, URL, fechas, categorías, `submittedAt`) con:
   - **Aprobar** → PATCH `estado:'aprobado'`, `approvedAt`, `purgeAfter` calculado → visible al instante en la web.
   - **Rechazar** → DELETE (con confirmación).
3. Sección de **aprobados recientes** con borrado puntual (limpieza manual complementaria al TTL; útil para docs sin `deadline`).
4. Sin token → formulario de login; `noindex` en la vía de entrada (Meta service).
- **Verificación**: ciclo completo pendiente → aprobar → aparece en pública; rechazar → desaparece; sin sesión → sin datos.

### Fase E — TTL, tests y docs
1. Confirmar política TTL activa en consola (borrado automático ~60 días tras cierre; sin `deadline` no se purga → borrar desde admin).
2. Tests Jest (73 existentes en verde + nuevos): mapeo doc→Contest, clave de duplicado (`normalizeUrl` ya tiene specs), validadores puros del formulario.
3. Docs: `CHANGELOG.md` (entrada en Unreleased), `AGENTS.md` (árbol de estructura + tabla de docs enlazando este plan + nota "5 fuentes: 4 RSS + comunidad").
4. Deploy **preview** → end-to-end (enviar → admin → aprobar → visible) → producción.
   - **No olvidar**: dominio de producción en Auth authorized domains antes de probar el login en vivo.

---

## Mantenimiento resultante ≈ 0
- Firebase Spark gratis: ~1 GiB, ~50k lecturas/día, 20k escrituras/día — sobrado (hoy ~185 concursos, pocas propuestas/día).
- TTL limpia solo; solo se toca `/admin` cuando hay propuestas pendientes.
- Sin tokens con caducidad (antes: PAT GitHub cada ~12 meses), sin deploys por aprobación.
- Riesgo residual a vigilar: cuota gratuita (margen enorme) y reglas de Firestore si se amplía el esquema.

## Riesgos y notas
| Riesgo | Mitigation |
|---|---|
| Extracción del `<main>` rompe estilos | Fase A aislada, verificación visual manual 4 temas × 2 breakpoints antes de seguir |
| Presupuesto de bundle (500 kB warning) | REST en vez de SDK Firebase; sin dependencias nuevas |
| Reglas mal escritas → cola expuesta o público writable | Boceto en este plan + pruebas en Fase B (query sin `estado` debe fallar) |
| `/enviar` y `/admin` dan 404 en Vercel | `vercel.json` rewrite en Fase A |
| Duplicado respecto a un RSS se cuela | `dedupeContests()` como red de seguridad final |
| **Conflicto con `NEWSLETTER_PLAN.md`** (propone Supabase + Resend, P2) | Si se acomete después, valorar unificar backend (Firebase Auth/Firestore vs Supabase) — anotar decisión entonces |
| Prerender futuro (`SEO_PLAN.md`) | El router facilita prerender; excluir `/admin` (y valorar `noindex` en `/enviar`) |

## Estimación
~6-9 h repartidas en las 5 fases (A ~2 h, B ~1,5 h, C ~1,5 h, D ~1,5 h, E ~1 h) + pasos manuales de configuración de Firebase (~30 min).

## Fuera de alcance (v1)
- Notificaciones email al proponente (posible con Auth/Email de Firebase después).
- Edición de propuestas antes de aprobar (aprobar tal cual o rechazar).
- Registro/login de usuarios públicos.
- CAPTCHA (Turnstile) — se añadiría solo si el honeypot no aguanta.
