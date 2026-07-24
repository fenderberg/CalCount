# CalCount — Overdrachtsdocument

> Lees dit eerst als je het project oppakt (bijv. in VS Code). Het beschrijft de huidige
> staat, hoe je het draait, welke keuzes gemaakt zijn en wat er nog open staat.

## TL;DR

CalCount is een **mobile-first PWA** (React + Vite) met een **Fastify-backend** (SQLite lokaal,
Postgres/Neon in productie, via Prisma) die als AI-proxy dient. Het is een
AI-ondersteunde calorietracker: profiel → dagbudget → eten loggen → gewicht volgen.
**Epics 1, 2 en 4 zijn gebouwd en end-to-end geverifieerd.** Epic 3 (AI-fotoherkenning) is
uitgesteld. De repo is voorbereid voor GitHub Pages + Render + Neon (zie
[deployment.md](deployment.md)); de Render-service zelf is nog niet aangemaakt.

Documenten: [prd.md](prd.md) (wat & waarom) · [architecture.md](architecture.md) (hoe) ·
[deployment.md](deployment.md) (online zetten) · dit bestand (overdracht).

## Status per epic

| Epic | Status | Wat er werkt |
|---|---|---|
| 1 — Fundament & budget | ✅ | Profielonboarding, TDEE/budget (Mifflin-St Jeor), één-getal-hoofdscherm met ring |
| 2 — Eten loggen | ✅ | Zoeken (Open Food Facts), handmatig, AI-tekstschatting, recent; dagtotaal + resterend; bewerken/verwijderen; bladeren tussen dagen |
| 3 — AI-fotoherkenning | ⏸️ Uitgesteld | Datamodel + contract voorbereid; niet gebouwd |
| 4 — Voortgang & bijsturen | ✅ | Gewicht bijhouden, trendgrafiek + streefgewicht, budget beweegt automatisch mee, doel bijstellen |

## Lokaal draaien

**Vereisten:** Node 20+ (getest op Node 25) en npm 10+.

> **Let op — sinds de Postgres-migratie (zie [deployment.md](deployment.md)) is er geen
> zero-config SQLite meer.** `api/prisma/schema.prisma` wijst nu op Postgres via
> `DATABASE_URL`/`DIRECT_URL`. Zet die in `api/.env` (zie `api/.env.example`) — eenvoudigst
> is dezelfde Neon-connection strings als productie ook lokaal te gebruiken (single-user
> hobby-app, geen aparte lokale Postgres nodig). Zonder een Neon-project aangemaakt
> werkt `npm run dev:api` dus nog niet.

```bash
# 1. Dependencies (alle workspaces)
npm install

# 2. Database migreren (Postgres/Neon; vereist DATABASE_URL/DIRECT_URL in api/.env)
npm run db:setup

# 3. Backend starten (http://localhost:3001)
npm run dev:api

# 4. In een tweede terminal: frontend (http://localhost:5173)
npm run dev:web
```

De frontend proxyt `/api/*` en `/health` naar de backend op poort 3001 (zie `web/vite.config.ts`).

**Tests** (de rekenlogica — de kern die correct moet zijn):

```bash
npm test        # 12 unit tests in packages/core
```

**Web production build** (typecheck + bundle + PWA service worker):

```bash
npm run build:web
```

## Repo-structuur

```
CalCount/
├─ docs/                     PRD, architectuur, deployment, dit bestand
├─ packages/core/            Gedeelde types + TDEE/budget-logica (pure functies + tests)
│  └─ src/
│     ├─ types.ts            UserProfile, BudgetResult, DaySummary, ...
│     ├─ calories.ts         calculateTDEE / calculateDailyBudget / summarizeDay
│     └─ calories.test.ts    12 tests
├─ api/                      Fastify backend
│  ├─ prisma/schema.prisma   Datamodel (Profile, FoodEntry, WeightEntry, FoodReference)
│  └─ src/
│     ├─ app.ts              buildApp() — de Fastify-app + route-registratie (geen listen)
│     ├─ server.ts           Lokale dev-entrypoint: buildApp() + .listen()
│     ├─ db.ts               Prisma-client (single-user: PROFILE_ID = 1)
│     ├─ validation.ts       Invoervalidatie profiel
│     ├─ routes/             profile · budget · entries · foods · weights
│     └─ services/           openFoodFacts.ts · aiEstimate.ts (Claude, degradeert zonder key)
├─ render.yaml               Render Blueprint: buildCommand/startCommand voor de backend
├─ .github/workflows/pages.yml  Bouwt web/dist en publiceert naar GitHub Pages
└─ web/                      React + Vite PWA
   └─ src/
      ├─ api.ts              Fetch-client naar de backend
      ├─ App.tsx             Onboarding vs. tabs (Vandaag / Voortgang)
      ├─ screens/            Onboarding · Home · LogSheet · Progress
      └─ components/         BudgetRing · EntryList · WeightChart · TabBar
```

## Datamodel (Prisma / SQLite)

- **Profile** — single-user (id=1): lengte, gewicht, geboortedatum, geslacht, activiteit, doeltempo, streefgewicht.
- **FoodEntry** — gelogd item: naam, source (`search`/`manual`/`ai`/`recent`/`photo`), gram, calorieën, macro's, isEstimate, loggedAt.
- **WeightEntry** — meting: gewicht, measuredAt.
- **FoodReference** — cache van producten (kcal/100g) uit Open Food Facts, handmatig of AI; voedt zoeken/recent en werkt offline.

## API (REST/JSON, single-user)

| Methode | Pad | Doel |
|---|---|---|
| GET/PUT | `/api/profile` | Profiel ophalen/opslaan (PUT = volledige vervanging) |
| GET | `/api/budget?date=YYYY-MM-DD` | Dagbudget (TDEE, budget, consumed, remaining, status) |
| GET/POST/PATCH/DELETE | `/api/entries` (`/:id`) | Eetlog CRUD; `?date=` filtert per dag |
| GET | `/api/foods/search?q=` | Producten zoeken (OFF + cache) |
| POST | `/api/foods/estimate` | AI-tekstschatting (503 zonder API-sleutel) |
| GET | `/api/foods/recent` | Recent gelogde items |
| GET/POST/PATCH/DELETE | `/api/weights` (`/:id`) | Gewicht CRUD; POST/DELETE synct profielgewicht |
| GET | `/health` | Health-check |

## Omgevingsvariabelen

De app werkt out-of-the-box zonder configuratie, behalve de AI-tekstschatting:

| Variabele | Waar | Nodig voor | Default |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | backend-omgeving | AI-tekstschatting (Epic 2) en later AI-foto (Epic 3) | — (feature degradeert netjes zonder) |
| `CALCOUNT_AI_MODEL` | backend-omgeving | AI-model kiezen | `claude-haiku-4-5` |
| `CALCOUNT_AI_PHOTO_MODEL` | backend-omgeving | Apart model voor AI-fotoherkenning (Epic 3) | valt terug op `CALCOUNT_AI_MODEL` |
| `PORT` | backend-omgeving (lokaal) | Poort backend bij `npm run dev:api` | `3001` |
| `DATABASE_URL` | backend-omgeving / Render | Postgres-verbinding (pooled, runtime) naar Neon | — |
| `DIRECT_URL` | backend-omgeving / Render | Postgres-verbinding (direct, alleen voor `prisma migrate`) | — |

Zie `api/.env.example`. Zet nooit een echte sleutel in de repo.

## Belangrijke keuzes (beslissingenlogboek)

Deze zijn met de opdrachtgever bevestigd tijdens de bouw:

- **PWA** i.p.v. native; **single-user** zonder login (v1).
- **Handmatig loggen is altijd de terugval** — werkt zonder internet en zonder AI-sleutel.
- **Voedingsbronnen gecombineerd:** Open Food Facts + handmatig + AI-tekst (+ AI-foto later).
- **Gewicht → budget:** een nieuwe meting werkt het profielgewicht bij → TDEE/budget bewegen mee.
- **Streefgewicht** optioneel, met voortgangslijn in de grafiek.
- **Rekenlogica geïsoleerd** in `packages/core` als pure, geteste functies.

## Hoe het geverifieerd is

- `packages/core`: 12 unit tests (TDEE, budget, ondergrens-clamping, dagstatus).
- API: handmatig getest per endpoint (curl) inclusief validatie en degradatie.
- Frontend: end-to-end in de browser gedreven (onboarding → budget → loggen via zoeken → dagtotaal → recent → bewerken/verwijderen → dagnavigatie → gewicht loggen → grafiek + streefgewicht → auto-herberekening budget).

## Bekende beperkingen / aandachtspunten

- **AI-tekstschatting** vereist `ANTHROPIC_API_KEY`; zonder sleutel toont de UI een nette uitleg en verwijst naar Zoeken/Handmatig.
- **Open Food Facts** heeft wisselende latency; de zoekopdracht heeft een time-out van 12s en valt terug op de lokale cache. Handmatig invoeren werkt altijd.
- **Web-bundle ~595 KB** door de grafiek-library (Recharts). Prima, maar code-splitting (grafiek lazy laden) is een nette latere optimalisatie.
- **Render's gratis tier slaapt na inactiviteit** — het eerste verzoek na een tijdje duurt een paar seconden extra terwijl de service wakker wordt. Acceptabel voor een single-user hobby-app.

## Openstaande punten & aanbevolen volgende stappen

1. **GitHub-push.** ✅ Gedaan — de repo staat op `github.com/fenderberg/CalCount`.
2. **Productie-deployment.** Repo-kant klaar voor GitHub Pages + Render + Neon (zie
   [deployment.md](deployment.md)): frontend bouwt en publiceert automatisch naar GitHub
   Pages via `.github/workflows/pages.yml`; backend blijft ongewijzigd Fastify/Prisma,
   klaar om via `render.yaml` op Render te draaien. Nog te doen: de Render-service zelf
   aanmaken (browser-actie, env-variabelen invullen) — zie deployment.md.
3. **Epic 3 — AI-fotoherkenning.** Contract staat in [architecture.md §5](architecture.md); vereist een `ANTHROPIC_API_KEY`. De log-flow en het datamodel zijn er al op voorbereid (de `photo`-bron bestaat).
4. **Optioneel (buiten PRD-scope):** barcodescanner, water/macro's, wearable-koppeling, multi-user + login.
