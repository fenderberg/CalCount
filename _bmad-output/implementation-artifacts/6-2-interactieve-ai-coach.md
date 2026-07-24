# Story 6.2 — Interactieve AI-coach

Status: done

## Resultaat

Als gebruiker kan ik binnen Voortgang vervolgvragen stellen over mijn voeding, budget
en gewichtsvoortgang op basis van mijn eigen CalCount-data.

## Gebouwd

- `POST /api/coach` gebruikt een compacte context over de laatste 28 dagen.
- Minimaal vier unieke logdagen zijn vereist; bij minder data wordt geen antwoord verzonnen.
- De laatste twaalf berichten gaan vanuit React-state mee voor sessiegeheugen en worden
  niet in de database opgeslagen.
- Promptregels beperken de coach tot voeding, budget en voortgang en laten medische of
  niet-relevante vragen weigeren.
- `AiCoachUsage` bewaart uitsluitend een teller per kalenderdag in de profieltijdzone.
- `GET /api/coach/usage` toont de resterende limiet; maximaal twintig succesvolle
  vragen per dag. Mislukte AI-aanroepen verbruiken geen vraag.
- De UI bevat gespreksballonnen, een vraagveld, fouttoestand, teller en disclaimer.

## Verificatie

- Prisma-schema geldig en migratie `20260724150000_add_theme_and_epic6` toegepast op Neon.
- API-TypeScriptcheck en webproductiebouw slagen.
- Zonder AI blijft loggen/budget technisch onafhankelijk via afzonderlijke routes.
- Ingelogde API-smoketest bevestigt gebruiksstatus en de 422-uitleg bij te weinig data.

## Bestanden

- `api/src/services/aiAdvice.ts`
- `api/src/routes/advice.ts`
- `api/prisma/schema.prisma`
- `web/src/screens/Progress.tsx`
- `web/src/api.ts`
