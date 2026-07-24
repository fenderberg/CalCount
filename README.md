# CalCount

AI-ondersteunde calorietracker (mobile-first PWA).

## Documentatie

- **[docs/handoff.md](docs/handoff.md)** — lees dit eerst als je het project oppakt (staat, draaien, keuzes, openstaande punten).
- [docs/prd.md](docs/prd.md) — product requirements (wat & waarom).
- [docs/architecture.md](docs/architecture.md) — technische architectuur (hoe).
- [docs/deployment.md](docs/deployment.md) — online zetten (GitHub Pages + Render + Neon; repo-kant klaar, Render-service nog aan te maken).

## Status

- **Epic 1 — Fundament & Persoonlijk Caloriebudget: ✅ gebouwd en geverifieerd.**
- **Epic 2 — Eten loggen & dagoverzicht: ✅ gebouwd en geverifieerd.**
- **Epic 3 — AI-fotoherkenning: ⏸️ uitgesteld** (op verzoek overgeslagen; de AI-tekstschatting uit Epic 2 blijft wel werken).
- **Epic 4 — Voortgang & Bijsturen: ✅ gebouwd en geverifieerd.**

### Epic 4 in het kort

- **Gewicht bijhouden** — metingen toevoegen/verwijderen op het Voortgang-tabblad.
- **Verloop** — grafiek van je gewicht over tijd, met een streefgewicht-lijn.
- **Automatische herberekening** — een nieuwe meting werkt je profielgewicht bij, dus
  TDEE en budget bewegen mee (FR11).
- **Doel bijstellen** — afvaltempo en streefgewicht aanpasbaar in je profiel.

De app heeft nu onderin twee tabbladen: **Vandaag** (loggen + budget) en **Voortgang** (gewicht).

### Epic 2 in het kort

Eten loggen via vier bronnen, met **handmatig altijd als terugval** (werkt offline):

1. **Zoeken** — echte producten uit Open Food Facts (kcal/100g), portie op gewicht.
2. **Handmatig** — zelf naam + calorieën invoeren.
3. **AI-tekstschatting** — omschrijf een portie, Claude schat de calorieën.
4. **Recent** — eerder gelogde items met één tik opnieuw loggen.

Plus: dagtotaal + resterend budget (ring werkt live bij), items bewerken/verwijderen,
en tussen dagen bladeren.

> **AI-schatting vereist een `ANTHROPIC_API_KEY`.** Zonder sleutel degradeert de app
> netjes: de AI-tab toont een uitleg en verwijst naar Zoeken/Handmatig. Zet de sleutel
> (en optioneel `CALCOUNT_AI_MODEL`, bv. `claude-haiku-4-5` voor lagere kosten) in de
> omgeving van de backend.

## Structuur (monorepo, npm workspaces)

```
packages/core   Gedeelde types + TDEE/budget-rekenlogica (pure functies + tests)
api             Fastify backend + Prisma/SQLite + AI-proxy (later)
web             React + Vite PWA (mobile-first, Tailwind)
```

## Aan de slag

> De backend gebruikt Postgres (Neon) via Prisma — zie
> [docs/deployment.md](docs/deployment.md). Zet `DATABASE_URL`/`DIRECT_URL` in `api/.env`
> (voorbeeld in `api/.env.example`) voordat je `db:setup`/`dev:api` draait.

```bash
npm install            # alle workspaces
npm run db:setup       # past Prisma-migraties toe op de Postgres-database

# in twee terminals:
npm run dev:api        # backend op http://localhost:3001
npm run dev:web        # PWA op http://localhost:5173 (proxyt /api naar de backend)
```

## Tests

```bash
npm test               # unit tests van de rekenlogica (packages/core)
```

## Wat Epic 1 doet

1. **Onboarding** — profielformulier (lengte, gewicht, geboortedatum, geslacht, activiteit, doel).
2. **Budgetberekening** — TDEE via Mifflin-St Jeor × activiteitsfactor; dagbudget met veilig
   calorietekort en een ondergrens (waarschuwt bij een te streng doel).
3. **Hoofdscherm** — het "één-getal-scherm": resterend budget groot in een ring, plus budget
   en gegeten. Herberekent automatisch als het profiel/doel wijzigt.

De rekenlogica staat geïsoleerd in `packages/core` en is volledig getest.
