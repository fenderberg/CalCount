---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["docs/prd.md", "docs/architecture.md"]
---

# CalCount - Epic Breakdown

## Overview

This document provides the epic and story breakdown for CalCount. Current priority
(updated 2026-07-24): Epics 1, 2, 4 and 5 are complete; Epic 3 is partially implemented
but parked; Epics 5 and 6 are complete. Canonical current documentation lives in `docs/`.

## Requirements Inventory

### Functional Requirements

FR1: Het systeem berekent het dagelijkse calorie-onderhoudsniveau (TDEE) uit lengte, gewicht, leeftijd, geslacht en activiteitsniveau via de Mifflin-St Jeor-formule.
FR2: De gebruiker stelt een afvaldoel in (streefgewicht en/of tempo); het systeem leidt hieruit een dagelijks caloriebudget af met een veilig calorietekort.
FR3: Het systeem toont op het hoofdscherm het resterende caloriebudget van vandaag: budget − gelogd = resterend.
FR4: De gebruiker kan een voedingsitem loggen door een foto te maken; een AI-visiemodel herkent het gerecht en schat calorieën (en macro's) plus de aannemelijke portiegrootte.
FR5: Na een AI-schatting kan de gebruiker de geschatte hoeveelheid (gram/porties) en calorieën corrigeren vóór opslaan.
FR6: De gebruiker kan een item loggen door een product te kiezen en het gegeten gewicht in gram (of aantal porties) op te geven; het systeem berekent de calorieën.
FR7: Het systeem houdt een lijst bij van eerder gelogde items zodat herhaald loggen met één tik kan.
FR8: De gebruiker kan een gelogd item bewerken of verwijderen.
FR9: Het systeem toont per dag het totaal aan gegeten calorieën en of de gebruiker onder of boven het budget zit.
FR10: De gebruiker kan zijn actuele gewicht periodiek invoeren; het systeem toont het gewichtsverloop over tijd.
FR11: Het systeem herberekent budget en TDEE automatisch mee wanneer het gewicht verandert.
FR12: De gebruiker kan de dag terugbladeren en een geschiedenis van eerdere dagen inzien.
FR13: Het systeem geeft visuele feedback (kleur/indicator) wanneer de gebruiker het dagbudget nadert of overschrijdt.
FR14: Het systeem houdt een streak bij van opeenvolgende dagen waarop de gebruiker ten minste één item heeft gelogd (elk type telt, incl. foto), toont deze prominent, gebruikt een vaste tijdzone-instelling als daggrens, en herberekent bij retroactieve wijzigingen.
FR15: Het systeem kent badges toe bij vaste mijlpalen (3/7/30 dagen streak, 30 dagen totaal gelogd, eerste trendmatige voortgang richting streefgewicht); awards zijn permanent en worden alleen als tijdelijke popup bij openen van Voortgang getoond.
FR16: Het systeem genereert wekelijks automatische AI-inzichten op basis van eetlog, budgetnaleving en gewichtstrend; een getoond inzicht is een momentopname.
FR17: De gebruiker kan een vraag stellen aan een interactieve AI-coach; sessie-geheugen, geen persistente opslag.
FR18: AI-inzichten en AI-coach-antwoorden worden gepresenteerd als suggestie/observatie, nooit als medisch advies.
FR19: De light/dark-keuze staat als instelling in het profiel en geldt na inloggen voor alle schermen.

### NonFunctional Requirements

NFR1: De app is een mobile-first webapplicatie (PWA) die op iOS en Android in de browser werkt en installeerbaar is op het startscherm.
NFR2: Het hoofdscherm en het loggen zijn met één hand en met grote tikdoelen bedienbaar.
NFR3: Een AI-fotoschatting levert binnen ~10 seconden een resultaat op onder normale mobiele netwerkomstandigheden.
NFR4: Foto's worden gebruikt voor herkenning en niet langer bewaard dan nodig; expliciete cameratoestemming.
NFR5: Persoonlijke gezondheidsgegevens worden veilig opgeslagen en niet gedeeld met derden buiten de gebruikte AI-provider; AI-coach-context wordt niet persistent bewaard.
NFR6: De app blijft bruikbaar bij korte netwerkonderbreking; AI-foto vereist verbinding.
NFR7: AI-kosten per fotoschatting blijven beheersbaar (richtwaarde onder enkele centen per foto).
NFR8: Calorieschattingen worden gepresenteerd als schatting met marge; de app is geen medisch hulpmiddel.
NFR9: De AI-coach loopt server-side via het AI-proxy-patroon, max. 20 vragen/dag + gelimiteerde contextlengte; kernfunctionaliteit blijft bruikbaar zonder AI.

### Additional Requirements (Architecture)

- Monorepo (npm workspaces): `packages/core` (pure domeinlogica + tests), `api` (Fastify), `web` (React/Vite PWA). Geen starter-template — bestaande codebase, brownfield.
- Backend-for-Frontend + AI-proxy-patroon: API-sleutel (`ANTHROPIC_API_KEY`) uitsluitend server-side, nooit in de client.
- Fastify **app-factory-patroon**: `api/src/app.ts` exporteert `buildApp()`; `api/src/server.ts` start dit lokaal en als persistent Node-proces op Render.
- Database: Prisma + Postgres (Neon in productie; lokaal ook Postgres sinds de migratie — geen SQLite meer). Nieuwe velden (FoodEntry al met `source: 'photo'`) vereisen een Prisma-migratie.
- AI-model: **`claude-haiku-4-5`** als nieuwe default (PRD §9 beslissing 13 — vervangt de oudere `claude-opus-4-8`-default), instelbaar via `CALCOUNT_AI_MODEL`; env-config in `api/.env.example`.
- AI Fotoherkenning-contract (architecture.md §5): Claude Messages API, image-content-block (base64) + `output_config.format`/`json_schema` voor afgedwongen gestructureerde output; schema met `items[]` (name, estimatedGrams, calories, protein, carbs, fat, confidence).
- Bestaand endpoint-contract (architecture.md §6): `POST /api/photo/analyze` — slaat niets op, retourneert alleen de schatting; opslaan gebeurt via het al bestaande `POST /api/entries` (met `source: 'photo'`) ná correctie door de gebruiker.
- Foutafhandeling: geen verbinding/API-fout → nette melding + terugval naar handmatig loggen (Story 3.1 AC3); ~10s timeout-richtwaarde (NFR3).
- Privacy: foto alleen voor herkenning, niet langer bewaard dan nodig (NFR4); overweeg client-side resolutiebeperking vóór upload om kosten te sparen (NFR7).
- Deployment: GitHub Pages + Render + Neon, live; zie `docs/deployment.md`.
- Testing: Vitest voor `packages/core` (rekenlogica); handmatige/end-to-end verificatie voor de foto-flow (PRD §4 Testing Requirements) — vereist een echte `ANTHROPIC_API_KEY` om te verifiëren.

### UX Design Requirements

De definitieve visuele en interactionele specificatie staat in `docs/design.md`.

### FR Coverage Map

FR1: Epic 1 - TDEE-berekening (Mifflin-St Jeor)
FR2: Epic 1 - Afvaldoel → dagelijks caloriebudget
FR3: Epic 1 - Resterend budget op hoofdscherm
FR4: **Epic 3** - Foto maken, AI herkent gerecht + schat calorieën/macro's/portie
FR5: **Epic 3** - AI-schatting corrigeren vóór opslaan
FR6: Epic 2 - Loggen op gewicht/porties met caloriereferentie
FR7: Epic 2 - Recent/vaak gelogde items
FR8: Epic 2 - Gelogd item bewerken/verwijderen
FR9: Epic 2 - Dagtotaal + onder/boven budget
FR10: Epic 4 - Gewicht invoeren + verloop tonen
FR11: Epic 4 - Budget/TDEE herberekenen bij gewichtswijziging
FR12: Epic 2 - Dag terugbladeren/geschiedenis
FR13: Epic 2 - Visuele feedback bij budget-nadering/overschrijding
FR14: Epic 5 - Streak van opeenvolgende log-dagen
FR15: Epic 5 - Badges bij vaste mijlpalen
FR16: Epic 6 - Periodieke AI-inzichten
FR17: Epic 6 - Interactieve AI-coach
FR18: Epic 6 - AI-advies als suggestie, geen medisch advies
FR19: Profiel - opgeslagen light/dark-instelling

## Epic List

### Epic 1: Fundament & Persoonlijk Caloriebudget
Gebruiker kan profiel/doel invoeren en ziet direct zijn dagelijkse caloriebudget.
**FRs covered:** FR1, FR2, FR3
**Status:** ✅ Gebouwd & geverifieerd (geen actie deze run)

### Epic 2: Eten Loggen & Dagoverzicht
Gebruiker kan volledig (handmatig) tracken: loggen op gewicht/product/recent, dagtotaal zien, bewerken/verwijderen, dagen terugbladeren.
**FRs covered:** FR6, FR7, FR8, FR9, FR12, FR13
**Status:** ✅ Gebouwd & geverifieerd (geen actie deze run)

### Epic 3: AI-Fotoherkenning
Gebruiker kan eten loggen door een foto te maken; AI schat het gerecht en de calorieën, gebruiker corrigeert en slaat op — elimineert handmatig zoeken/invoeren voor de meest voorkomende log-actie.
**FRs covered:** FR4, FR5
**Status:** ⏸️ Gedeeltelijk gebouwd en geparkeerd — analyse + read-only preview bestaan;
accuracy-check, correctie en opslag volgen later.
**Standalone-check:** Bouwt voort op Epic 2's opslag-/correctie-UX (bestaand `POST /api/entries` met `source: 'photo'`) maar voegt een volledig zelfstandig nieuw pad toe (`POST /api/photo/analyze` + camera-UI); geen toekomstige epic is vereist om te functioneren.

**Implementation Notes (uit party-mode-review — Mary, Winston, Sally, Amelia, John):**
- **Eerst valideren, dan bouwen:** de nauwkeurigheid van `claude-haiku-4-5` op echte maaltijdfoto's staat sinds PRD v0.1 als open aanname en is nooit getest. Story 3.1 start met een expliciete, toetsbare AC: 15–20 echte foto's tegen het model draaien vóór de rest van de UI wordt afgebouwd.
- **Confidence zichtbaar in de UI:** het bestaande JSON-schema heeft al een `confidence`-veld (low/medium/high, architecture.md §5) — de correctie-UI (Story 3.3) moet een lage confidence visueel anders behandelen dan een hoge, niet hetzelfde plaatje tonen.
- **Camera-permissie on-demand:** toestemming vragen pas bij het daadwerkelijke gebruik van de foto-flow, niet vooraf/bij app-start.
- **Laadstatus tijdens de ~10s AI-call (NFR3):** geen kale spinner — een skeleton-state of andere aanwezigheid die de wachttijd korter laat aanvoelen.

### Epic 4: Voortgang & Bijsturen
Gebruiker houdt gewicht bij, ziet trend, budget beweegt automatisch mee.
**FRs covered:** FR10, FR11
**Status:** ✅ Gebouwd & geverifieerd (geen actie deze run)

### Epic 5: Motivatie & Gamification (licht)
Gebruiker blijft gemotiveerd via een streak-teller en badges bij mijlpalen, zonder druk/competitie.
**FRs covered:** FR14, FR15
**Status:** ✅ Gebouwd — streak, vaste tijdzone, permanente awards en tijdelijke popup zijn afgerond.

### Epic 6: AI-advies & Coach
Gebruiker krijgt periodieke AI-inzichten en kan een interactieve AI-coach vragen stellen over voeding/voortgang.
**FRs covered:** FR16, FR17, FR18
**Status:** ✅ Gebouwd — wekelijkse snapshots en sessiegebaseerde coach met daglimiet.

**Dependency-opmerking:** Epic 6.1 gebruikt dezelfde vaste tijdzone/daggrenzen als Story
5.1. Die basis is nu gebouwd. Epic 3 blijft functioneel onafhankelijk en geparkeerd.

---

## Epic 1: Fundament & Persoonlijk Caloriebudget

Gebruiker kan profiel/doel invoeren en ziet direct zijn dagelijkse caloriebudget.

**Status:** ✅ Gebouwd & geverifieerd (Stories 1.1–1.4, zie `docs/prd.md` §6 en `docs/handoff.md`) — geen nieuwe story-uitwerking deze run.

---

## Epic 2: Eten Loggen & Dagoverzicht

Gebruiker kan volledig (handmatig) tracken.

**Status:** ✅ Gebouwd & geverifieerd (Stories 2.1–2.5, zie `docs/prd.md` §6 en `docs/handoff.md`) — geen nieuwe story-uitwerking deze run.

---

## Epic 3: AI-Fotoherkenning

Gebruiker kan eten loggen door een foto te maken; AI schat het gerecht en de calorieën, gebruiker corrigeert en slaat op.

**FRs covered:** FR4, FR5 · **NFRs:** NFR3, NFR4, NFR7, NFR8 · **Status:** ⏸️ Gedeeltelijk gebouwd en geparkeerd

### Story 3.1: Foto maken en versturen

Als gebruiker,
wil ik een foto van mijn eten kunnen maken in de app,
zodat die naar de AI kan voor herkenning.

**Acceptance Criteria:**

**Given** het model `claude-haiku-4-5` nog niet gevalideerd is op eten-foto's
**When** deze story wordt opgepakt
**Then** wordt eerst een reality-check uitgevoerd met 15–20 echte maaltijdfoto's tegen het model
**And** wordt het resultaat (acceptabel / niet-acceptabel, met evt. terugval naar `claude-sonnet-5`) vastgelegd vóórdat de rest van de story wordt afgebouwd

**Given** de gebruiker heeft de foto-log-flow geopend
**When** hij op "foto maken" tikt
**Then** vraagt de app pas op dat moment cameratoestemming (niet vooraf bij app-start)
**And** kan hij in plaats daarvan ook een foto uit de galerij kiezen

**Given** een foto is gemaakt of gekozen
**When** deze wordt verstuurd
**Then** gaat de foto via de backend naar de AI-provider (API-sleutel blijft server-side, nooit in de client)
**And** toont de app een laadstatus die de ~10s wachttijd (NFR3) niet als een kale spinner laat aanvoelen (bv. skeleton-state)

**Given** er is geen verbinding of de AI-call faalt
**When** dit gebeurt tijdens het versturen
**Then** toont de app een nette foutmelding met een directe terugvaloptie naar handmatig loggen

### Story 3.2: AI-schatting van gerecht en calorieën

Als gebruiker,
wil ik dat de AI herkent wat op de foto staat en de calorieën schat,
zodat ik niet handmatig hoef te zoeken.

**Acceptance Criteria:**

**Given** een foto succesvol is geanalyseerd (Story 3.1)
**When** het visiemodel een resultaat teruggeeft
**Then** bevat dit een herkend gerecht, geschatte hoeveelheid (gram/porties), calorieën, macro's en een confidence-niveau (low/medium/high)

**Given** de foto meerdere items bevat
**When** het model dit herkent
**Then** worden deze als aparte regels teruggegeven (schema ondersteunt `items[]`, `docs/architecture.md` §5)

**Given** een resultaat wordt getoond aan de gebruiker
**When** het scherm de schatting weergeeft
**Then** is dit duidelijk gepresenteerd als "schatting met marge" (conform NFR8)
**And** wordt een lage confidence visueel anders behandeld dan een hoge (bv. duidelijkere aansporing tot corrigeren)

### Story 3.3: Schatting corrigeren en opslaan

Als gebruiker,
wil ik de AI-schatting kunnen bijstellen,
zodat het gelogde item klopt met wat ik werkelijk at.

**Acceptance Criteria:**

**Given** een AI-schatting wordt getoond (Story 3.2)
**When** de gebruiker de hoeveelheid of calorieën wil aanpassen
**Then** kan hij dit doen via schuif/stepper, niet via typen waar vermijdbaar (conform de UX-vision, PRD §3)

**Given** een AI-schatting met meerdere herkende items
**When** de gebruiker een item wil verwijderen of een gemist item wil toevoegen
**Then** kan hij dit doen vóór opslaan

**Given** de gebruiker heeft de (gecorrigeerde) schatting bevestigd
**When** hij op opslaan tikt
**Then** verschijnt het item in de daglijst met `source: 'photo'` via het bestaande `POST /api/entries`-endpoint
**And** past het dagtotaal/resterend budget direct aan (zoals Epic 2)

### Story 3.4: Foto-item hergebruiken

Als gebruiker,
wil ik een via foto herkend item terugvinden in mijn recente items,
zodat ik het later opnieuw kan loggen zonder nieuwe foto.

**Acceptance Criteria:**

**Given** een item via foto is gelogd (Story 3.3)
**When** de gebruiker later de recente-items-lijst opent (Story 2.4)
**Then** staat dit item daartussen met de laatst bevestigde hoeveelheid/calorieën

**Given** de gebruiker tikt op zo'n herhaald item
**When** hij het opnieuw logt
**Then** wordt het gelogd met de laatst gebruikte hoeveelheid/calorieën, zonder nieuwe foto of AI-call

---

## Epic 4: Voortgang & Bijsturen

**Status:** ✅ Gebouwd & geverifieerd (Stories 4.1–4.4) — geen nieuwe story-uitwerking deze run.

---

## Epic 5: Motivatie & Gamification (licht)

**Status:** ✅ Gebouwd — Stories 5.1 en 5.2 afgerond op 2026-07-24.

---

## Epic 6: AI-advies & Coach

**Status:** ✅ Gebouwd — Stories 6.1–6.2 zijn afgerond; de tijdzonebasis uit Story 5.1
wordt voor vensters en daglimiet gebruikt.
