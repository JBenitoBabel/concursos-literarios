# Plan Newsletter: Concursos Literarios

**Fecha:** 2026-09-27  
**Proyecto:** Angular 17 SPA en Vercel + Supabase + Resend  
**Prioridad:** P2 (post-SEO/prerender)  
**Idioma:** Solo ES

---

## Objetivo

Sistema de suscripción email con dos frecuencias:
- **Diario (opcional):** Solo si hay convocatorias nuevas que coinciden con filtros del usuario
- **Mensual:** Resumen de las que se abren y las que cierran pronto (último mes)

Gratis para el usuario. Coste ~$0/mes hasta ~5k suscriptores.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Angular    │  │  API Routes  │  │   Cron Jobs (2)        │  │
│  │  (Static)   │──►│  /api/sub    │  │  • daily-new: 0 7 * * *│  │
│  │  + Forms    │  │  /api/prefs  │  │  • monthly: 0 8 1 * *  │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│         │                │                      │                │
│         ▼                ▼                      ▼                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE (Free Tier)                    │  │
│  │  • Auth (email magic link)  • Postgres (subs, prefs)      │  │
│  │  • Edge Functions (cron)    • Realtime (opcional)         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    RESEND (Free: 3k/mes)                   │  │
│  │  • Transactional API        • Templates React              │  │
│  │  • Suppression lists        • Webhooks (bounce/unsub)     │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Esquema DB (Supabase/Postgres)

```sql
-- Usuarios (Supabase Auth maneja auth.users)
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'web'
);

-- Preferencias por suscriptor
CREATE TABLE public.subscriber_preferences (
  subscriber_id UUID PRIMARY KEY REFERENCES public.subscribers(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{}',
  prize_types TEXT[] DEFAULT '{}',
  months TEXT[] DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  timezone TEXT DEFAULT 'Europe/Madrid',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de envíos
CREATE TABLE public.email_logs (
  id BIGSERIAL PRIMARY KEY,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  contest_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL,
  resend_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache de concursos para jobs
CREATE TABLE public.contests_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  description TEXT,
  pub_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  categories TEXT[] DEFAULT '{}',
  prize_types TEXT[] DEFAULT '{}',
  organizer TEXT,
  amount TEXT,
  country TEXT,
  source TEXT NOT NULL,
  source_id TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (link, source)
);

CREATE INDEX idx_contests_deadline ON public.contests_cache (deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_contests_pub_date ON public.contests_cache (pub_date DESC);
CREATE INDEX idx_contests_categories ON public.contests_cache USING GIN (categories);
CREATE INDEX idx_contests_prize_types ON public.contests_cache USING GIN (prize_types);
```

---

## API Endpoints (Vercel Edge Functions)

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/subscribe` | POST | Público | Double opt-in: crea subscriber `unconfirmed`, envía magic link |
| `/api/confirm` | GET | Token | Confirma email, marca `confirmed_at`, envía welcome |
| `/api/preferences` | GET/PATCH | JWT | Lee/actualiza preferencias |
| `/api/unsubscribe` | GET/POST | Token | One-click unsubscribe (token firmado) |
| `/api/webhooks/resend` | POST | Secret | Recibe bounce/complaint/unsub de Resend |

---

## Cron Jobs (Supabase Edge Functions)

```typescript
// supabase/functions/cron-daily-new/index.ts
// 07:00 UTC (08:00/09:00 Madrid según DST)
export async function handler() {
  const yesterday = subDays(new Date(), 1);
  const newContests = await supabase
    .from('contests_cache')
    .select('*')
    .gte('pub_date', yesterday)
    .eq('fetched_at', (await latestFetchDate()));
  
  const subscribers = await supabase
    .from('subscribers')
    .select('id, email, preferences!inner(frequency, categories, prize_types)')
    .eq('confirmed_at', notNull)
    .is('unsubscribed_at', null)
    .in('preferences.frequency', ['daily', 'both'])
    .or(`preferences.categories.cs.{${newContests.categories}},preferences.prize_types.cs.{${newContests.prize_types}}`);
  
  await sendBatch('daily_new', subscribers, newContests);
}

// supabase/functions/cron-monthly-summary/index.ts
// Día 1 a las 08:00 UTC
export async function handler() {
  const nextMonth = startOfMonth(addMonths(new Date(), 1));
  const endNextMonth = endOfMonth(nextMonth);
  
  const opening = contests con deadline en [now, nextMonth]
  const closing = contests con deadline en [now, endNextMonth]
  
  // Batch send a 'monthly' + 'both'
}
```

---

## Email Templates (React + Resend)

- `DailyNew.tsx`: Lista de convocatorias nuevas con tarjetas
- `MonthlySummary.tsx`: Dos secciones — "Se abren este mes" + "Cierran pronto"
- Footer en ambos: enlace unsubscribe + enlace preferencias

---

## Frontend Integration (Angular)

- `NewsletterFormComponent`: Formulario en home/footer con email + frecuencia + checkboxes categorías/premios
- `PreferencesPageComponent`: Página protegida (JWT) para editar filtros, frecuencia, timezone, unsubscribe
- Flujo magic-link: usuario recibe email → click → `/confirm?token=...` → redirect a preferences con sesión iniciada

---

## GDPR / LOPD (España)

| Requisito | Implementación |
|-----------|----------------|
| Consentimiento explícito | Checkbox "Acepto recibir newsletter" (no pre-marcado) |
| Double opt-in | Magic link en email → `/api/confirm?token=...` |
| Derecho olvido | `/api/unsubscribe` one-click + borrado datos en 30 días |
| Registro consentimiento | Tabla `subscribers` con `confirmed_at`, IP, user-agent |
| Política privacidad | Link en footer + checkbox form |
| Encargado tratamiento | DPA firmado con Supabase + Resend (ambos EU-ready) |

---

## Costes Estimados (Free Tier)

| Servicio | Free Tier | Límite ~gratis | Coste siguiente nivel |
|----------|-----------|----------------|----------------------|
| Supabase | 500 MB DB, 50k MAU, 2GB bandwidth | ~10k subs | $25/mes (Pro) |
| Resend | 3,000 emails/mes | ~1k subs (monthly) | $20/mes (50k) |
| Vercel | Hobby: 1 cron, 100GB bandwidth | Ilimitado static | $20/mes (Pro) |
| **Total** | **$0/mes** hasta ~3-5k suscriptores activos | | ~$45/mes a 10k |

---

## Fases de Implementación (P2)

| Fase | Entregable | Esfuerzo | Dependencias |
|------|------------|----------|--------------|
| 2.1 | Supabase project + DB schema + Auth config | 1 día | - |
| 2.2 | API `/subscribe`, `/confirm`, `/unsubscribe` + Resend | 2 días | 2.1 |
| 2.3 | Cron `daily-new` + `monthly-summary` (Edge Functions) | 2 días | 2.1, contests_cache refresh |
| 2.4 | Angular: NewsletterForm + Preferences page + magic-link | 2 días | 2.2 |
| 2.5 | Email templates (React Email) + testing | 1 día | 2.3 |
| 2.6 | GDPR: privacy policy, consent log, DPA suppliers | 0.5 días | Legal review |
| 2.7 | Monitoring: email logs dashboard, bounce alerts | 1 día | 2.3 |
| **Total** | **~9.5 días** | | |

---

## Integración con SEO/Prerender

El `scripts/build-rss-data.ts` del **SEO_PLAN** genera `rss-data.json` en build.  
Reutilizar: script paralelo hace `upsert` a `contests_cache` en Supabase.

```typescript
// scripts/sync-contests-to-supabase.ts (postbuild + cron)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, serviceRoleKey);

const contests = JSON.parse(readFileSync('src/assets/rss-data.json'));
await supabase.from('contests_cache').upsert(contests.map(c => ({
  ...c,
  fetched_at: new Date().toISOString()
})), { onConflict: 'link,source' });
```

---

## Decisiones Pendientes (para iniciar P2)

1. **Supabase Auth vs JWT propio** — Supabase da magic links gratis + sesiones; JWT es más simple pero más código
2. **Importar lista existente** — Si hay emails previos (CSV), flujo *re-permission* (GDPR)
3. **Tracking opens/clicks** — Resend lo da gratis; ¿política de privacidad lo cubre?
4. **Referral program** — "Invita a un escritor, gana mes premium" (futuro monetización)

---

## Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Resend React Email](https://react.email/)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-runtime)
- [Guía AEPD newsletters](https://www.aepd.es/es/prensa-y-comunicacion/notas-de-prensa/aepd-publica-guia-sobre-envio-comunicaciones-comerciales-electronicas)