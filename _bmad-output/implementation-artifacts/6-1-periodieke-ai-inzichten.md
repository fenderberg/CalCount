# Story 6.1 — Periodieke AI-inzichten

Status: done

## Resultaat

Als gebruiker krijg ik op Voortgang periodiek een automatisch inzicht over mijn
eetpatroon, budgetnaleving en gewichtstrend.

## Gebouwd

- `GET /api/insights` gebruikt een rollend venster van zeven kalenderdagen in de vaste
  profieltijdzone.
- Minimaal vier unieke logdagen zijn vereist; anders volgt rustige uitleg zonder AI-call.
- Claude formuleert maximaal drie korte delen: observatie, mogelijke verklaring en
  haalbare suggestie, expliciet zonder medisch advies.
- `AiInsight` bewaart periode, tekst en creatiedatum als onveranderlijke momentopname.
- Binnen zeven dagen wordt de laatste snapshot hergebruikt; bronbewerkingen herschrijven
  een bestaand inzicht nooit.
- Ontbrekende AI-sleutel en providerfouten leveren een nette fouttoestand op.
- De Inzichten-subtab toont periode, content en AI-disclaimer.

## Verificatie

- Prisma-schema geldig en migratie `20260724150000_add_theme_and_epic6` toegepast op Neon.
- API-TypeScriptcheck en webproductiebouw slagen.
- Bestaande core-suite: 32 geslaagde tests.
- Ingelogde API-smoketest bevestigt de `insufficient`-toestand zonder AI-call.

## Bestanden

- `api/src/services/aiAdvice.ts`
- `api/src/routes/advice.ts`
- `api/prisma/schema.prisma`
- `web/src/screens/Progress.tsx`
- `web/src/api.ts`
