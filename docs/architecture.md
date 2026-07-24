# CalCount Fullstack Architecture

| | |
|---|---|
| **Project** | CalCount — AI-ondersteunde calorietracker |
| **Status** | Definitief, bijgewerkt naar de actuele codebase |
| **Bijgewerkt** | 2026-07-24 |
| **Productscope** | [prd.md](prd.md) |
| **UX/design** | [design.md](design.md) |

## 1. Overzicht

CalCount is een mobile-first PWA met een React/Vite-frontend, een Fastify-backend en een
Postgres-database op Neon. De backend is een monolithische Backend-for-Frontend en houdt
database- en AI-sleutels buiten de browser.

```text
Browser/PWA (React + Vite, GitHub Pages)
              │ HTTPS + bearer-token/cookie
              ▼
Fastify API (Render)
  ├─ Prisma ───────────────► Neon Postgres
  ├─ Anthropic SDK ────────► Claude (tekst/foto; later coach)
  └─ HTTP ─────────────────► Open Food Facts
```

De app blijft single-user: er is één profiel en één dataset. De login is een lichte
toegangsgate met één gebruikersnaam/wachtwoord uit omgevingsvariabelen, geen users-tabel
of multi-user-autorisatiemodel.

## 2. Monorepo en verantwoordelijkheden

```text
packages/core/  Pure domeinlogica, types en Vitest-tests
api/            Fastify-routes, Prisma en externe services
web/            React PWA, schermen, componenten en API-client
docs/           Canonieke product-, design-, architectuur- en deploydocumentatie
```

- `packages/core` bevat geen database- of netwerk-I/O.
- `api/src/app.ts` exporteert `buildApp()` en registreert alle plugins/routes.
- `api/src/server.ts` start hetzelfde app-object lokaal en op Render.
- `web/src/api.ts` is de centrale fetch-client en verstuurt primair het opgeslagen
  bearer-token; de sessiecookie blijft een compatibiliteitsroute.
- React Query beheert server-state en cache-invalidatie.

## 3. Stack

| Laag | Technologie |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| PWA | `vite-plugin-pwa` / Workbox |
| Server-state | TanStack React Query 5 |
| Grafiek | Recharts 2 |
| Backend | Node 20+, Fastify 5, TypeScript/tsx |
| Data | Prisma 6 + Postgres (Neon) |
| AI | Anthropic TypeScript SDK, server-side |
| Voedingsbron | Open Food Facts + lokale referentie-/recentdata |
| Tests | Vitest voor de pure domeinlogica |
| Hosting | GitHub Pages + Render + Neon |

## 4. Datamodel

### Profile

Eén rij met `id = 1`: lengte, actueel gewicht, geboortedatum, geslacht,
activiteitsniveau, doeltempo, optioneel streefgewicht en een vaste IANA-`timeZone` voor
kalenderdag- en streakgrenzen.

### FoodEntry

Een gelogd voedingsitem met naam, bron (`search`, `manual`, `ai`, `recent`, `photo`),
grammen, calorieën, optionele `protein`, `carbs`, `fat` en `fiber`, `isEstimate`,
`loggedAt` en `createdAt`. `null` betekent onbekend en telt bij de voedingsbalans nooit als nul.

`loggedAt` fungeert als kalenderdagtag. Nieuwe invoer gebruikt middag UTC van de gekozen
`YYYY-MM-DD`-dag, zodat frontend en backend dezelfde dagbucket hanteren.

### FoodReference

Cache/referentie voor voedingsmiddelen met kcal en optionele `proteinPer100g`,
`carbsPer100g`, `fatPer100g` en `fiberPer100g`. De
actuele Recent-flow wordt rechtstreeks uit `FoodEntry` opgebouwd; deze tabel blijft
beschikbaar voor productcache en verdere offlineverbetering.

### WeightEntry

Gewichtsmeting met datum. Toevoegen of verwijderen synchroniseert het actuele
profielgewicht, waarna TDEE en budget opnieuw worden berekend.

### Epic 5/6 vervolg

- Story 5.1 slaat geen afgeleide streak op; die wordt telkens uit de actuele loghistorie
  berekend. Alleen de vaste tijdzone is persistent.
- Story 5.2 gebruikt `BadgeAward` met een unieke badgekey en `earnedAt`. Awards worden
  alleen toegevoegd en nooit ingetrokken.
- `Profile.theme` bewaart `light` of `dark`; de frontend past dit na profiel-load toe.
- Story 6.1 gebruikt `AiInsight` voor onveranderlijke zevendaagse momentopnamen.
- Story 6.2 bewaart uitsluitend de dagteller in `AiCoachUsage`; gespreksberichten gaan
  per request mee vanuit React-state en worden niet persistent opgeslagen.

## 5. Domeinlogica

Pure functies in `packages/core` verzorgen:

- Mifflin-St Jeor BMR/TDEE en activiteitsfactoren;
- dagbudget met veilige ondergrens;
- dagstatus `under`, `near` of `over`;
- kalenderdagverschuiving en UTC-daggrenzen;
- huidige/langste streak en totaal unieke logdagen;
- voedingsrichtwaarden, totalen, macro-energieverhouding en caloriegewogen datadekking.

Voedingsrichtwaarden zijn bewust brede vuistregels: eiwit is bij afvallen het maximum
van 0,83 g/kg huidig gewicht en 1,2 g/kg referentiegewicht (begrensd op 25 energie%),
koolhydraten 40–70 energie%, vet 20–40 energie% en vezels minimaal 25 g (vrouw) of
30 g (man), zo nodig energiegerelateerd hoger. Het weekgemiddelde extrapoleert alleen
volledig bekende items; de dekkingspill blijft daarom noodzakelijk bij interpretatie.

Een streak telt unieke opeenvolgende kalenderdagen met minstens één item. Als vandaag
nog leeg is, blijft een gisteren eindigende reeks gedurende de huidige dag actief. Na
een volledig gemiste dag wordt de huidige reeks nul. Verwijderen of retroactief wijzigen
wordt automatisch meegenomen doordat de waarde niet als teller wordt opgeslagen.

## 6. REST API

Alle routes behalve `/health` en `/api/login` vereisen een geldige ondertekende sessie,
via `Authorization: Bearer …` of de bestaande sessiecookie.

| Methode | Pad | Doel |
|---|---|---|
| `GET` | `/health` | Publieke healthcheck |
| `POST` | `/api/login` | Toegangsgate openen |
| `POST` | `/api/logout` | Sessie beëindigen |
| `GET`, `PUT` | `/api/profile` | Profiel ophalen/vervangen |
| `GET` | `/api/budget?date=YYYY-MM-DD` | TDEE, budget, gegeten en resterend |
| `GET`, `POST` | `/api/entries` | Dagitems ophalen / item toevoegen |
| `POST` | `/api/entries/batch` | 1–20 maaltijdonderdelen atomair toevoegen |
| `PATCH`, `DELETE` | `/api/entries/:id` | Item wijzigen / verwijderen |
| `GET` | `/api/nutrition?date=` | Dagtotalen, automatische richtwaarden en datadekking |
| `GET` | `/api/nutrition/week?end=` | Zevendaags gemiddelde, macroverhouding en rustig oordeel |
| `GET` | `/api/foods/search?q=` | Open Food Facts + cache zoeken |
| `POST` | `/api/foods/estimate` | AI-tekstschatting |
| `POST` | `/api/foods/analyze` | Standaard gecombineerde tekst-/fotoanalyse |
| `GET` | `/api/foods/recent` | Recente unieke items |
| `POST` | `/api/photo/analyze` | Foto analyseren zonder opslag |
| `GET`, `POST` | `/api/weights` | Gewicht ophalen / toevoegen |
| `PATCH`, `DELETE` | `/api/weights/:id` | Gewicht wijzigen / verwijderen |
| `GET` | `/api/streak?timeZone=` | Actuele streak en statistieken |
| `GET` | `/api/badges` | Badge-evaluatie, permanente awards en voortgang |
| `GET` | `/api/insights?timeZone=` | Wekelijkse AI-snapshot ophalen of genereren |
| `GET` | `/api/coach/usage?timeZone=` | Dagverbruik van de AI-coach |
| `POST` | `/api/coach` | Coachantwoord met meegegeven sessiehistorie |

`GET /api/streak` gebruikt de opgeslagen profieltijdzone. Voor een bestaand profiel
zonder tijdzone wordt de geldige apparaattijdzone uit de eerste request eenmalig
vastgelegd; daarna is het profiel leidend.

## 7. AI-contracten

### Tekstschatting

`POST /api/foods/estimate` stuurt een omschrijving server-side naar Claude en dwingt een
JSON-schema af met naam, gram, calorieën, optionele macro's en confidence.

### Gecombineerde AI-/fotoanalyse

`POST /api/foods/analyze` accepteert minimaal één van `description` of een tijdelijke
base64-afbeelding (`image` + `mediaType`). Bij beide gebruikt de tekst de foto als extra
context. Het antwoord bevat `items[]` met naam, gram, kcal, eiwit, koolhydraten, vet,
vezels en confidence. De browser verkleint naar maximaal 1024 px en JPEG-kwaliteit 0,8.
De backend verwerkt de bytes uitsluitend in de lopende Anthropic-request: er is geen
fotoveld, bestandsschrijfactie of databaseopslag. Bevestigde items worden zonder foto via
`POST /api/entries/batch` in één Prisma-transactie opgeslagen.

### Legacy foto-endpoint

`POST /api/photo/analyze` accepteert `{ image, mediaType }`. De client schaalt de foto
naar maximaal 1024 px en JPEG-kwaliteit 0,8 voordat base64-upload plaatsvindt. Fastify
accepteert maximaal 10 MB requestbody. De foto wordt niet persistent bewaard.

De response is:

```typescript
interface AiPhotoEstimate {
  items: Array<{
    name: string;
    estimatedGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    confidence: 'low' | 'medium' | 'high';
  }>;
}
```

`POST /api/photo/analyze` en `/api/foods/estimate` blijven tijdelijk beschikbaar voor
compatibiliteit, maar de frontend gebruikt uitsluitend de gecombineerde route.

### Inzichten en coach

Beide flows bouwen server-side een compacte context uit eigen eetlog, actueel berekend
budget en gewichtmetingen. Inzichten gebruiken zeven dagen en vereisen minimaal vier
unieke logdagen. Een snapshot wordt maximaal eenmaal per zeven dagen gemaakt en later
niet herschreven. De coach gebruikt 28 dagen context en dezelfde minimumdrempel.

De browser stuurt maximaal de laatste twaalf coachberichten mee; de backend begrenst
berichtlengtes en slaat ze niet op. `AiCoachUsage` begrenst succesvolle vragen op twintig
per kalenderdag in `Profile.timeZone`. Mislukte AI-aanroepen verbruiken geen vraag.
Prompts beperken antwoorden tot voeding, budget en gewichtsvoortgang en eisen
suggestieve, niet-medische formulering. Een ontbrekende sleutel of providerfout levert
een nette 503-response zonder invloed op loggen of budget.

### Modelconfiguratie

De default is `claude-haiku-4-5` via `CALCOUNT_AI_MODEL`. Foto kan afzonderlijk worden
overschreven met `CALCOUNT_AI_PHOTO_MODEL`. Als fotoontwikkeling wordt hervat, blijft de
15–20 echte-maaltijdfoto's accuracy-check verplicht voordat de flow als afgerond geldt.

## 8. Authenticatie en beveiliging

- `AUTH_USERNAME` en `AUTH_PASSWORD` configureren de single-user toegangsgate.
- `AUTH_SECRET` ondertekent hetzelfde stateless sessietoken voor cookie en bearer-auth.
- In productie gebruikt de cookie `Secure` en cross-origin-instellingen, omdat GitHub
  Pages en Render verschillende origins hebben.
- Login retourneert het token naast de HttpOnly-cookie. De frontend bewaart het in
  `localStorage` en stuurt het als bearer-token, omdat Safari en andere browsers
  third-party cookies tussen GitHub Pages en Render kunnen blokkeren.
- CORS staat credentials en de `Authorization`-header toe.
- Database- en AI-secrets bestaan alleen in backend-/deployomgevingen.
- Foto's en toekomstige coachcontext worden niet persistent door de backend bewaard.

## 9. PWA en offlinegrens

Vite genereert manifest en service worker. De app-shell en gecachete assets zijn als PWA
beschikbaar. Volwaardige offline-write/synchronisatie is niet geïmplementeerd: mutaties
vereisen de API. AI en Open Food Facts vereisen verbinding; de UI biedt Handmatig als
functionele terugval wanneer externe diensten niet beschikbaar zijn.

De UI gebruikt semantische CSS-kleurvariabelen voor light en dark mode. De lokaal
opgeslagen themavoorkeur wordt vóór de eerste React-render toegepast om een lichte flits
te voorkomen. Gewichtsgrafiek, overlays, tabbalk en PWA-theme-color volgen mee.

## 10. Deployment

- Frontend: GitHub Pages via `.github/workflows/pages.yml`.
- Backend: Render Web Service via `render.yaml`.
- Database: Neon Postgres via `DATABASE_URL` en `DIRECT_URL`.
- Prisma-migraties: `npm run db:deploy -w api` tijdens de Render-build.

De frontend en healthcheck zijn live. Zie [deployment.md](deployment.md) voor URLs,
variabelen en verificatie. De Epic 5-migraties en
`20260724150000_add_theme_and_epic6` zijn op 2026-07-24 op Neon toegepast; de
bijbehorende frontend/backendcode wacht op de normale deploy.

## 11. Verificatiestrategie

- `npm test`: pure domeinlogica; momenteel 32 tests.
- `npm exec -w api tsc -- --noEmit`: API-typecheck.
- `npm exec -w api prisma validate`: schema-validatie.
- `npm run build:web`: frontend-typecheck, PWA- en productiebuild.
- Handmatige browser-/mobieltests blijven nodig voor camera, cross-origin authenticatie en
  volledige productieflows.

## 12. Actuele bouwvolgorde

1. Gecombineerde AI-invoer deployen en productieflows verifiëren.
2. Mobiel visueel verifiëren: camera/galerij, correctie, profielthema en dark mode.
3. Bundlesplitsing voor Recharts als losse technische optimalisatie overwegen.
4. Gecombineerde AI-invoer in productie met tekst, foto en beide samen controleren.
