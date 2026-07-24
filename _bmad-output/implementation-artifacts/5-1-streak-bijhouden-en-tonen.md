# Story 5.1: Streak bijhouden en tonen

Status: done

## Story

Als gebruiker wil ik zien hoeveel dagen op rij ik heb gelogd, zodat ik gemotiveerd
blijf om de reeks vol te houden.

## Gerealiseerd

- De streak wordt berekend uit unieke kalenderdagen in de volledige bestaande loghistorie.
- Meerdere items op één dag tellen als één logdag.
- Een reeks die gisteren eindigt blijft gedurende vandaag actief; na een volledig gemiste
  dag wordt de huidige reeks zonder bestraffende tekst teruggezet.
- De langste streak en het totaal aantal logdagen worden alvast door de API teruggegeven
  voor Story 5.2.
- De apparaattijdzone wordt bij eerste gebruik opgeslagen als vaste IANA-tijdzone en kan
  via Profiel worden gewijzigd.
- Toevoegen, bewerken en verwijderen van een item ververst de streak.
- Het Vandaag-scherm toont de reeks compact boven het caloriebudget.
- De vaste tijdzone is via Profiel wijzigbaar en Vandaag gebruikt dezelfde daggrens.
- Visuele vervolgkeuzes voor streak/badges volgen de canonieke `docs/design.md`.

## Verificatie

- 6 unit tests voor de streaklogica, inclusief deduplicatie, onderbreking, historische
  langste reeks en verwijdering.
- API TypeScript-check geslaagd.
- Web TypeScript-check en productiebuild geslaagd.
- Prisma-schema gevalideerd; migratie `20260724110000_add_profile_timezone` is aangemaakt.
- Migratie `20260724110000_add_profile_timezone` is op 2026-07-24 succesvol op de
  geconfigureerde Neon-database toegepast.

## Completion note

Story afgerond op 2026-07-24. Reward-styling, badge-integratie, profielwijzigingen en
dark-mode-tokens gebruiken dezelfde vaste daggrens.
