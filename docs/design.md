---
name: CalCount
status: final
updated: '2026-07-24'
canonical: true
sources:
  - docs/prd.md
  - docs/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-CalCount-2026-07-23/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-CalCount-2026-07-23/EXPERIENCE.md
---

# CalCount Design System & Experience

Dit is de **definitieve en canonieke designspecificatie** voor CalCount. De BMAD-bestanden
onder `_bmad-output/planning-artifacts/ux-designs/` zijn de bronartefacten; bij verschil
is dit document leidend. Het combineert visuele identiteit, interactiegedrag en de actuele
implementatiestatus.

## 1. Ontwerpprincipes

CalCount voelt als een rustig, persoonlijk voedingslogboek en niet als een klinische
gezondheidsapp of competitieve habit-tracker.

- Eén centrale vraag: **“Hoeveel mag ik vandaag nog?”**
- Getallen zijn visueel belangrijker dan navigatie of decoratie.
- Primaire acties staan in de onderste duimzone.
- Gamification ondersteunt, maar concurreert nooit met het caloriebudget.
- AI-uitkomsten zijn herkenbaar als schatting of suggestie.
- Nederlandse interfacecopy is kort, rustig en niet-bestraffend.

Referentieformaat: smartphone-portret van ongeveer 390 × 844 px. De PWA blijft bruikbaar
op bredere schermen, maar een afzonderlijk desktopdashboard valt buiten de huidige scope.

## 2. Design tokens

### Kleuren

| Token | Waarde | Gebruik |
|---|---:|---|
| `surface-page` | `#f7f1e6` | Warme pagina-achtergrond |
| `surface-card` | `#ffffff` | Kaarten en lijstregels |
| `surface-muted` | `#f0e7d6` | Secundaire vlakken |
| `surface-track` | `#ece0cd` | Ring-, slider- en voortgangstracks |
| `ink` | `#2a2621` | Primaire tekst, knoppen en FAB |
| `text-muted` | `#8a857c` | Secundaire tekst |
| `text-subtle` | `#6f6a63` | Labels en uitleg |
| `text-faint` | `#a39d93` | Tertiaire metadata |
| `budget-under` | `#2f8f5e` | Binnen budget |
| `budget-near` | `#d98a2b` | Budget nadert grens |
| `budget-over` | `#d8543f` | Boven budget |
| `reward` | `#8a86d6` | Streaks en badges |
| `reward-surface` | `#efedf9` | Achtergrond gamification |
| `reward-text` | `#5d59b3` | Tekst gamification |
| `confidence-high` | `#2f8f5e` | Hoge AI-confidence |
| `confidence-medium` | `#b06d1a` | Middelmatige AI-confidence |
| `confidence-low` | `#c26a2c` | Lage AI-confidence, bewust niet rood |

Dark mode gebruikt dezelfde semantische tokens met donkere surfaces: pagina `#17140f`,
kaart `#211d17`, muted `#2d271f`, track `#3e352a` en lichte ink `#f3efe8`.
Budget-, reward- en confidencekleuren worden in dark mode lichter/verzadigder gemaakt,
maar behouden exact dezelfde betekenis. Voor het inloggen volgt de shell de
systeemvoorkeur; na inloggen is de expliciete keuze in Profiel leidend en server-side
opgeslagen.

Semantische kleurfamilies blijven gescheiden:

- Groen/oranje/rood is uitsluitend voor de budgetstatus.
- Lila is uitsluitend voor streaks en badges.
- Confidence-low gebruikt oranjebruin; rood betekent nooit “onzekere AI”.

### Typografie

Primaire familie: **Hanken Grotesk**, gewichten 400–800. Alle cijfers gebruiken
`font-variant-numeric: tabular-nums`.

| Rol | Richtwaarde |
|---|---|
| Displaygetal | 52–60 px, gewicht 800, tracking `-0.03em` |
| Grote heading | 27–34 px, gewicht 800 |
| Sectieheading | 20–22 px, gewicht 700 |
| Body | 15–16 px, gewicht 500 |
| Label | 12–13 px, gewicht 600 |
| Systeemmetadata | 11–12 px, `ui-monospace` |

### Vorm, ruimte en diepte

- Ruimteschaal: 4 / 8 / 12 / 16 / 24 px.
- Minimum tikdoel: 48 × 48 px.
- Standaard radius: 16–18 px; grote sheets 22–30 px; pills/cirkels volledig rond.
- Kaarten gebruiken vooral kleurcontrast plus een haarlijnrand, niet zware schaduw.
- De FAB is 62 px en krijgt een warme, inktkleurige slagschaduw.
- Bottom sheets hebben 30 px afgeronde bovenhoeken en komen van onderen binnen.

## 3. Informatiearchitectuur

Er zijn twee hoofdbestemmingen in de vaste onderste tabbalk:

1. **Vandaag** — dagbudget, streak, gelogde items en de centrale `+`-actie.
2. **Voortgang** — subtabs **Gewicht**, **Inzichten** en **AI-coach**.

Onboarding en Profiel/Instellingen staan buiten de hoofdtabstructuur. De tijdzone voor
daggrenzen hoort bij Profiel.

Huidige status:

- Vandaag, logsheet, profiel en gewicht/voortgang zijn geïmplementeerd.
- De compacte streakkaart, reward-styling en permanente badge-awards zijn geïmplementeerd;
  een nieuwe badge verschijnt uitsluitend als tijdelijke popup bij openen van Voortgang.
- Wekelijkse AI-inzichten en de sessiegebaseerde AI-coach zijn geïmplementeerd.
- Light/dark mode is op alle huidige schermen via semantische tokens geïmplementeerd.
- Fotoanalyse heeft een geparkeerde read-only preview; correctie en opslag volgen later.

## 4. Componentpatronen

### Budgetring

De ring is het primaire hero-element. De track gebruikt `surface-track`; de vulling volgt
`budget-under`, `budget-near` of `budget-over`. De lijn is rond afgekapt en ongeveer 18 px
dik. Het resterende aantal kcal is dominant; budget en gegeten zijn secundair.

### Streak en badges

Streaks en badges gebruiken de lila reward-familie, blijven kleiner dan de budgetring en
komen later in de leesvolgorde. Copy is feitelijk: “4 dagen op rij”, niet “Fantastisch!”.
Geen confetti, levels, leaderboards of agressieve animatie.

Er is geen permanent badge-overzicht. Een nieuw verdiende badge verschijnt maximaal zes
seconden in een rustige lila popup bij het openen van Voortgang. Meerdere gelijktijdige
awards worden gestapeld; de popup blokkeert navigatie en logacties niet.

### AI-confidence

Een AI-geschat getal wordt als één samenhangend patroon getoond:

- confidencebadge (`HOOG`, `MIDDEL` of `LAAG`);
- `~` voor het geschatte getal;
- gestippelde onderstreping;
- margecaption, bijvoorbeeld `± 80 kcal`.

Toon deze onderdelen samen en presenteer AI-resultaten nooit als exacte feiten.

### Logsheet en correctie

De centrale FAB opent één bottom sheet met de modi Recent, Zoeken, Handmatig, AI-tekst en
Foto. De modi verdelen zich op beperkte breedte over twee rijen.

Voor getalcorrecties heeft een slider/stepper de voorkeur boven een toetsenbord. Typen
blijft beschikbaar waar precisie of toegankelijkheid dat vereist.

### Lijstitems

Tikken blijft de toegankelijke route naar bewerken. Naar links swipen onthult Wijzig/Wis;
een zichtbare `…`-knop biedt dezelfde acties zonder gesture.

### AI-coach

De coach is de bewuste uitzondering op “zo min mogelijk typen”: een meerregelig invoerveld,
duidelijke verzendknop, gespreksballonnen en zichtbare resterende daglimiet. Historie leeft
alleen zolang de subtab/sessie gemount blijft. AI-antwoorden dragen altijd de toelichting
“Suggesties zijn geen medisch advies”.

### Wekelijkse inzichten

De Inzichten-subtab toont één rustige kaart met bronperiode, observatie, mogelijke
verklaring en suggestie. Bij minder dan vier gelogde dagen in het zeven-dagenvenster
verschijnt uitleg in dezelfde kaartvorm. AI-fouten gebruiken een herstelbare fouttoestand.

## 5. Toestanden en feedback

- **Laden:** behoud de vorm van de verwachte inhoud met skeletons; geen kale spinner voor
  de circa tien seconden durende fotoanalyse.
- **Leeg:** leg rustig uit welke eerste actie mogelijk is.
- **Fout:** geef een herstelactie en houd Handmatig/Zoeken beschikbaar als AI faalt.
- **Budget overschreden:** informatief, exact en zonder beschamende toon.
- **Streak onderbroken:** “begin vandaag een nieuwe reeks”, zonder verlies- of strafcopy.
- **Offline:** reeds geladen informatie blijft leesbaar; netwerkafhankelijke acties leggen
  helder uit dat verbinding nodig is.

## 6. Toegankelijkheid

WCAG AA is de ondergrens:

- minimaal 48 px tikdoelen;
- zichtbare focusstijl en semantische labels;
- status nooit uitsluitend via kleur;
- tekstcontrast controleren op cream- en card-surfaces;
- tapbediening als alternatief voor gestures;
- dynamische tekst mag de hoofdactie niet afsnijden;
- animatie blijft subtiel en respecteert reduced-motion.

Light en dark mode gebruiken dezelfde informatiehiërarchie. Overlays blijven neutraal
zwart in plaats van de omkerende ink-token. Grafiekassen, tooltips, tabbalk, formulieren
en statusvlakken gebruiken CSS-variabelen. De themakeuze heeft een tekstlabel en de app
respecteert reduced-motion.

## 7. Besluiten en open ontwerpwerk

| Onderwerp | Besluit/status |
|---|---|
| Beweging-stat op hoofdscherm | Niet bouwen; geen PRD-requirement |
| Badge-mijlpalen | PRD-set is leidend: 3/7/30 streak, 30 logdagen, eerste positieve gewichtstrend |
| Swipeacties | Gebouwd; tap en `…` blijven als toegankelijke alternatieven |
| Budget-fit-preview tijdens correctie | Gebouwd; toont resterend of overschrijding live |
| Voortgang-subtabs | Gewicht, wekelijkse Inzichten en AI-coach gebouwd |
| Badgeweergave | Alleen tijdelijke popup bij openen Voortgang; geen overzichtsscherm |
| Dark mode | Gebouwd als profielsetting; handmatige mobiele contrastcontrole blijft release-QA |
| Foto-flow | Geparkeerd; design blijft geldig voor latere hervatting |

## 8. Relatie tot andere documentatie

- [prd.md](prd.md) bepaalt scope en acceptance criteria.
- [architecture.md](architecture.md) bepaalt technische contracten.
- Dit document bepaalt visuele en interactionele keuzes.
- [handoff.md](handoff.md) bevat de actuele implementatiestatus en volgende stappen.
- BMAD-designbestanden zijn herleidbare bronartefacten, niet langer de canonieke kopie.
