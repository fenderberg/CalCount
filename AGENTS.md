# CalCount Agent Instructions

Deze regels gelden voor de volledige repository.

## Canonieke documentatie

Gebruik per onderwerp precies één leidende bron:

| Onderwerp | Canonieke bron |
|---|---|
| Actuele status, overdracht en volgende stap | `docs/handoff.md` |
| Productscope en acceptance criteria | `docs/prd.md` |
| Visueel en interactioneel ontwerp | `docs/design.md` |
| Technische architectuur en API-contracten | `docs/architecture.md` |
| Hosting, configuratie en deployprocedure | `docs/deployment.md` |
| Sprint- en storystatus | `_bmad-output/implementation-artifacts/sprint-status.yaml` plus het storybestand |

BMAD-reviewrapporten, memlogs en geïnstalleerde tooling/templates zijn historische of
toolingartefacten. Herschrijf die niet als actuele waarheid; markeer een rapport alleen
als archief wanneer verwarring aannemelijk is.

## Documentation Definition of Done

Een functionele wijziging is pas gereed wanneer deze controle is uitgevoerd:

- Werk `docs/handoff.md` bij als status, werking, beperkingen of volgende stappen veranderen.
- Werk `docs/prd.md` bij bij scope-, prioriteits- of acceptance-criteriawijzigingen.
- Werk `docs/design.md` bij bij nieuwe of gewijzigde schermen, componenten, copy of interacties.
- Werk `docs/architecture.md` bij bij wijzigingen aan stack, API, datamodel, beveiliging of datastromen.
- Werk `docs/deployment.md` bij bij hosting-, migratie-, secret- of deploywijzigingen.
- Werk het BMAD-storybestand en `sprint-status.yaml` samen bij.
- Werk `README.md` alleen bij als instappen, draaien, hoofdstatus of documentnavigatie verandert.
- Vermijd gekopieerde actuele status in meerdere documenten; verwijs waar mogelijk naar de canonieke bron.
- Voer `npm run docs:check` uit en los fouten op voordat de taak wordt afgerond.

## Implementatieregels

- Respecteer bestaande, mogelijk door de gebruiker gemaakte worktreewijzigingen.
- Plaats pure domeinlogica en tests in `packages/core`.
- Registreer Fastify-routes via `buildApp()` in `api/src/app.ts`.
- Gebruik de gedeelde kalenderdaghelpers en de vaste `Profile.timeZone` voor daggrenzen.
- Bewaar secrets nooit in frontendcode, Markdown of versiebeheer.
- Handmatig loggen blijft beschikbaar als AI of Open Food Facts faalt.
- Houd budget-, reward- en confidence-kleuren semantisch gescheiden volgens `docs/design.md`.
