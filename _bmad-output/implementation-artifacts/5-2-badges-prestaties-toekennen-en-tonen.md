# Story 5.2: Badges/prestaties toekennen en tonen

Status: done

## Story

Als gebruiker wil ik badges verdienen bij mijlpalen, zodat mijn voortgang op meer
manieren zichtbaar en belonend wordt.

## Gerealiseerd

- Permanente `BadgeAward`-records; eenmaal verdiende badges worden nooit verwijderd.
- Mijlpalen: 3/7/30 dagen streak, 30 unieke logdagen en eerste trendmatige
  gewichtsvooruitgang richting het streefgewicht.
- Gewichtstrend vereist minimaal drie metingen, regressierichting én netto nadering van
  het doel; één losse meting is onvoldoende.
- `/api/badges` evalueert ontbrekende awards en levert status en voortgang van alle badges.
- Na productbesluit van 2026-07-24 is het permanente Prestaties-overzicht verwijderd.
- Nieuwe badges verschijnen alleen bij het openen van Voortgang, maximaal zes seconden
  in een subtiele gestapelde melding; meerdere gelijktijdige awards gaan niet verloren.

## Verificatie

- 6 badge-/gewichtstrendtests; volledige core-suite bevat 32 geslaagde tests.
- API TypeScript-check en Prisma-schema-validatie geslaagd.
- Web TypeScript-check en productiebuild geslaagd.
- Migratie `20260724130000_add_badge_awards` is succesvol op Neon toegepast.
- Ingelogde lokale API-smoketest geslaagd: health, login, vijf badgedefinities en streak.
