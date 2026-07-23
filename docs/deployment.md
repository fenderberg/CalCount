# CalCount — Deployment (voorstel: Netlify + Supabase)

> **Status: PLAN, nog niet uitgevoerd.** Dit document beschrijft hoe je CalCount online zet
> met Netlify (frontend + serverless functies) en Supabase (Postgres). De huidige codebase
> draait met een Fastify-backend + SQLite (lokaal); dit vergt een backend-herbouw naar
> serverless functies. Zie "Wat er nog gebouwd moet worden" onderaan.

## Waarom niet puur GitHub Pages / static hosting

CalCount is full-stack. De frontend is statisch (kan op elke CDN), maar de backend
(profielopslag, budget, eten zoeken, AI-proxy) heeft server-side logica en een database
nodig. Statische hosts (GitHub Pages, de statische kant van Netlify) kunnen dat niet draaien.
**Netlify Functions** (serverless) + **Supabase** (managed Postgres) leveren die backend
zonder dat je zelf een server beheert.

## Doelarchitectuur

```
Browser (PWA)
   │  /api/*
   ▼
Netlify (CDN: frontend  +  Functions: de API)
   │            │  ANTHROPIC_API_KEY (env)
   │            ▼
   │        Claude API (AI-tekst/foto-schatting)
   ▼
Supabase Postgres  ◀── functies gebruiken de SERVICE_ROLE-key (env)
```

**Aanbevolen aanpak:** de frontend praat **alleen** met Netlify Functions; de functies praten
met Supabase via de service-role-key. Dan staan er **geen secrets in de frontend of de repo** —
alle sleutels zijn env-variabelen in Netlify. Veiliger dan de frontend rechtstreeks met de
database laten praten (dat zou Row Level Security vereisen).

## Component-mapping

| Nu (lokaal) | Straks (deploy) |
|---|---|
| Fastify-server (`api/src/server.ts`) | `netlify.toml` + redirects `/api/*` → functies |
| Routes (`api/src/routes/*.ts`) | Netlify Functions in `netlify/functions/*` |
| Prisma + SQLite | `@supabase/supabase-js` tegen Supabase Postgres |
| `packages/core` (rekenlogica) | **Ongewijzigd hergebruikt** |
| Frontend `web/` | **Ongewijzigd**; blijft `/api/*` aanroepen (redirects regelen de rest) |

## Stap 1 — Supabase project + schema

Maak een Supabase-project aan (gratis tier). Draai deze SQL in de SQL-editor (Postgres-equivalent
van het Prisma-schema):

```sql
create table profile (
  id                  int primary key default 1,
  height_cm           real not null,
  weight_kg           real not null,
  birth_date          text not null,
  sex                 text not null,
  activity_level      text not null,
  goal_rate_kg_per_week real not null,
  target_weight_kg    real,
  updated_at          timestamptz not null default now()
);

create table food_entry (
  id          uuid primary key default gen_random_uuid(),
  logged_at   timestamptz not null,
  name        text not null,
  source      text not null,
  grams       real,
  calories    real not null,
  protein     real,
  carbs       real,
  fat         real,
  is_estimate boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on food_entry (logged_at);

create table weight_entry (
  id          uuid primary key default gen_random_uuid(),
  measured_at timestamptz not null,
  weight_kg   real not null
);
create index on weight_entry (measured_at);

create table food_reference (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  calories_per_100g  real not null,
  protein_per_100g   real,
  carbs_per_100g     real,
  fat_per_100g       real,
  source             text not null,
  external_id        text unique,
  last_used_at       timestamptz not null default now()
);
create index on food_reference (last_used_at);
```

> Omdat alle toegang via de service-role-key in de functies loopt, kun je Row Level Security
> uit laten (of aan met een policy die alleen de service-role toestaat). Zet **nooit** de
> service-role-key in de frontend.

## Stap 2 — Netlify configuratie

`netlify.toml` in de repo-root:

```toml
[build]
  command = "npm run build:web"
  publish = "web/dist"
  functions = "netlify/functions"

# Frontend blijft /api/* aanroepen; leid dat naar de functies.
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# SPA-fallback voor de PWA-routes.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Stap 3 — Env-variabelen (in Netlify → Site settings → Environment)

| Variabele | Waarde | Geheim? |
|---|---|---|
| `SUPABASE_URL` | project-URL uit Supabase | nee |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role-key uit Supabase | **ja** — alleen server-side |
| `ANTHROPIC_API_KEY` | je Claude-sleutel | **ja** |
| `CALCOUNT_AI_MODEL` | bv. `claude-haiku-4-5` (optioneel) | nee |

Voor lokaal draaien met `netlify dev`: zet dezelfde variabelen in een `.env` in de root
(gitignored — zie `.gitignore`).

## Stap 4 — Koppel GitHub aan Netlify

1. Push de repo naar GitHub (zie [handoff.md](handoff.md) → Openstaande punten).
2. Netlify → "Add new site" → "Import from Git" → kies de repo.
3. Build-instellingen komen uit `netlify.toml`. Vul de env-variabelen in. Deploy.

## Wat er nog gebouwd moet worden

Dit plan is **nog niet geïmplementeerd**. Concreet werk:

1. **Functies schrijven** in `netlify/functions/` die de bestaande routes vervangen:
   `profile`, `budget`, `entries`, `foods-search`, `foods-estimate`, `foods-recent`, `weights`.
   Hergebruik de logica uit `api/src/routes/*` en `api/src/services/*` en `packages/core`.
2. **Datalaag ombouwen** van Prisma naar `@supabase/supabase-js` (of Prisma met de Supabase-
   Postgres-connectiestring — dan blijft `schema.prisma` grotendeels herbruikbaar, met provider
   `postgresql`).
3. **`netlify.toml`** toevoegen (zie stap 2).
4. **Lokale dev** via `netlify dev` (draait functies + serveert de frontend). De huidige
   `npm run dev:api`/`dev:web` blijven werken voor de Fastify/SQLite-variant als je die wilt houden.
5. **Verifiëren** tegen een echt Supabase-project (kan pas met de env-variabelen ingevuld).

## Alternatief: alles op één Node-host

Wil je de Fastify-backend behouden (minste herbouw), host dan het geheel op een Node-host met
persistente opslag (Render, Railway, Fly.io — gratis tier, eigen account nodig). De
Fastify-server kan dan ook de gebouwde frontend serveren. Nadeel t.o.v. Netlify+Supabase: je
beheert een server en moet een persistent volume voor SQLite regelen (of alsnog naar Postgres).
