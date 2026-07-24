# CalCount — Overdracht

> Actuele instap voor ontwikkeling. Bijgewerkt op 2026-07-24.

## Stand van zaken

CalCount is een mobile-first React/Vite-PWA met een Fastify-backend en Prisma/Postgres
op Neon. GitHub Pages en Render zijn live. De app is single-user met een eenvoudige
login-gate uit omgevingsvariabelen.

| Epic | Status | Actuele functionaliteit |
|---|---|---|
| 1 — Fundament & budget | ✅ | Profiel, Mifflin-St Jeor, doeltempo, veilig dagbudget en budgetring |
| 2 — Eten loggen | ✅ | Zoeken, handmatig, AI-tekst, recent, CRUD, daghistorie en budgetstatus |
| 3 — AI-fotoherkenning | ⏸️ Geparkeerd | Camera/galerij, compressie, AI-route en read-only preview; correctie/opslag en accuracy-check open |
| 4 — Voortgang | ✅ | Gewicht CRUD, trendgrafiek, streefgewicht en automatische budgetherberekening |
| 5 — Motivatie | ✅ | Streak, vaste tijdzone, permanente awards en tijdelijke badgepopup bij openen Voortgang |
| 6 — AI-advies | ✅ | Wekelijkse inzichtsnapshots en sessiegebaseerde AI-coach met daglimiet |

Epic 6 is afgerond. Epic 3 blijft geparkeerd totdat fotofunctionaliteit opnieuw wordt geprioriteerd.

## Canonieke documentatie

- [prd.md](prd.md) — requirements, epics en acceptance criteria.
- [design.md](design.md) — definitieve visuele en interactionele designspecificatie.
- [architecture.md](architecture.md) — actuele stack, modellen en API-contracten.
- [deployment.md](deployment.md) — live hosting, configuratie en deploycontrole.
- BMAD-bestanden in `_bmad-output/` zijn planning-, story- of historische bronartefacten.
  Bij verschillen zijn de documenten in `docs/` leidend.

## Lokaal draaien

Vereisten: Node 20+, npm 10+ en geldige Postgres/Neon-connection strings.

```bash
npm install
npm run db:setup

# twee terminals
npm run dev:api
npm run dev:web
```

De API gebruikt `api/.env`; zie `api/.env.example`. De web-devserver proxyt `/api` en
`/health` naar `localhost:3001`.

## Verificatie

```bash
npm test
npm exec -w api tsc -- --noEmit
npm exec -w api prisma validate
npm run build:web
npm run docs:check
```

Actuele uitslag: 32 unit tests slagen, API-typecheck en Prisma-validatie slagen en de
PWA-productiebouw slaagt. De bundle is ongeveer 610 kB; Recharts lazy-loaden blijft een
latere optimalisatie.

`npm run docs:check` borgt de canonieke documenten, lokale links, bekende drifttermen,
API-routecoverage, de nieuwste migratie, BMAD-status en een maximale reviewleeftijd van
45 dagen. GitHub Actions draait deze check op pull requests, pushes naar `main`, iedere
maandag en handmatig.

De Epic 5-migraties en `20260724150000_add_theme_and_epic6` zijn op 2026-07-24 succesvol
op Neon toegepast. De frontend-/backendcode moet nog via de normale commit/deploy naar
GitHub Pages en Render.

## Repo-structuur

```text
CalCount/
├─ docs/                     Canonieke documentatie
├─ packages/core/src/        Types, calorie-, datum- en streaklogica + tests
├─ api/
│  ├─ prisma/                Postgres-schema en migraties
│  └─ src/
│     ├─ routes/             auth, profile, budget, logdata, badges en AI-advies
│     └─ services/           auth, Open Food Facts en Anthropic
├─ web/src/
│  ├─ screens/               Login, Onboarding, Home, LogSheet, Progress
│  └─ components/            BudgetRing, EntryList, WeightChart, TabBar
├─ .github/workflows/        GitHub Pages deployment
└─ render.yaml               Render Web Service
```

## Datamodel

- **Profile** — één profiel (`id = 1`) met lichaamsgegevens, doel, tijdzone en thema.
- **FoodEntry** — gelogde voeding met bron, kcal, gram, macro's, schattingsvlag en dag.
- **FoodReference** — lokale voedingsreferentie/cache.
- **WeightEntry** — gewichtsmeting; synchroniseert het actuele profielgewicht.
- **BadgeAward** — permanent toegekende badge met earn-datum.
- **AiInsight** — onveranderlijke wekelijkse AI-momentopname met bronvenster.
- **AiCoachUsage** — dagelijkse vraagteller; coachberichten worden niet opgeslagen.

Streaks zijn afgeleid en worden niet opgeslagen. De API berekent huidige/langste reeks
en totaal unieke logdagen telkens uit de actuele loghistorie. Daardoor tellen bestaande
items direct mee en herberekent verwijderen automatisch.

## API-overzicht

| Methode | Pad | Doel |
|---|---|---|
| `GET` | `/health` | Publieke healthcheck |
| `POST` | `/api/login`, `/api/logout` | Single-user sessie |
| `GET`, `PUT` | `/api/profile` | Profiel ophalen/vervangen |
| `GET` | `/api/budget?date=` | Dagbudget |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/entries` / `:id` | Eetlog CRUD |
| `GET` | `/api/foods/search?q=` | Product zoeken |
| `POST` | `/api/foods/estimate` | AI-tekstschatting |
| `GET` | `/api/foods/recent` | Recente items |
| `POST` | `/api/photo/analyze` | Fotoanalyse zonder opslag |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/weights` / `:id` | Gewicht CRUD |
| `GET` | `/api/streak?timeZone=` | Streakstatistieken |
| `GET` | `/api/badges` | Badge-evaluatie, awards en voortgang |
| `GET` | `/api/insights?timeZone=` | Laatste of nieuw wekelijks AI-inzicht |
| `GET` | `/api/coach/usage?timeZone=` | Resterende coachvragen vandaag |
| `POST` | `/api/coach` | Coachvraag met tijdelijke sessiehistorie |

## Omgevingsvariabelen

| Variabele | Doel |
|---|---|
| `DATABASE_URL` | Pooled Postgres-verbinding voor runtime |
| `DIRECT_URL` | Directe Postgres-verbinding voor migraties |
| `AUTH_USERNAME`, `AUTH_PASSWORD` | Login-gate |
| `AUTH_SECRET` | HMAC-ondertekening sessiecookie |
| `COOKIE_SECURE` | `true` in productie voor cross-origin cookie |
| `ANTHROPIC_API_KEY` | AI-tekst, foto, inzichten en coach |
| `CALCOUNT_AI_MODEL` | Default `claude-haiku-4-5` |
| `CALCOUNT_AI_PHOTO_MODEL` | Optionele foto-override |
| `PORT` | API-poort; lokaal standaard 3001 |

## Belangrijke besluiten en beperkingen

- Handmatig loggen blijft de functionele terugval als AI of Open Food Facts faalt.
- De vaste profieltijdzone bepaalt dag- en streakgrenzen, ook tijdens reizen.
- [design.md](design.md) is de designautoriteit; gamification gebruikt de rustige lila
  reward-familie en blijft ondergeschikt aan de budgetring.
- Light/dark-thema gebruikt semantische CSS-tokens; de keuze staat in het profiel.
- Fotoherkenning wordt niet verder afgebouwd totdat Epic 3 opnieuw wordt geprioriteerd.
- AI-coachgesprekken worden alleen in de browsersessie onthouden, niet persistent.
- Render free tier kan na inactiviteit een koude start hebben.

## Volgende stappen

1. De huidige Epic 5/6-code committen en naar GitHub Pages/Render deployen.
2. Productiecontrole uitvoeren voor profielthema, tijdelijke badgepopup, inzichten en coachlimiet.
3. Handmatige mobiele visuele controle uitvoeren voor swipe, popup, coachflow en dark mode.
4. Epic 3 alleen hervatten na een nieuw expliciet prioriteitsbesluit.
