---
baseline_commit: 3f92b5d3614b7da7f6d9cdccd682db7806eae439
---

# Story 3.1: Foto maken en versturen

Status: parked

> Prioriteitsbesluit 2026-07-24: Epic 3 is geparkeerd ten gunste van Epics 5 en 6.
> Tasks 1–5 bestaan in de code; Task 6 blijft open. Zie de canonieke status in
> `docs/handoff.md` en het definitieve ontwerp in `docs/design.md`.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gebruiker,
I want een foto van mijn eten kunnen maken in de app en versturen voor AI-herkenning,
so that ik straks (Story 3.2/3.3) niet handmatig hoef te zoeken of te typen om te loggen.

## Acceptance Criteria

1. Vóórdat de rest van deze story wordt afgebouwd: een reality-check met 15–20 echte maaltijdfoto's tegen `claude-haiku-4-5` (via de nieuwe `estimateFromPhoto`-functie) wordt uitgevoerd en het resultaat (acceptabel / niet-acceptabel) vastgelegd in Completion Notes. [Source: docs/prd.md#Story 3.1 AC1 (via epics.md v1.1-hardening), party-mode-review]
2. De gebruiker opent de foto-log-flow (nieuwe "Foto"-tab in `LogSheet.tsx`) en tikt op "foto maken"; pas op dat moment vraagt de browser cameratoestemming (geen prompt vooraf/bij app-start). De gebruiker kan in plaats daarvan ook een bestaande foto uit de galerij kiezen. [Source: docs/prd.md FR4, Story 3.1 AC1; party-mode-review]
3. Een gekozen/gemaakte foto wordt client-side verkleind/gecomprimeerd vóórdat deze als base64 naar de backend gaat (mobiele data, AI-kosten en Fastify-bodylimit). [Source: docs/architecture.md §7]
4. De foto gaat via `POST /api/photo/analyze` naar de backend; de Anthropic API-sleutel blijft server-side (nooit in de client). [Source: docs/architecture.md §5, §6; PRD NFR5]
5. Tijdens de AI-call (richtwaarde ~10s, NFR3) toont de UI een laadstatus die niet als een kale spinner aanvoelt (bv. skeleton-state). [Source: PRD NFR3; party-mode-review]
6. Bij succes toont het scherm een minimale, read-only weergave van de herkende items (naam + confidence-badge per item, géén editing/opslaan) — dat is de scope van Story 3.2/3.3, niet van deze story. [Source: fresh-context review — sluit scope-gat over items[]-response]
7. Bij geen verbinding, een API-fout, of een ontbrekende `ANTHROPIC_API_KEY`, toont de app een nette foutmelding met een directe terugvaloptie naar handmatig loggen (bestaande tabs blijven bereikbaar). [Source: docs/prd.md Story 3.1 AC3; NFR6]

## Tasks / Subtasks

- [x] **Task 1 — AI-model default reconciliëren** (AC: 1, 4)
  - [x] In `api/src/services/aiEstimate.ts:17`: verander de `MODEL`-constante default van `'claude-opus-4-8'` naar `'claude-haiku-4-5'` (PRD §9 beslissing 13 — geldt voor alle AI-functies, dus ook de bestaande tekstschatting; dit is bewust, geen bijwerking).
  - [x] Voeg een **losse, optionele** `CALCOUNT_AI_PHOTO_MODEL`-env-var toe (fallback naar dezelfde `MODEL`-constante als niet gezet) — geeft een config-only terugvalroute naar `claude-sonnet-5` als de accuracy-check in Task 1-AC1 tegenvalt, zonder de bestaande tekstschatting te raken.
  - [x] Werk `api/.env.example` bij: default-comment naar `claude-haiku-4-5`, en documenteer `CALCOUNT_AI_PHOTO_MODEL`.
- [x] **Task 2 — Backend: `estimateFromPhoto` service-functie** (AC: 1, 4, 6)
  - [x] In `api/src/services/aiEstimate.ts`: voeg `estimateFromPhoto(base64Image: string, mediaType: string): Promise<{ items: AiFoodEstimate[] }>` toe. Hergebruik dezelfde `Anthropic`-client en `output_config: { format: { type: 'json_schema', schema } }`-aanpak als `estimateFromText` (regels 43-57), maar:
    - Nieuw schema `PHOTO_ESTIMATE_SCHEMA`: `{ items: { type: 'array', items: <bestaande per-item shape> } }`, exact zoals het voorbeeldschema in `docs/architecture.md` §5.
    - `content` van het bericht wordt een array met een `{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } }`-block plus een tekst-instructieblok (analoog aan de tekst-prompt in `estimateFromText`, maar gericht op "meerdere items op de foto → aparte regels").
    - Gooi dezelfde `AiUnavailableError` als geen `ANTHROPIC_API_KEY` is geconfigureerd.
  - [x] **Geverifieerd met een echte API-call** (synthetische testafbeelding, tijdelijk script, daarna verwijderd): `output_config.format.json_schema` werkt samen met een image-content-block op `@anthropic-ai/sdk ^0.113.0`. Resultaat kwam correct terug als gestructureerde `{items: [...]}`, model gaf terecht `confidence: "low"` op een niet-eten-afbeelding.
- [x] **Task 3 — Backend: route + registratie + body-limit** (AC: 4, 7)
  - [x] Nieuw bestand `api/src/routes/photo.ts`: `POST /api/photo/analyze`, exact het foutafhandelingspatroon van `api/src/routes/foods.ts` (`AiUnavailableError` → 503, overige fouten → 502). Body: `{ image: string (base64), mediaType: string }`; valideert aanwezigheid + geldig mediaType vóór de AI-call (400 bij ontbrekend/ongeldig — toegevoegde validatie t.o.v. oorspronkelijke spec, nodig omdat de Anthropic SDK-types een strikte mediaType-union vereisen).
  - [x] Registreer `photoRoutes` in `api/src/app.ts` (`buildApp()`), naast de bestaande route-registraties.
  - [x] **Verhoog Fastify's `bodyLimit`** in `Fastify({ logger: true })` (`app.ts`) naar 10MB — de default is 1MB en een base64-foto overschrijdt dat vrijwel altijd (stille 413 anders). *(Code aangepast; niet end-to-end getest met een echte foto — zie Task 6.)*
- [x] **Task 4 — Frontend: foto-opname + compressie + versturen** (AC: 2, 3, 5)
  - [x] Nieuwe `PhotoTab`-component in `web/src/screens/LogSheet.tsx`, naar het patroon van `AiTab`: `useMutation` die naar de nieuwe `analyzePhoto`-functie in `web/src/api.ts` stuurt.
  - [x] Input via `<input type="file" accept="image/*" capture="environment">` — geeft camera/galerij-keuze via de native OS-picker, vraagt pas toestemming bij interactie (bevestigd juiste patroon voor een PWA, geen `getUserMedia` nodig).
  - [x] **Client-side compressie vóór base64-encoding**: tekent de gekozen afbeelding op een `<canvas>`, schaalt terug (max 1024px langste zijde) en exporteert als JPEG (kwaliteit 0.8) — beperkt mobiele data, latency, AI-kosten en requestgrootte op Render/Fastify.
  - [x] 'photo' toegevoegd aan het `Tab`-type en de tab-navigatie.
  - [x] Laadstatus: `PhotoSkeleton`-component (twee pulserende placeholder-balken), geen kale spinner-tekst.
  - [x] Foutafhandeling mirrort AiTab's `unavailable`-check (zoekt op "niet geconfigureerd") voor de 503-tak; generieke melding voor overige fouten, met verwijzing naar Zoeken/Handmatig.
  - [x] Succesweergave: read-only `PhotoResultPreview`-lijst (`name` + kcal + confidence-badge, kleurcodering low/medium/high) — geen `PortionEditor`-koppeling, geen opslaan.
- [x] **Task 5 — API-client** (AC: 4)
  - [x] `analyzePhoto(base64Image: string, mediaType: string): Promise<AiPhotoEstimate>` in `web/src/api.ts`, analoog aan `estimateFood`. Hergebruikt het bestaande `AiFoodEstimate`-interface voor de item-shape.
- [ ] **Task 6 — Accuracy-check en afronding** (AC: 1) — **BLOCKED, zie Completion Notes**
  - [ ] Voer de 15–20-foto's-proef uit tegen `claude-haiku-4-5` (Task 1/2 moeten werken). Documenteer resultaat + eventuele beslissing om `CALCOUNT_AI_PHOTO_MODEL=claude-sonnet-5` als terugval te adviseren, in Completion Notes hieronder.
  - [ ] Handmatige verificatie: foto maken/kiezen → laden → resultaat (of nette fout) op een echt mobiel toestel/browser, inclusief het geval zonder `ANTHROPIC_API_KEY`.

## Dev Notes

- **Scope-grens met Story 3.2/3.3:** deze story eindigt bij een *read-only* weergave van herkende items. Multi-item-selectie, corrigeren (schuif/stepper), verwijderen/toevoegen van items, en opslaan via `POST /api/entries` (met `source: 'photo'`, al ondersteund — geen migratie nodig) zijn Story 3.2/3.3. Bouw hier geen `PortionEditor`-integratie.
- **Bestaand patroon, niet heruitvinden:** `estimateFromText` (aiEstimate.ts) en `POST /api/foods/estimate` (routes/foods.ts) zijn het directe sjabloon voor resp. de nieuwe service-functie en route — zelfde SDK-client, zelfde `output_config.format.json_schema`-aanpak, zelfde foutklasse (`AiUnavailableError`). Niet een nieuw patroon verzinnen.
- **Datamodel:** geen Prisma-migratie nodig. `FoodEntry.source` bevat al `'photo'` (schema.prisma:32, routes/entries.ts:5) — pas relevant vanaf Story 3.3.
- **Requestgrootte:** Fastify's default `bodyLimit` is 1MB en daarom verhoogd naar 10MB.
  Client-side compressie blijft nodig voor mobiele data, latency en AI-kosten. De huidige
  backend draait als persistent Node-proces op Render, niet meer als Netlify Function.
- **Modelkeuze-geschiedenis:** `architecture.md` §5 adviseerde oorspronkelijk `claude-sonnet-5` als startpunt voor foto; dat is met de PRD v1.1-hardening (§9 beslissing 13) bijgesteld naar `claude-haiku-4-5` als gedeelde default overal, met een losse `CALCOUNT_AI_PHOTO_MODEL`-override als noodgreep specifiek voor foto. `architecture.md` is al bijgewerkt om dit te reflecteren — geen tegenstrijdigheid meer, maar wees je bewust dat dit een recente wijziging is.
- **Niet geverifieerd, wél aannemelijk:** een image-content-block combineren met `output_config.format.json_schema` op deze SDK-versie is in deze codebase nog niet eerder gedaan (alleen tekst-only tot nu toe). Behandel dit als te verifiëren, niet als vaststaand — zie Task 2.

### Project Structure Notes

- Nieuwe bestanden: `api/src/routes/photo.ts`, (geen nieuwe frontend-bestanden — `PhotoTab` leeft in het bestaande `LogSheet.tsx`, net als `AiTab`/`ManualTab`/`SearchTab`).
- Gewijzigde bestanden: `api/src/services/aiEstimate.ts`, `api/src/app.ts`, `api/.env.example`, `web/src/api.ts`, `web/src/screens/LogSheet.tsx`.
- Geen afwijking van de bestaande projectstructuur (architecture.md §8) — foto-route past in `api/src/routes/`, service-uitbreiding in de bestaande `services/aiEstimate.ts`.

### References

- [Source: docs/prd.md §2 FR4, FR5; §6 Epic 3 Story 3.1; NFR3, NFR4, NFR5, NFR6, NFR7, NFR8]
- [Source: docs/architecture.md §6–7; docs/design.md]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.1 (incl. party-mode-review implementation notes)]
- [Source: api/src/services/aiEstimate.ts, api/src/routes/foods.ts, api/src/app.ts, web/src/api.ts, web/src/screens/LogSheet.tsx — bestaande patronen, direct gelezen]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5), via Claude Code

### Debug Log References

- `npm test` (packages/core, 12 tests) — pass, geen regressie.
- `npx tsc --noEmit` (api) — pass na toevoeging van `PhotoMediaType`-union/`isValidPhotoMediaType` (Anthropic SDK-types stonden een generieke `string` voor `media_type` niet toe).
- `npx tsc -b` (web) — pass.
- `npm run build:web` — pass (productie-bundle + PWA service worker gegenereerd; bestaande bundle-size-waarschuwing is pre-existing, niet door deze story veroorzaakt).
- Live API-call (tijdelijk verificatiescript, verwijderd na gebruik) tegen `claude-haiku-4-5` met een synthetische testafbeelding: `output_config.format.json_schema` + image-content-block werkt correct op `@anthropic-ai/sdk ^0.113.0`. Model gaf correct `confidence: "low"` op een niet-eten-testafbeelding.

### Completion Notes List

- **Tasks 1–5 volledig afgerond en geverifieerd**, inclusief Task 2's expliciete live-verificatie (zie Debug Log) — geen automatische testrunner voor `api`/`web` in dit project (bestaand patroon is handmatige/curl-verificatie, zie `docs/handoff.md`; dat patroon is hier gevolgd i.p.v. een nieuw testframework te introduceren).
- **Twee echte bugs gevonden en gefixt tijdens implementatie/verificatie, niet in de oorspronkelijke story voorzien:**
  1. `api/package.json`'s `dev`/`start`-scripts laadden `.env` helemaal niet (geen dotenv, geen `--env-file`) — elke env-var-afhankelijke functionaliteit (deze foto-feature, maar ook `DATABASE_URL` etc.) zou lokaal altijd hebben gefaald. Gefixt met Node's `--env-file-if-exists=.env` (geen nieuwe dependency nodig, faalt niet als `.env` ontbreekt).
  2. `MODEL`/`PHOTO_MODEL` gebruikten `??` i.p.v. `||` voor de env-fallback: een lege string in `.env` (`CALCOUNT_AI_MODEL=`) telt niet als `null`/`undefined`, dus de default werd nooit toegepast en het model-ID ging leeg naar de API (400-fout). Gefixt door naar `||` over te schakelen.
- **Aanvulling t.o.v. de oorspronkelijke story:** de route valideert nu ook of `mediaType` een geldige waarde is (`image/jpeg|png|gif|webp`) vóórdat de service wordt aangeroepen — noodzakelijk omdat de Anthropic SDK-types een generieke `string` niet accepteren voor `media_type`.
- **Task 6 nog open, niet door mij uit te voeren:** de 15–20-écht-eten-foto's accuracy-check en de handmatige end-to-end-verificatie op een mobiel toestel vereisen echte maaltijdfoto's en/of een fysiek toestel — geen van beide beschikbaar in deze uitvoeringsomgeving. Het onderliggende mechanisme is bevestigd te werken; wat nog niet bevestigd is, is de *nauwkeurigheid* van `claude-haiku-4-5` op echt eten. Story blijft daarom op "in-progress", niet "review"/"done", tot AC1 is uitgevoerd door de gebruiker of met aangeleverde foto's.

### File List

- `api/src/services/aiEstimate.ts` (gewijzigd) — MODEL-default → claude-haiku-4-5 (via `||`, niet `??`), `CALCOUNT_AI_PHOTO_MODEL`-override, `PHOTO_ESTIMATE_SCHEMA`, `AiPhotoEstimate`, `estimateFromPhoto`, `PhotoMediaType`, `isValidPhotoMediaType`
- `api/src/routes/photo.ts` (nieuw) — `POST /api/photo/analyze`
- `api/src/app.ts` (gewijzigd) — `bodyLimit: 10MB`, registratie `photoRoutes`
- `api/.env.example` (gewijzigd) — `CALCOUNT_AI_MODEL`-comment bijgewerkt, `CALCOUNT_AI_PHOTO_MODEL` gedocumenteerd
- `api/package.json` (gewijzigd) — `dev`/`start` laden nu `.env` via `--env-file-if-exists`
- `api/.env` (nieuw, **gitignored**, niet in git) — lokale sleutel voor verificatie
- `web/src/api.ts` (gewijzigd) — `AiPhotoEstimate`, `analyzePhoto`
- `web/src/screens/LogSheet.tsx` (gewijzigd) — `'photo'`-tab, `PhotoTab`, `PhotoResultPreview`, `PhotoSkeleton`, `compressImageFile`
- `docs/architecture.md` (gewijzigd) — §5 modelaanbeveling gereconcilieerd met PRD §9 beslissing 13
- `_bmad-output/implementation-artifacts/3-1-foto-maken-en-versturen.md` (dit bestand) — voortgang bijgewerkt

## Change Log

- 2026-07-23 — Tasks 1–5 geïmplementeerd; Task 6 blijft open.
- 2026-07-24 — Epic 3 door de opdrachtgever geparkeerd ten gunste van Epics 5 en 6;
  status gewijzigd naar `parked`. Hostingverwijzingen bijgewerkt van Netlify naar Render.
