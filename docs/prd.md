# CalCount Product Requirements Document (PRD)

| | |
|---|---|
| **Project** | CalCount — AI-ondersteunde calorietracker |
| **Auteur** | PM (BMAD-methode) |
| **Datum** | 2026-07-23 |
| **Versie** | v1.0 |
| **Status** | Actief — Epics 1, 2 & 4 gebouwd en geverifieerd; Epic 3 uitgesteld. Zie §11 voor de implementatiestatus. |

---

## 1. Goals and Background Context

### Goals

- Een gebruiker kan binnen 2 minuten na het openen van de app zien hoeveel calorieën hij/zij vandaag nog mag eten.
- Een gebruiker kan afvallen door dagelijks onder een persoonlijk, wetenschappelijk onderbouwd caloriebudget te blijven.
- Een maaltijd of tussendoortje loggen kost minder dan 20 seconden, ook onderweg.
- Eten tracken kan op drie manieren: (1) foto maken en AI schat de calorieën, (2) opgeven hoeveel gram van een product gegeten is, (3) kiezen uit eerder gegeten items.
- De app draait volledig op de telefoon en werkt met één hand te bedienen.
- De gebruiker houdt motivatie vast door dagelijkse voortgang en gewichtsverloop over tijd te zien.

### Background Context

Mensen die willen afvallen weten vaak niet hoeveel ze mogen eten en vinden bestaande calorietrackers te bewerkelijk: eindeloos zoeken in databases, porties inschatten en handmatig invoeren. Daardoor haken ze af. CalCount lost dit op door (a) het dagbudget automatisch te berekenen uit persoonlijke gegevens en een afvaldoel, en (b) het loggen drastisch te versimpelen met AI-fotoherkenning en een gewicht-gebaseerde invoer. De focus ligt op *snelheid en gemak van tracken* als belangrijkste knop om gedrag vol te houden.

Het primaire platform is de smartphone. De eerste versie richt zich op één gebruiker (de aanvrager) met ruimte om later te verbreden.

### Change Log

| Datum | Versie | Beschrijving | Auteur |
|---|---|---|---|
| 2026-07-22 | v0.1 | Eerste concept-PRD volgens BMAD | PM |
| 2026-07-23 | v1.0 | Beslissingen §9 bevestigd; Epics 1/2/4 gebouwd; Epic 3 uitgesteld; implementatiestatus (§11) toegevoegd | PM |

---

## 2. Requirements

### Functional Requirements

- **FR1:** Het systeem berekent het dagelijkse calorie-onderhoudsniveau (TDEE) uit lengte, gewicht, leeftijd, geslacht en activiteitsniveau via de Mifflin-St Jeor-formule.
- **FR2:** De gebruiker stelt een afvaldoel in (bijv. streefgewicht en/of tempo in kg per week); het systeem leidt hieruit een dagelijks caloriebudget af met een veilig calorietekort.
- **FR3:** Het systeem toont op het hoofdscherm het resterende caloriebudget van vandaag: budget − gelogd = resterend.
- **FR4:** De gebruiker kan een voedingsitem loggen door een foto te maken; een AI-visiemodel herkent het gerecht en schat calorieën (en macro's) plus de aannemelijke portiegrootte.
- **FR5:** Na een AI-schatting kan de gebruiker de geschatte hoeveelheid (gram/porties) en calorieën corrigeren vóór opslaan.
- **FR6:** De gebruiker kan een item loggen door een product te kiezen en het gegeten gewicht in gram (of aantal porties) op te geven; het systeem berekent de calorieën.
- **FR7:** Het systeem houdt een lijst bij van eerder gelogde items zodat herhaald loggen met één tik kan.
- **FR8:** De gebruiker kan een gelogd item bewerken of verwijderen.
- **FR9:** Het systeem toont per dag het totaal aan gegeten calorieën en of de gebruiker onder of boven het budget zit.
- **FR10:** De gebruiker kan zijn actuele gewicht periodiek invoeren; het systeem toont het gewichtsverloop over tijd.
- **FR11:** Het systeem herberekent budget en TDEE automatisch mee wanneer het gewicht verandert.
- **FR12:** De gebruiker kan de dag terugbladeren en een geschiedenis van eerdere dagen inzien.
- **FR13:** Het systeem geeft visuele feedback (kleur/indicator) wanneer de gebruiker het dagbudget nadert of overschrijdt.

### Non-Functional Requirements

- **NFR1:** De app is een mobile-first webapplicatie (PWA) die op iOS en Android in de browser werkt en installeerbaar is op het startscherm. *(Aanname — zie §9.)*
- **NFR2:** Het hoofdscherm en het loggen zijn met één hand en met grote tikdoelen bedienbaar.
- **NFR3:** Een AI-fotoschatting levert binnen ~10 seconden een resultaat op onder normale mobiele netwerkomstandigheden.
- **NFR4:** Foto's worden gebruikt voor herkenning en niet langer bewaard dan nodig; de gebruiker geeft expliciet toestemming voor cameragebruik.
- **NFR5:** Persoonlijke gezondheidsgegevens (gewicht, leeftijd, eetlog) worden veilig opgeslagen en niet gedeeld met derden buiten de gebruikte AI-provider voor herkenning.
- **NFR6:** De app blijft bruikbaar bij korte netwerkonderbreking: reeds geladen dagdata en handmatig loggen werken offline; AI-foto vereist verbinding.
- **NFR7:** AI-kosten per fotoschatting blijven beheersbaar (richtwaarde onder enkele centen per foto) door een efficiënt visiemodel te kiezen.
- **NFR8:** Calorieschattingen worden gepresenteerd als *schatting met marge*, niet als exacte waarde, om verkeerde precisieverwachting te voorkomen. De app is geen medisch hulpmiddel.

---

## 3. User Interface Design Goals

### Overall UX Vision

Een rustige, snelle en aanmoedigende app die één vraag centraal beantwoordt: *"Hoeveel mag ik vandaag nog?"* Alles draait om zo min mogelijk frictie tussen "ik heb iets gegeten" en "het staat gelogd". Geen overladen dashboards; de kern is één helder getal en een grote actieknop om te loggen.

### Key Interaction Paradigms

- **Eén-getal-hoofdscherm:** resterende calorieën groot in beeld, met een ring/balk die de dag visualiseert.
- **Prominente "+"-logknop** die drie routes aanbiedt: foto, gewicht/product, of recent item.
- **Foto-flow:** camera → AI-schatting → snelle correctie → opslaan.
- **Correctie via schuif/stepper** voor gram of porties, niet via typen waar mogelijk.

### Core Screens and Views

- Onboarding & profiel (gegevens + doel)
- Hoofd/dagscherm (resterend budget + gelogde items)
- Log-flow foto
- Log-flow gewicht/product
- Voortgang & gewicht (grafiek + geschiedenis)
- Instellingen (doel bijstellen, profiel, privacy)

### Accessibility

Streven naar WCAG AA: voldoende contrast, grote tikdoelen, leesbare tekst, ondersteuning voor dynamische lettergrootte. *(Aanname — te bevestigen.)*

### Branding

Nog niet vastgesteld. Voorstel: schoon, licht, met één accentkleur voor voortgang (groen = onder budget, oranje/rood = eroverheen). *(Aanname.)*

### Target Device and Platforms

Web Responsive, mobile-first (primair smartphone-portret). Desktop is niet in scope voor v1.

---

## 4. Technical Assumptions

> Deze sectie legt de technische richting vast die de architect als startpunt gebruikt. Alle punten zijn voorstellen en expliciet als aanname gemarkeerd waar relevant (§9).

### Repository Structure

- **Monorepo** met gescheiden `web/` (frontend) en `api/` (backend) mappen. Eenvoudig te beheren voor één ontwikkelaar.

### Service Architecture

- **Monolithische backend** (één service) met een frontend PWA. Geen microservices in v1.
- De backend fungeert als proxy naar de AI-visieprovider zodat API-sleutels niet in de client staan.

### Testing Requirements

- **Unit + integratietests** voor de rekenlogica (TDEE, budget, dagtotaal) — dit is de kern die correct moet zijn.
- Handmatige/end-to-end verificatie voor de foto-flow.

### Additional Technical Assumptions and Requests

- **Frontend:** React + TypeScript als PWA (installeerbaar, camera-toegang via web API's). *(Aanname.)*
- **Backend:** lichtgewicht API (bijv. Node/TypeScript of Python). *(Aanname — architect kiest.)*
- **Database:** relationele opslag voor profiel, eetlog en gewicht (bijv. SQLite/Postgres). *(Aanname.)*
- **AI-fotoherkenning:** een Claude-visiemodel (bijv. `claude-sonnet-5` of `claude-haiku-4-5` voor kostenefficiëntie) dat de foto omzet naar een gestructureerde schatting (gerecht, geschatte gram, calorieën, macro's) via een prompt die JSON teruggeeft. *(Aanname — te valideren op nauwkeurigheid en kosten.)*
- **Voedingsdatabase:** voor handmatig loggen op gewicht een caloriereferentie per 100 g. Opties: publieke dataset (bijv. Open Food Facts) of AI-geschatte referentie. *(Aanname — bron te kiezen.)*
- **Authenticatie:** v1 is single-user; simpele lokale/gepersonaliseerde toegang volstaat. Multi-user/login is toekomstig. *(Aanname.)*

---

## 5. Epic List

- **Epic 1 — Fundament & Persoonlijk Caloriebudget:** projectopzet, profiel-onboarding en de berekening die toont hoeveel calorieën de gebruiker per dag mag.
- **Epic 2 — Eten Loggen & Dagoverzicht:** handmatig loggen (op gewicht/porties en via recente items), dagtotaal en resterend budget.
- **Epic 3 — AI-Fotoherkenning:** eten loggen door een foto te maken met AI-schatting en correctie.
- **Epic 4 — Voortgang & Bijsturen:** gewicht bijhouden, trends zien en budget automatisch mee laten bewegen.

*Volgorde: elke epic levert een werkende, waardevolle stap op. Na Epic 1 weet de gebruiker zijn budget; na Epic 2 kan hij volledig (handmatig) tracken; Epic 3 voegt het AI-gemak toe; Epic 4 sluit de afval-feedbackloop.*

---

## 6. Epic Details

### Epic 1 — Fundament & Persoonlijk Caloriebudget

**Doel:** Opzetten van het project en de app-basis, en de gebruiker in staat stellen zijn profiel en afvaldoel in te voeren zodat de app een persoonlijk dagelijks caloriebudget toont. Dit levert direct waarde: de gebruiker weet hoeveel hij mag eten.

#### Story 1.1 — Projectopzet en app-shell
Als ontwikkelaar wil ik een werkende mobiele app-shell met frontend en backend opgezet hebben, zodat er een fundament is om functies op te bouwen.
- **AC1:** Een PWA-frontend draait op de telefoon en is installeerbaar op het startscherm.
- **AC2:** Er is een backend die een health-check endpoint aanbiedt dat de frontend succesvol aanroept.
- **AC3:** Basisnavigatie tussen minimaal twee lege schermen werkt.
- **AC4:** Er is een testopzet aanwezig die minimaal één test uitvoert.

#### Story 1.2 — Profiel invoeren
Als gebruiker wil ik mijn lengte, gewicht, leeftijd, geslacht en activiteitsniveau invoeren, zodat de app mijn caloriebehoefte kan berekenen.
- **AC1:** Er is een formulier voor alle genoemde velden met invoervalidatie (redelijke min/max).
- **AC2:** De gegevens worden opgeslagen en blijven bewaard na herstart van de app.
- **AC3:** De gebruiker kan de gegevens later aanpassen.

#### Story 1.3 — TDEE en caloriebudget berekenen
Als gebruiker wil ik een afvaldoel instellen, zodat de app mijn dagelijkse caloriebudget berekent.
- **AC1:** Het systeem berekent TDEE via Mifflin-St Jeor × activiteitsfactor.
- **AC2:** De gebruiker stelt een afvaltempo of streefgewicht in; het systeem leidt een dagelijks tekort af.
- **AC3:** Het systeem hanteert een veilige ondergrens (waarschuwt bij een te laag budget).
- **AC4:** Het berekende dagbudget wordt getoond met een korte uitleg dat het een schatting is.

#### Story 1.4 — Dagbudget op hoofdscherm
Als gebruiker wil ik bij het openen van de app direct mijn dagbudget zien, zodat ik weet hoeveel ik vandaag mag eten.
- **AC1:** Het hoofdscherm toont het caloriebudget van vandaag prominent.
- **AC2:** Bij nog niets gelogd is "resterend" gelijk aan het volledige budget.
- **AC3:** Het scherm is met één hand leesbaar en bedienbaar op een telefoon.

---

### Epic 2 — Eten Loggen & Dagoverzicht

**Doel:** De gebruiker kan eten vastleggen op basis van gewicht/porties en snel via eerder gelogde items, en ziet in real time hoeveel calorieën hij heeft gegeten en hoeveel er overblijft.

#### Story 2.1 — Item loggen op gewicht
Als gebruiker wil ik een product kiezen en opgeven hoeveel gram ik at, zodat de calorieën automatisch worden berekend en gelogd.
- **AC1:** De gebruiker kan een product selecteren/opgeven met een calorie-per-100g-waarde.
- **AC2:** Bij invoer van gram berekent het systeem de calorieën en toont deze vóór opslaan.
- **AC3:** Na opslaan verschijnt het item in de daglijst en daalt het resterende budget.

#### Story 2.2 — Dagtotaal en resterend budget
Als gebruiker wil ik het totaal aan gegeten calorieën en wat ik nog mag zien, zodat ik onder mijn budget kan blijven.
- **AC1:** Het hoofdscherm toont budget, gegeten en resterend, en werkt na elke log bij.
- **AC2:** Een visuele indicator toont wanneer het budget bijna op of overschreden is.
- **AC3:** Bij overschrijding is dit duidelijk zichtbaar zonder de gebruiker te ontmoedigen (informatief, niet bestraffend).

#### Story 2.3 — Item bewerken en verwijderen
Als gebruiker wil ik een gelogd item kunnen aanpassen of verwijderen, zodat ik fouten kan herstellen.
- **AC1:** Elk item in de daglijst kan bewerkt worden (hoeveelheid/calorieën).
- **AC2:** Elk item kan verwijderd worden; het dagtotaal past direct aan.

#### Story 2.4 — Recente items snel herhalen
Als gebruiker wil ik uit mijn eerder gelogde items kiezen, zodat ik terugkerend eten met één tik kan loggen.
- **AC1:** Er is een lijst met recent/vaak gelogde items.
- **AC2:** Eén tik logt het item met de laatst gebruikte hoeveelheid.

#### Story 2.5 — Daggeschiedenis inzien
Als gebruiker wil ik eerdere dagen terugzien, zodat ik mijn gedrag over tijd kan volgen.
- **AC1:** De gebruiker kan terug- en vooruitbladeren tussen dagen.
- **AC2:** Per dag zijn de gelogde items en het totaal zichtbaar.

---

### Epic 3 — AI-Fotoherkenning

**Doel:** De gebruiker kan eten loggen door simpelweg een foto te maken; AI schat wat het is en hoeveel calorieën, waarna de gebruiker snel kan corrigeren en opslaan.

#### Story 3.1 — Foto maken en versturen
Als gebruiker wil ik een foto van mijn eten maken in de app, zodat die naar de AI kan voor herkenning.
- **AC1:** De gebruiker kan met toestemming de camera openen of een foto uit de galerij kiezen.
- **AC2:** De foto wordt via de backend naar de AI-provider gestuurd (sleutel niet in de client).
- **AC3:** Er is een laadindicator; een fout (geen verbinding) geeft een nette melding met terugvaloptie naar handmatig loggen.

#### Story 3.2 — AI-schatting van gerecht en calorieën
Als gebruiker wil ik dat de AI herkent wat op de foto staat en de calorieën schat, zodat ik niet handmatig hoef te zoeken.
- **AC1:** Het visiemodel geeft een gestructureerd resultaat: herkend gerecht, geschatte hoeveelheid (gram/porties), calorieën en macro's.
- **AC2:** Bij meerdere items op de foto worden deze als aparte regels teruggegeven waar mogelijk.
- **AC3:** Het resultaat wordt duidelijk als *schatting met marge* gepresenteerd.

#### Story 3.3 — Schatting corrigeren en opslaan
Als gebruiker wil ik de AI-schatting kunnen bijstellen, zodat het gelogde item klopt met wat ik werkelijk at.
- **AC1:** De gebruiker kan hoeveelheid en calorieën aanpassen (schuif/stepper of invoer).
- **AC2:** De gebruiker kan een herkend item verwijderen of toevoegen vóór opslaan.
- **AC3:** Na opslaan verschijnt het item in de daglijst en past het dagtotaal aan (zoals in Epic 2).

#### Story 3.4 — Foto-item hergebruiken
Als gebruiker wil ik een via foto herkend item terugvinden in mijn recente items, zodat ik het later opnieuw kan loggen zonder nieuwe foto.
- **AC1:** Foto-herkende items komen in de lijst met recente items (Story 2.4).
- **AC2:** Herhalen werkt met de laatst bevestigde hoeveelheid/calorieën.

---

### Epic 4 — Voortgang & Bijsturen

**Doel:** De gebruiker houdt zijn gewicht bij, ziet de trend, en de app past het caloriebudget automatisch aan naarmate het gewicht verandert — zodat de afval-feedbackloop rond is.

#### Story 4.1 — Gewicht bijhouden
Als gebruiker wil ik regelmatig mijn gewicht invoeren, zodat ik mijn voortgang kan volgen.
- **AC1:** De gebruiker kan een gewichtsmeting met datum invoeren en opslaan.
- **AC2:** Metingen zijn te bewerken en te verwijderen.

#### Story 4.2 — Gewichtsverloop tonen
Als gebruiker wil ik mijn gewicht over tijd in een grafiek zien, zodat ik zie of mijn aanpak werkt.
- **AC1:** Er is een grafiek met gewicht over tijd.
- **AC2:** De grafiek toont de trend richting het streefgewicht.

#### Story 4.3 — Budget automatisch herberekenen
Als gebruiker wil ik dat mijn caloriebudget meebeweegt met mijn gewicht, zodat mijn tekort realistisch blijft.
- **AC1:** Bij een nieuwe gewichtsmeting worden TDEE en dagbudget herberekend.
- **AC2:** Een merkbare budgetwijziging wordt aan de gebruiker gemeld met korte uitleg.

#### Story 4.4 — Doel bijstellen
Als gebruiker wil ik mijn afvaltempo of streefgewicht kunnen aanpassen, zodat ik kan versnellen of rustiger aan doen.
- **AC1:** De gebruiker kan doel/tempo wijzigen in instellingen.
- **AC2:** Het dagbudget past direct aan en waarschuwt bij een te laag budget.

---

## 7. Out of Scope (v1)

- Meerdere gebruikers, accounts en login/synchronisatie tussen apparaten.
- Barcodescanner voor verpakte producten.
- Koppeling met wearables/health-apps (Apple Health, Google Fit).
- Water-, beweging- of macro-doelen als aparte tracking-modules.
- Sociale functies, coaching of meal-planning.
- Native app-store distributie (iOS/Android native builds).

---

## 8. Success Metrics (voorstel)

- **Trackgemak:** mediane tijd om een maaltijd te loggen < 20 seconden.
- **Volhouden:** gebruiker logt op ≥ 5 van de 7 dagen in een week.
- **AI-nut:** ≥ 60% van de fotoschattingen wordt zonder grote correctie geaccepteerd.
- **Uitkomst:** gewichtstrend beweegt richting het streefgewicht over 4+ weken.

---

## 9. Bevestigde beslissingen

Deze punten zijn bevestigd tijdens de bouw (waren eerder open aannames):

1. **Platform:** PWA (web, mobile-first, installeerbaar). ✅ bevestigd.
2. **Scope v1:** single-user, geen login/accounts. ✅ bevestigd.
3. **Tech stack:** React + TypeScript + Vite (PWA) + Tailwind; Fastify + TypeScript; Postgres via Prisma (Neon in productie, zie hieronder). ✅ bevestigd. *Productie-hostingdoel: Netlify + Neon — zie [architecture.md](architecture.md) §12 en [deployment.md](deployment.md).*
4. **Voedingsbronnen:** combinatie van **Open Food Facts** (zoeken), **handmatig** (altijd terugval, offline), **AI-tekstschatting** (Claude) en later **AI-fotoschatting**. ✅ bevestigd. Handmatig is altijd de fallback.
5. **AI-model:** Claude, server-side via proxy; instelbaar via env (`CALCOUNT_AI_MODEL`, default `claude-opus-4-8`; `claude-haiku-4-5` voor lagere kosten). Nauwkeurigheid/kosten nog te valideren bij Epic 3.
6. **Meeteenheden:** metriek (gram, kg, cm). ✅ bevestigd.
7. **Gewicht → budget:** een nieuwe gewichtsmeting werkt het profielgewicht bij, dus TDEE/budget bewegen automatisch mee (FR11). ✅ bevestigd.
8. **Streefgewicht:** optioneel in te stellen; grafiek toont voortgang naar doel. ✅ bevestigd.
9. **Afvaltempo-standaard:** ~0,5 kg/week met veilige ondergrens (♀ 1200 / ♂ 1500 kcal). ✅ bevestigd.

---

## 10. Herzien: Epic 3 (AI-fotoherkenning) uitgesteld

Op verzoek is Epic 3 (foto maken → AI schat calorieën) **uitgesteld**. De onderliggende infrastructuur is er wel op voorbereid: de `photo`-bron bestaat in het datamodel, het API-contract staat in [architecture.md §5](architecture.md), en de log-flow heeft al een AI-tekstschatting die dezelfde correctie-UX gebruikt. Epic 3 vereist een `ANTHROPIC_API_KEY` om echt te testen.

De rest van de PRD (Goals, Requirements, UI, Epics 1/2/4) blijft ongewijzigd geldig.

---

## 11. Implementatiestatus

| Epic | Status | Toelichting |
|---|---|---|
| 1 — Fundament & Persoonlijk Caloriebudget | ✅ Gebouwd & geverifieerd | Profiel, TDEE/budget, één-getal-hoofdscherm |
| 2 — Eten loggen & dagoverzicht | ✅ Gebouwd & geverifieerd | Zoeken (OFF), handmatig, AI-tekst, recent; dagtotaal; bewerken/verwijderen; dagnavigatie |
| 3 — AI-fotoherkenning | ⏸️ Uitgesteld | Zie §10 |
| 4 — Voortgang & Bijsturen | ✅ Gebouwd & geverifieerd | Gewicht bijhouden, trendgrafiek + streefgewicht, auto-herberekening budget, doel bijstellen |

**Nog niet gedaan:** productie-deployment (repo-kant klaar voor Netlify + Neon — zie [deployment.md](deployment.md); Neon-project en Netlify-site zelf nog aan te maken).

Voor de volledige overdracht — hoe lokaal te draaien, repo-structuur, keuzes, openstaande punten — zie **[handoff.md](handoff.md)**.

### Aanbevolen volgorde
1. Open beslissingen §9 bevestigen.
2. Architectuurdocument opstellen.
3. Epics/stories verfijnen tot uitvoerbare taken en Epic 1 bouwen.
