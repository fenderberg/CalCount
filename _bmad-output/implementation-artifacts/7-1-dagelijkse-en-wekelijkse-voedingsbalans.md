# Story 7.1 — Dagelijkse en wekelijkse voedingsbalans

Status: done

## Story

Als gebruiker wil ik globaal zien hoe mijn eiwit, koolhydraten, vet en vezels verdeeld
zijn, zodat ik weet waar ik op kan letten zonder mijn voeding exact te hoeven meten.

## Acceptance Criteria

1. Vandaag toont bij gelogd eten vier compacte balken met automatische richtwaarden.
2. Voortgang → Voeding toont een zevendaags gemiddelde per gelogde dag en macroverhouding.
3. Een inhoudelijk weekoordeel vereist minimaal vier gelogde dagen en 70% datadekking.
4. Onbekende voedingswaarden tellen nooit als nul; de dekking staat zichtbaar in de UI.
5. Het oordeel is rustig, bevat maximaal twee aandachtspunten en is geen medisch advies.
6. Open Food Facts, AI, recent en handmatige invoer ondersteunen ook vezels.

## Completion Notes

- Pure doel- en aggregatielogica toegevoegd aan `packages/core`, inclusief tests.
- Nieuwe dag- en weekroutes toegevoegd en via `buildApp()` geregistreerd.
- Prisma-migratie `20260724160000_add_nutrition_fiber` succesvol op Neon toegepast.
- Dagkaart, Voeding-subtab, optionele handmatige invoer en nutrition-kleurtokens gebouwd.
- Alle 11 bestaande eetlogregels zijn eenmalig met conservatieve voedingsschattingen
  aangevuld en als `isEstimate` gemarkeerd; er zijn geen onvolledige historische regels meer.
- 35 unit tests, API typecheck, Prisma-validatie, webbuild en lokale API-smokecheck geslaagd.

## File List

- `packages/core/src/nutrition.ts`, `nutrition.test.ts`, `index.ts`
- `api/prisma/schema.prisma`, `api/prisma/migrations/20260724160000_add_nutrition_fiber/migration.sql`
- `api/src/routes/nutrition.ts`, `entries.ts`, `app.ts`
- `api/src/services/openFoodFacts.ts`, `aiEstimate.ts`
- `web/src/api.ts`, `screens/Home.tsx`, `screens/Progress.tsx`, `screens/LogSheet.tsx`
- `web/src/components/NutritionBalance.tsx`, `web/src/index.css`, `web/tailwind.config.js`
- Canonieke docs, BMAD-epics en sprintstatus
