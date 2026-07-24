---
project_name: 'CalCount'
user_name: 'Gebruiker'
date: '2026-07-24'
sections_completed: ['technology_stack', 'implementation_rules', 'documentation_authority']
---

# Project Context for AI Agents

## Canonieke bronnen

Lees vóór wijzigingen:

1. `docs/handoff.md` voor actuele status en prioriteit.
2. `docs/prd.md` voor scope en acceptance criteria.
3. `docs/design.md` voor visueel en interactioneel ontwerp.
4. `docs/architecture.md` voor technische contracten.

BMAD-reviewrapporten en oudere designbestanden zijn herleidbare bron-/historische
artefacten; de bestanden in `docs/` zijn leidend.

## Technology Stack

- npm-workspaces met `packages/core`, `api` en `web`.
- React 18 + TypeScript + Vite + Tailwind + TanStack Query.
- Fastify 5 + Prisma 6 + Postgres/Neon.
- GitHub Pages frontend, Render backend, Neon database.
- Single-user env-login met ondertekende sessiecookie.
- Anthropic AI uitsluitend via de backend.

## Critical Implementation Rules

- Gebruik `buildApp()` in `api/src/app.ts`; voeg routes daar toe en start geen tweede server.
- Plaats pure domeinlogica met tests in `packages/core`.
- Behandel `YYYY-MM-DD` als kalenderdagtag en gebruik de gedeelde datumhelpers.
- Gebruik de vaste `Profile.timeZone` voor actuele dag-/streakgrenzen.
- Bewaar AI- of databasesleutels nooit in frontendcode of documentatie.
- Handmatig loggen blijft de fallback als AI of Open Food Facts faalt.
- Respecteer `docs/design.md`: budget-, reward- en confidence-kleuren hebben aparte semantiek.
- Bestaande worktreewijzigingen kunnen van de gebruiker zijn; overschrijf ze niet.
- Werk na iedere feature minimaal README, handoff, PRD-status, architectuur/design indien
  geraakt, sprintstatus en het storybestand bij.

## Actuele prioriteit

Epics 5 en 6 zijn afgerond. Epic 3 blijft geparkeerd tot een expliciet vervolgseintje.
