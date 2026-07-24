# CalCount Product Requirements Document (PRD)

| | |
|---|---|
| **Project** | CalCount — AI-ondersteunde calorietracker |
| **Auteur** | PM (BMAD-methode) |
| **Datum** | 2026-07-23 |
| **Versie** | v1.1 |
| **Status** | Actief — Epics 1, 2 & 4 gebouwd en geverifieerd; Epic 3 heractiveerd; Epic 5 (Gamification) en Epic 6 (AI-advies) toegevoegd. Zie §11 voor de implementatiestatus. |

---

## 1. Goals and Background Context

### Goals

- Een gebruiker kan binnen 2 minuten na het openen van de app zien hoeveel calorieën hij/zij vandaag nog mag eten.
- Een gebruiker kan afvallen door dagelijks onder een persoonlijk, wetenschappelijk onderbouwd caloriebudget te blijven.
- Een maaltijd of tussendoortje loggen kost minder dan 20 seconden, ook onderweg.
- Eten tracken kan op drie manieren: (1) foto maken en AI schat de calorieën, (2) opgeven hoeveel gram van een product gegeten is, (3) kiezen uit eerder gegeten items.
- De app draait volledig op de telefoon en werkt met één hand te bedienen.
- De gebruiker houdt motivatie vast door dagelijkse voortgang en gewichtsverloop over tijd te zien.
- De gebruiker blijft gemotiveerd via lichte gamification (streak, badges) die consistent tracken beloont zonder de app druk of competitief te maken.
- De gebruiker krijgt AI-advies (periodieke inzichten én een interactieve coach) dat hem helpt begrijpen *waarom* zijn voortgang gaat zoals hij gaat, niet alleen *wat* de cijfers zijn.

### Background Context

Mensen die willen afvallen weten vaak niet hoeveel ze mogen eten en vinden bestaande calorietrackers te bewerkelijk: eindeloos zoeken in databases, porties inschatten en handmatig invoeren. Daardoor haken ze af. CalCount lost dit op door (a) het dagbudget automatisch te berekenen uit persoonlijke gegevens en een afvaldoel, en (b) het loggen drastisch te versimpelen met AI-fotoherkenning en een gewicht-gebaseerde invoer. De focus ligt op *snelheid en gemak van tracken* als belangrijkste knop om gedrag vol te houden.

Het primaire platform is de smartphone. De eerste versie richt zich op één gebruiker (de aanvrager) met ruimte om later te verbreden.

**Change-signaal v1.1:** na oplevering van Epics 1, 2 en 4 wil de opdrachtgever de app verder verbeteren: (1) Epic 3 (AI-fotoherkenning) alsnog bouwen, (2) lichte gamification toevoegen om trackgedrag te belonen, (3) AI-advies toevoegen dat verder gaat dan calorie-schatten, en (4) de visuele/UX-vormgeving redesignen (apart UX-designdocument, zie §3 en de aanbevolen volgorde in §11). Dit is een gerichte scope-uitbreiding van een actief PRD, geen koerswijziging — de rest van v1.0 blijft ongewijzigd geldig.

### Change Log

| Datum | Versie | Beschrijving | Auteur |
|---|---|---|---|
| 2026-07-22 | v0.1 | Eerste concept-PRD volgens BMAD | PM |
| 2026-07-23 | v1.0 | Beslissingen §9 bevestigd; Epics 1/2/4 gebouwd; Epic 3 uitgesteld; implementatiestatus (§11) toegevoegd | PM |
| 2026-07-23 | v1.1 | Change-signaal verwerkt: Epic 3 heractiveerd; Epic 5 (Gamification) en Epic 6 (AI-advies) toegevoegd (FR14–FR18, NFR9); UX-redesigntraject gestart (§3, §11) | PM |
| 2026-07-23 | v1.1 (verhard) | PRD gevalideerd (rubric + adversarial + edge-case-hunter, zie `_bmad-output/planning-artifacts/prds/prd-CalCount-2026-07-23/validation-report.md`); 6 high-severity gaten opgelost via opdrachtgever-beslissingen §9 #13–18: AI-modeldefault gereconcilieerd (haiku-4-5), badge-mijlpalen concreet vastgelegd, AI-coach-geheugen/limiet bepaald (sessie-geheugen, 20/dag), streak/badge-gedrag bij retroactieve wijziging vastgelegd, daggrens/tijdzone bepaald | PM |

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
- **FR14:** Het systeem houdt een streak bij van opeenvolgende dagen waarop de gebruiker ten minste één item heeft gelogd, en toont deze streak prominent (bv. op het hoofdscherm). De daggrens wordt bepaald door een vaste tijdzone-instelling van de gebruiker (default: apparaat-tijdzone bij eerste gebruik), niet door de ruwe kloktijd van het apparaat op het moment zelf — zo blijft de streak stabiel tijdens reizen. Wanneer een gelogd item achteraf wordt bewerkt of verwijderd (FR8), herberekent het systeem de streak op basis van de resterende loggeschiedenis (inclusief reeds bestaande historische data uit Epics 1/2/4 bij de introductie van deze functie); elk gelogd item telt mee ongeacht de bron (handmatig, product, foto — zie Epic 3).
- **FR15:** Het systeem kent badges/prestaties toe wanneer de gebruiker onderstaande mijlpalen bereikt; behaalde badges zijn zichtbaar in de app en blijven permanent behouden, ook als de onderliggende loggeschiedenis later wordt bewerkt of verwijderd (badges worden nooit met terugwerkende kracht ingetrokken). Mijlpaal-set (v1.1): 3 dagen streak, 7 dagen streak, 30 dagen streak, 30 dagen totaal gelogd (cumulatief, niet per se aaneengesloten), en de eerste keer dat de gewichtstrend (niet één losse meting) richting het streefgewicht beweegt. Worden meerdere badges gelijktijdig behaald, dan worden deze na elkaar/gestapeld getoond, niet verloren.
- **FR16:** Het systeem genereert periodiek (wekelijks, rollend venster van 7 dagen in de tijdzone van FR14) automatische AI-inzichten/tips op basis van het eetlog, de budgetnaleving en de gewichtstrend, en toont deze aan de gebruiker zonder dat hij erom hoeft te vragen. Een getoond inzicht is een momentopname en wordt niet met terugwerkende kracht herzien als latere bewerkingen (FR8) of een budgetherberekening (FR11) de brondata veranderen — het eerstvolgende inzicht reflecteert de actuele situatie.
- **FR17:** De gebruiker kan een vraag stellen aan een interactieve AI-coach over zijn voeding, budget of voortgang, en krijgt een gepersonaliseerd antwoord gebaseerd op zijn eigen gelogde data. De coach onthoudt de gesprekscontext binnen een sessie (vervolgvragen zijn mogelijk zolang het scherm open is), maar slaat het gesprek niet persistent op: bij het opnieuw openen start een nieuw gesprek zonder geheugen aan eerdere sessies.
- **FR18:** AI-inzichten en AI-coach-antwoorden worden gepresenteerd als suggestie/observatie, nooit als medisch advies — conform NFR8. *(Bevestigd: dit blijft de enige vangrail; de AI wordt niet expliciet gestuurd op de veilige ondergrens van Beslissing 9 — zie §9 beslissing 16.)*

### Non-Functional Requirements

- **NFR1:** De app is een mobile-first webapplicatie (PWA) die op iOS en Android in de browser werkt en installeerbaar is op het startscherm. *(Aanname — zie §9.)*
- **NFR2:** Het hoofdscherm en het loggen zijn met één hand en met grote tikdoelen bedienbaar.
- **NFR3:** Een AI-fotoschatting levert binnen ~10 seconden een resultaat op onder normale mobiele netwerkomstandigheden.
- **NFR4:** Foto's worden gebruikt voor herkenning en niet langer bewaard dan nodig; de gebruiker geeft expliciet toestemming voor cameragebruik.
- **NFR5:** Persoonlijke gezondheidsgegevens (gewicht, leeftijd, eetlog) worden veilig opgeslagen en niet gedeeld met derden buiten de gebruikte AI-provider voor herkenning/advies. Voor de AI-coach (Epic 6) geldt: het eetlog, budget en de gewichtstrend die als context worden meegestuurd, worden alleen voor het genereren van het antwoord gebruikt en niet persistent bewaard door de backend (conform FR17 — sessie-geheugen, geen opslag).
- **NFR6:** De app blijft bruikbaar bij korte netwerkonderbreking: reeds geladen dagdata en handmatig loggen werken offline; AI-foto vereist verbinding.
- **NFR7:** AI-kosten per fotoschatting blijven beheersbaar (richtwaarde onder enkele centen per foto) door een efficiënt visiemodel te kiezen.
- **NFR8:** Calorieschattingen worden gepresenteerd als *schatting met marge*, niet als exacte waarde, om verkeerde precisieverwachting te voorkomen. De app is geen medisch hulpmiddel.
- **NFR9:** De AI-coach loopt server-side via hetzelfde AI-proxy-patroon als de bestaande AI-functies (sleutel blijft server-side) en kent een dagelijkse limiet van maximaal 20 coach-vragen per gebruiker, naast een gelimiteerde contextlengte per gesprek — dit begrenst zowel kosten per gesprek als misbruik door volume, relevant omdat dit de eerste vrije-tekst AI-invoer van de app is op een onbeveiligd single-user endpoint. Zoals bij de overige AI-functies blijft de kernfunctionaliteit (budget zien, handmatig loggen) volledig bruikbaar als de AI-coach niet beschikbaar of aan de daglimiet is. *(Aanname: gecombineerde AI-kosten over foto/inzichten/coach samen worden in v1.1 niet apart gemonitord — buiten scope voor deze iteratie.)*

---

## 3. User Interface Design Goals

### Overall UX Vision

Een rustige, snelle en aanmoedigende app die één vraag centraal beantwoordt: *"Hoeveel mag ik vandaag nog?"* Alles draait om zo min mogelijk frictie tussen "ik heb iets gegeten" en "het staat gelogd". Geen overladen dashboards; de kern is één helder getal en een grote actieknop om te loggen.

### Key Interaction Paradigms

- **Eén-getal-hoofdscherm:** resterende calorieën groot in beeld, met een ring/balk die de dag visualiseert.
- **Prominente "+"-logknop** die drie routes aanbiedt: foto, gewicht/product, of recent item.
- **Foto-flow:** camera → AI-schatting → snelle correctie → opslaan.
- **Correctie via schuif/stepper** voor gram of porties, niet via typen waar mogelijk.
- **Streak/badges licht en terzijde:** gamification-elementen (streak-teller, badges) ondersteunen de kernvraag, ze overheersen het hoofdscherm niet — geen pop-ups die de logflow onderbreken.
- **AI-advies op uitnodiging + passief zichtbaar:** periodieke inzichten verschijnen op het voortgangsscherm (niet als interruptie); de AI-coach is een aparte, bewust opgezochte flow.

### Core Screens and Views

- Onboarding & profiel (gegevens + doel)
- Hoofd/dagscherm (resterend budget + gelogde items + streak-indicator)
- Log-flow foto
- Log-flow gewicht/product
- Voortgang & gewicht (grafiek + geschiedenis + periodieke AI-inzichten)
- Prestaties/badges-overzicht
- AI-coach (vraag/antwoord over voeding en voortgang)
- Instellingen (doel bijstellen, profiel, privacy)

### Accessibility

Streven naar WCAG AA: voldoende contrast, grote tikdoelen, leesbare tekst, ondersteuning voor dynamische lettergrootte. *(Aanname — te bevestigen.)*

### Branding

Wordt vastgesteld in een apart UX-designdocument (redesigntraject, v1.1 change-signaal) — zie de aanbevolen volgorde in §11. Tot dat document klaar is, geldt als werkaanname: schoon, licht, met één accentkleur voor voortgang (groen = onder budget, oranje/rood = eroverheen), aangevuld met een bescheiden "beloningskleur" voor badges/streak. *(Aanname, te vervangen door het UX-designdocument.)*

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
- **AI-fotoherkenning, -inzichten en -coach:** een Claude-model dat de foto (Epic 3) of de tekstcontext (Epic 6) omzet naar een gestructureerde schatting/antwoord via een prompt die JSON/tekst teruggeeft. **Default model: `claude-haiku-4-5`** (kostenefficiëntie, v1.1-beslissing — zie §9 beslissing 13, vervangt de eerdere `claude-opus-4-8`-default uit v1.0 §9 beslissing 5). *(Aanname — nauwkeurigheid van Haiku 4.5 op foto's en advies te valideren tijdens de bouw van Epic 3/6; opschalen naar `claude-sonnet-5` blijft de aanbevolen stap als nauwkeurigheid tegenvalt.)*
- **Voedingsdatabase:** voor handmatig loggen op gewicht een caloriereferentie per 100 g. Opties: publieke dataset (bijv. Open Food Facts) of AI-geschatte referentie. *(Aanname — bron te kiezen.)*
- **Authenticatie:** v1 is single-user; simpele lokale/gepersonaliseerde toegang volstaat. Multi-user/login is toekomstig. *(Aanname.)*

---

## 5. Epic List

- **Epic 1 — Fundament & Persoonlijk Caloriebudget:** projectopzet, profiel-onboarding en de berekening die toont hoeveel calorieën de gebruiker per dag mag.
- **Epic 2 — Eten Loggen & Dagoverzicht:** handmatig loggen (op gewicht/porties en via recente items), dagtotaal en resterend budget.
- **Epic 3 — AI-Fotoherkenning:** eten loggen door een foto te maken met AI-schatting en correctie.
- **Epic 4 — Voortgang & Bijsturen:** gewicht bijhouden, trends zien en budget automatisch mee laten bewegen.
- **Epic 5 — Motivatie & Gamification (licht):** streak van opeenvolgende log-dagen en badges/prestaties bij mijlpalen.
- **Epic 6 — AI-advies & Coach:** periodieke AI-inzichten op het voortgangsscherm en een interactieve AI-coach voor vragen over voeding/voortgang.

*Volgorde: elke epic levert een werkende, waardevolle stap op. Na Epic 1 weet de gebruiker zijn budget; na Epic 2 kan hij volledig (handmatig) tracken; Epic 3 voegt het AI-gemak toe; Epic 4 sluit de afval-feedbackloop; Epic 5 en 6 (v1.1) versterken motivatie en inzicht bovenop het werkende fundament.*

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

### Epic 5 — Motivatie & Gamification (licht)

**Doel:** De gebruiker blijft gemotiveerd om te blijven loggen door een lichte, niet-opdringerige beloning voor consistent gedrag — zonder de app druk, competitief of sociaal te maken (blijft binnen de out-of-scope-grens van §7).

#### Story 5.1 — Streak bijhouden en tonen
Als gebruiker wil ik zien hoeveel dagen op rij ik heb gelogd, zodat ik gemotiveerd blijf om de reeks vol te houden.
- **AC1:** Het systeem telt een streak van opeenvolgende dagen met minstens één gelogd item, ongeacht de bron van het item (handmatig, product, foto — Epic 3).
- **AC2:** De streak wordt getoond op het hoofdscherm, zonder de resterend-budgetweergave te verdringen.
- **AC3:** Bij een gemiste dag (geen enkel gelogd item die dag) wordt de streak informatief teruggezet — geen bestraffende of beschamende toon (aansluitend bij Story 2.2 AC3).
- **AC4:** De daggrens voor de streak wordt bepaald door een vaste tijdzone-instelling (default: apparaat-tijdzone bij eerste gebruik), niet door de ruwe apparaatklok op het moment van loggen.
- **AC5:** Wanneer een gelogd item achteraf wordt bewerkt of verwijderd (Story 2.3), herberekent het systeem de streak op basis van de resterende loggeschiedenis; bij introductie van deze story wordt de streak initieel berekend op basis van reeds bestaande loggeschiedenis (Epics 1/2/4), niet vanaf 0.

#### Story 5.2 — Badges/prestaties toekennen en tonen
Als gebruiker wil ik badges verdienen bij mijlpalen, zodat mijn voortgang op meer manieren zichtbaar en belonend wordt.
- **AC1:** Het systeem kent badges toe bij het bereiken van de volgende mijlpalen: 3 dagen streak, 7 dagen streak, 30 dagen streak, 30 dagen totaal gelogd (cumulatief), en de eerste keer dat de gewichtstrend (niet één losse meting) richting het streefgewicht beweegt.
- **AC2:** Er is een overzichtsscherm met behaalde (en nog te behalen) badges.
- **AC3:** Een nieuw behaalde badge wordt kort en subtiel gemeld, zonder de logflow te onderbreken; worden meerdere badges gelijktijdig behaald, dan worden deze na elkaar/gestapeld getoond (geen enkele meldingen gaan verloren).
- **AC4:** Een eenmaal behaalde badge blijft permanent behouden en wordt nooit ingetrokken, ook niet als de loggeschiedenis die de badge opleverde later wordt bewerkt of verwijderd.

---

### Epic 6 — AI-advies & Coach

**Doel:** De gebruiker krijgt begrip van en grip op zijn voortgang via AI-advies dat verder gaat dan calorieën schatten — zowel ongevraagd (periodieke inzichten) als op aanvraag (interactieve coach).

#### Story 6.1 — Periodieke AI-inzichten
Als gebruiker wil ik periodiek automatisch inzichten over mijn eetpatroon en voortgang krijgen, zodat ik begrijp *waarom* mijn resultaten gaan zoals ze gaan zonder er zelf naar te hoeven zoeken.
- **AC1:** Het systeem genereert wekelijks (rollend venster van 7 dagen, in de tijdzone van Story 5.1 AC4) een AI-samenvatting op basis van eetlog, budgetnaleving en gewichtstrend.
- **AC2:** De inzichten zijn zichtbaar op het voortgangsscherm, gepresenteerd als observatie/suggestie (niet als medisch advies, conform NFR8).
- **AC3:** Bij onvoldoende data voor een zinvolle samenvatting (bv. eerste week, of te weinig geloggde dagen binnen de periode) toont het systeem een nette uitleg in plaats van een lege, onzinnige of misleidende samenvatting.
- **AC4:** Bij een AI-fout of ontbrekende sleutel toont het systeem een nette melding in plaats van een lege of vastgelopen weergave (mirroring Story 6.2 AC3).
- **AC5:** Een reeds getoond inzicht is een momentopname en wordt niet met terugwerkende kracht herzien als latere bewerkingen of een budgetherberekening (FR11) de brondata veranderen.

#### Story 6.2 — Interactieve AI-coach
Als gebruiker wil ik een vraag kunnen stellen over mijn voeding of voortgang, zodat ik gericht advies krijg in plaats van zelf cijfers te moeten interpreteren.
- **AC1:** Er is een aparte AI-coach-flow waarin de gebruiker een vraag kan stellen; vervolgvragen binnen dezelfde sessie houden rekening met eerdere vragen/antwoorden in dat gesprek (sessie-geheugen, geen opslag na afsluiten — conform FR17/NFR5).
- **AC2:** Het antwoord is gebaseerd op de eigen gelogde data van de gebruiker (eetlog, budget, gewichtstrend) en gepresenteerd als suggestie (conform NFR8).
- **AC3:** Zonder AI-sleutel of bij een API-fout toont het systeem een nette melding; de kernfunctionaliteit (budget zien, loggen) blijft onaangetast (conform NFR9).
- **AC4:** Bij een vraag buiten de eigen data of buiten voeding/voortgang (bv. algemene medische vragen) geeft de coach aan dit niet te kunnen beantwoorden in plaats van te fantaseren of medisch advies te geven (conform FR18).
- **AC5:** Bij onvoldoende gelogde data om de vraag zinvol te beantwoorden toont de coach een nette uitleg in plaats van een verzonnen antwoord (mirroring Story 6.1 AC3).
- **AC6:** Het systeem hanteert een dagelijkse limiet van maximaal 20 coach-vragen per gebruiker (conform NFR9); bij het bereiken hiervan toont het systeem een nette melding.

---

## 7. Out of Scope (v1)

- Meerdere gebruikers, accounts en login/synchronisatie tussen apparaten.
- Barcodescanner voor verpakte producten.
- Koppeling met wearables/health-apps (Apple Health, Google Fit).
- Water-, beweging- of macro-doelen als aparte tracking-modules.
- Sociale functies of meal-planning. *(Herzien in v1.1: de opdrachtgever heeft Epic 6 (AI-coach) expliciet gewenst, wat een scope-uitbreiding is t.o.v. de v1.0-uitsluiting van "coaching." Deze uitsluiting wordt vanaf v1.1 gelezen als beperkt tot menselijke/sociale coaching; automatische AI-gebaseerde coaching is vanaf nu expliciet in scope.)*
- Native app-store distributie (iOS/Android native builds).
- **Gamification (v1.1-grens):** punten/levels, sociale competitie/leaderboards en wisselende wekelijkse uitdagingen zijn bewust buiten scope — v1.1 beperkt gamification expliciet tot streak + badges (Epic 5).

---

## 8. Success Metrics (voorstel)

- **Trackgemak:** mediane tijd om een maaltijd te loggen < 20 seconden.
- **Volhouden:** gebruiker logt op ≥ 5 van de 7 dagen in een week.
- **AI-nut:** ≥ 60% van de fotoschattingen wordt zonder grote correctie geaccepteerd.
- **Uitkomst:** gewichtstrend beweegt richting het streefgewicht over 4+ weken.
- **Gamification (v1.1):** langste streak groeit over tijd (bv. hogere piekstreak in week 4 dan in week 1); ten minste één badge behaald binnen de eerste 2 weken.
- **AI-advies (v1.1):** de AI-coach wordt ten minste 1× per week geraadpleegd; periodieke inzichten worden gelezen (geopend), niet genegeerd; **daarnaast** past de gebruiker minstens 1× per 4 weken een AI-suggestie daadwerkelijk toe (bv. doel/tempo bijstellen naar aanleiding van een inzicht) — dit valideert of het advies begrip/gedrag beïnvloedt, niet alleen of het geraadpleegd wordt. *(Aanname: er is geen telemetrie-infrastructuur in scope om "geopend"/"geraadpleegd" automatisch te meten — v1.1 leunt op zelf-observatie door de gebruiker, niet op instrumentatie.)*
- **Tegenmetriek (v1.1):** gamification-elementen mogen de trackgemak-metriek niet verslechteren — als de mediane logtijd stijgt door badges/streak-UI, is de gamification te opdringerig geworden en moet ze worden versoberd. *(Aanname: er is geen gemeten baseline-logtijd vastgelegd vóór v1.1; de vergelijking is voor nu subjectief/ervaringsgericht, niet gemeten.)*

---

## 9. Bevestigde beslissingen

Deze punten zijn bevestigd tijdens de bouw (waren eerder open aannames):

1. **Platform:** PWA (web, mobile-first, installeerbaar). ✅ bevestigd.
2. **Scope v1:** single-user, geen login/accounts. ✅ bevestigd.
3. **Tech stack:** React + TypeScript + Vite (PWA) + Tailwind; Fastify + TypeScript; Postgres via Prisma (Neon in productie, zie hieronder). ✅ bevestigd. *Productie-hostingdoel: GitHub Pages (frontend) + Render (backend) + Neon (database) — zie [architecture.md](architecture.md) §12 en [deployment.md](deployment.md).*
4. **Voedingsbronnen:** combinatie van **Open Food Facts** (zoeken), **handmatig** (altijd terugval, offline), **AI-tekstschatting** (Claude) en later **AI-fotoschatting**. ✅ bevestigd. Handmatig is altijd de fallback.
5. **AI-model:** Claude, server-side via proxy; instelbaar via env (`CALCOUNT_AI_MODEL`). ~~Default `claude-opus-4-8`~~ — **vervangen door beslissing 13 (v1.1): default is nu `claude-haiku-4-5`.** Nauwkeurigheid/kosten nog te valideren bij Epic 3.
6. **Meeteenheden:** metriek (gram, kg, cm). ✅ bevestigd.
7. **Gewicht → budget:** een nieuwe gewichtsmeting werkt het profielgewicht bij, dus TDEE/budget bewegen automatisch mee (FR11). ✅ bevestigd.
8. **Streefgewicht:** optioneel in te stellen; grafiek toont voortgang naar doel. ✅ bevestigd.
9. **Afvaltempo-standaard:** ~0,5 kg/week met veilige ondergrens (♀ 1200 / ♂ 1500 kcal). ✅ bevestigd.
10. **Gamification-scope (v1.1):** licht — alleen streak + badges (Epic 5); geen punten/levels, sociale competitie of wisselende uitdagingen. ✅ bevestigd door opdrachtgever.
11. **AI-advies-scope (v1.1):** beide vormen — periodieke passieve inzichten én een interactieve AI-coach (Epic 6). ✅ bevestigd door opdrachtgever.
12. **Redesign-artefact (v1.1):** een geschreven UX-designdocument (geen los HTML/CSS-prototype in deze iteratie). ✅ bevestigd door opdrachtgever.

**Beslissingen n.a.v. de PRD-validatie (v1.1, zelfde datum — zie het validatierapport in `_bmad-output/planning-artifacts/prds/prd-CalCount-2026-07-23/`):**

13. **AI-modeldefault gereconcilieerd:** `claude-haiku-4-5` wordt de default voor alle AI-functies (foto, inzichten, coach) — **vervangt** de v1.0-default `claude-opus-4-8` uit beslissing 5, die niet meer strookte met §4's eigen kostenoverweging. ✅ bevestigd door opdrachtgever. Opschalen naar `claude-sonnet-5` blijft de aanbevolen route als nauwkeurigheid tegenvalt.
14. **Badge-mijlpalen concreet vastgelegd:** vaste set (3/7/30 dagen streak, 30 dagen totaal gelogd, eerste trendmatige voortgang richting streefgewicht) i.p.v. open te laten tot de architectuurfase — zie FR15. ✅ bevestigd door opdrachtgever.
15. **AI-coach-geheugen:** gesprekscontext binnen één sessie (vervolgvragen mogelijk zolang het scherm open is), niet persistent opgeslagen tussen sessies — zie FR17/NFR5. ✅ bevestigd door opdrachtgever.
16. **AI-veiligheidsvangrail bewust niet uitgebreid:** de AI (inzichten/coach) wordt niet actief gestuurd op de veilige ondergrens van beslissing 9; "suggestie, geen medisch advies" (FR18/NFR8) blijft de enige vangrail. **Expliciet overwogen en bewust zo gehouden** tijdens PRD-validatie, niet over het hoofd gezien. ✅ bevestigd door opdrachtgever.
17. **Streak/badges bij retroactieve wijziging:** de streak herberekent altijd op basis van de actuele loggeschiedenis (incl. bestaande historie uit Epics 1/2/4 bij launch); eenmaal behaalde badges worden nooit met terugwerkende kracht ingetrokken — zie FR14/FR15. ✅ bevestigd door opdrachtgever.
18. **Daggrens voor de streak:** bepaald door een vaste tijdzone-instelling van de gebruiker (default: apparaat-tijdzone bij eerste gebruik), niet door de ruwe apparaatklok op het moment van loggen — zie FR14. ✅ bevestigd door opdrachtgever.

---

## 10. Herzien: Epic 3 (AI-fotoherkenning) heractiveerd (v1.1)

Epic 3 (foto maken → AI schat calorieën) was **uitgesteld** sinds v1.0 en wordt met v1.1 **heractiveerd** op verzoek van de opdrachtgever. De onderliggende infrastructuur was al voorbereid: de `photo`-bron bestaat in het datamodel, het API-contract staat in [architecture.md §5](architecture.md), en de log-flow heeft al een AI-tekstschatting die dezelfde correctie-UX gebruikt. Epic 3 vereist een `ANTHROPIC_API_KEY` om echt te testen/bouwen. De epic zelf (Stories 3.1–3.4, §6) is ongewijzigd — alleen de status verandert van uitgesteld naar gepland.

De rest van de v1.0-PRD (Goals, Requirements, UI, Epics 1/2/4) blijft ongewijzigd geldig; v1.1 voegt Epic 5 en Epic 6 toe (§6) zonder bestaande scope te wijzigen.

---

## 11. Implementatiestatus

| Epic | Status | Toelichting |
|---|---|---|
| 1 — Fundament & Persoonlijk Caloriebudget | ✅ Gebouwd & geverifieerd | Profiel, TDEE/budget, één-getal-hoofdscherm |
| 2 — Eten loggen & dagoverzicht | ✅ Gebouwd & geverifieerd | Zoeken (OFF), handmatig, AI-tekst, recent; dagtotaal; bewerken/verwijderen; dagnavigatie |
| 3 — AI-fotoherkenning | 🔵 Heractiveerd, nog te bouwen | Zie §10 — vereist `ANTHROPIC_API_KEY` |
| 4 — Voortgang & Bijsturen | ✅ Gebouwd & geverifieerd | Gewicht bijhouden, trendgrafiek + streefgewicht, auto-herberekening budget, doel bijstellen |
| 5 — Motivatie & Gamification (licht) | 📝 Gepland (v1.1) | Streak + badges — zie §6 |
| 6 — AI-advies & Coach | 📝 Gepland (v1.1) | Periodieke inzichten + interactieve coach — zie §6 |

**Nog niet gedaan:** productie-deployment (repo-kant klaar voor GitHub Pages + Render + Neon — zie [deployment.md](deployment.md); Render-service zelf nog aan te maken); Epics 3, 5 en 6.

Voor de volledige overdracht — hoe lokaal te draaien, repo-structuur, keuzes, openstaande punten — zie **[handoff.md](handoff.md)**.

### Aanbevolen volgorde (v1.1)
1. ~~Open beslissingen §9 bevestigen.~~ ✅ (inclusief v1.1-beslissingen 10–12)
2. ~~Architectuurdocument opstellen.~~ ✅ — nu bijwerken voor Epic 3/5/6 (nieuwe datamodel-velden voor streak/badges, AI-coach-endpoint, foto-upload-contract activeren).
3. UX-designdocument opstellen voor de redesign (branding, schermen incl. streak/badges/AI-coach — zie §3).
4. Epics/stories 3, 5, 6 verfijnen tot uitvoerbare taken (`bmad-create-epics-and-stories`) en implementatiegereedheid checken (`bmad-check-implementation-readiness`).
5. Sprint-planning en bouwen, epic voor epic.
