# CalCount

AI-ondersteunde calorietracker (mobile-first PWA).

## Documentatie

- **[docs/handoff.md](docs/handoff.md)** — lees dit eerst als je het project oppakt (staat, draaien, keuzes, openstaande punten).
- [docs/prd.md](docs/prd.md) — product requirements (wat & waarom).
- [docs/architecture.md](docs/architecture.md) — technische architectuur (hoe).
- [docs/design.md](docs/design.md) — definitieve visuele en interactionele designspecificatie.
- [docs/deployment.md](docs/deployment.md) — live hosting op GitHub Pages + Render + Neon en de deployprocedure.

## Status

- **Epic 1 — Fundament & Persoonlijk Caloriebudget: ✅ gebouwd en geverifieerd.**
- **Epic 2 — Eten loggen & dagoverzicht: ✅ gebouwd en geverifieerd.**
- **Epic 3 — Gecombineerde AI-invoer: ✅ gebouwd** (tekst, foto of beide; correctie en multi-itemopslag zonder fotobewaring).
- **Epic 4 — Voortgang & Bijsturen: ✅ gebouwd en geverifieerd.**
- **Epic 5 — Motivatie & Gamification: ✅ gebouwd** (streak, permanente badge-awards en tijdelijke meldingen).
- **Epic 6 — AI-advies & Coach: ✅ gebouwd** (wekelijkse snapshots en sessiegebaseerde coach).
- **Epic 7 — Voedingsbalans: ✅ gebouwd** (dagelijkse macro-/vezelbalken en een rustig weekpatroon met datadekking).

### Epic 7

- Vandaag toont een compacte indicatie voor eiwit, koolhydraten, vet en vezels.
- Voortgang → Voeding toont het gemiddelde per gelogde dag, de macroverhouding en maximaal twee aandachtspunten.
- Richtwaarden volgen automatisch uit profiel, caloriebudget en afvaltempo; ontbrekende voedingswaarden tellen nooit als nul.
- Open Food Facts, AI-schattingen, recente items en optionele handmatige invoer leveren de voedingsdata.

### Epic 5

- Streak uit de volledige bestaande loghistorie, inclusief herberekening na wijzigingen.
- Vaste, wijzigbare profieltijdzone voor stabiele daggrenzen.
- Compacte logreeks op Vandaag; langste reeks en totaal logdagen zijn voorbereid voor badges.
- Permanente badges voor 3/7/30 dagen streak, 30 logdagen en positieve gewichtstrend.
- Nieuwe badges worden alleen kort getoond wanneer Voortgang wordt geopend.
- Voortgang-subtabs, swipeacties, budget-fit-preview en een profielgebonden light/dark-thema.
- Open-ringapp-logo, tweestaps onboarding en centrale log-FAB volgens het definitieve HTML-design.

### Epic 6

- Wekelijkse AI-inzichten uit een rollend venster van zeven dagen; eenmaal gemaakte
  inzichten blijven onveranderlijke momentopnamen.
- Nette lege- en fouttoestanden bij te weinig data of ontbrekende AI-configuratie.
- Interactieve AI-coach met geheugen binnen de geopende browsersessie, zonder
  persistente berichtopslag en met maximaal 20 succesvolle vragen per kalenderdag.
- AI-advies wordt expliciet als suggestie en niet als medisch advies gepresenteerd.

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
3. **AI-analyse (standaard)** — omschrijf een portie, voeg een foto toe of combineer
   beide; controleer alle herkende items en sla ze samen op. Foto's worden niet bewaard.
4. **Recent** — eerder gelogde items, ook uit een fotoanalyse, met één tik opnieuw loggen.

Plus: dagtotaal + resterend budget (ring werkt live bij), items bewerken/verwijderen,
en tussen dagen bladeren.

> **AI-schatting vereist een `ANTHROPIC_API_KEY`.** Zonder sleutel degradeert de app
> netjes: de AI-tab toont een uitleg en verwijst naar Zoeken/Handmatig. Zet de sleutel
> (en optioneel `CALCOUNT_AI_MODEL`, bv. `claude-haiku-4-5` voor lagere kosten) in de
> omgeving van de backend.

## Structuur (monorepo, npm workspaces)

```
packages/core   Gedeelde types + budget-, datum- en streaklogica (pure functies + tests)
api             Fastify backend + Prisma/Postgres + AI-proxy
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
npm test               # 35 unit tests van de domeinlogica (packages/core)
npm run docs:check     # documentatiedrift, links, routes, migraties en BMAD-status
```

## Wat Epic 1 doet

1. **Onboarding** — profielformulier (lengte, gewicht, geboortedatum, geslacht, activiteit, doel).
2. **Budgetberekening** — TDEE via Mifflin-St Jeor × activiteitsfactor; dagbudget met veilig
   calorietekort en een ondergrens (waarschuwt bij een te streng doel).
3. **Hoofdscherm** — het "één-getal-scherm": resterend budget groot in een ring, plus budget
   en gegeten. Herberekent automatisch als het profiel/doel wijzigt.

De rekenlogica staat geïsoleerd in `packages/core` en is volledig getest.
