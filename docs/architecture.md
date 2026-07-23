# CalCount Fullstack Architecture Document

| | |
|---|---|
| **Project** | CalCount — AI-ondersteunde calorietracker |
| **Auteur** | Architect (BMAD-methode) |
| **Datum** | 2026-07-22 |
| **Versie** | v0.1 (concept ter review) |
| **Input** | [prd.md](prd.md) v0.1 |

---

## 1. Introduction

Dit document beschrijft de complete fullstack-architectuur voor CalCount: frontend (mobile-first PWA), backend (API + AI-proxy), datamodel en het contract voor de AI-fotoherkenning. Het dient als leidraad voor de implementatie van de epics uit de PRD.

**Uitgangspunten (bevestigd als aanname in PRD §9):**
- Platform: PWA (web, installeerbaar op telefoon), geen native app in v1.
- Single-user v1: alleen de aanvrager, geen login/accounts.
- AI-fotoherkenning via een Claude-visiemodel, aangeroepen door de backend (nooit vanuit de client).
- Metriek (gram, kg, cm).

### Change Log

| Datum | Versie | Beschrijving | Auteur |
|---|---|---|---|
| 2026-07-22 | v0.1 | Eerste architectuur volgens BMAD | Architect |

---

## 2. High Level Architecture

### Technical Summary

CalCount is een **mobile-first Progressive Web App** met een lichtgewicht **monolithische backend** die als beveiligde proxy naar de Claude-visie-API fungeert. De frontend (React + TypeScript) draait volledig op de telefoon en communiceert via een REST/JSON-API met de backend (Node + TypeScript). De backend bevat de kern-rekenlogica (TDEE/budget), beheert de opslag (SQLite) en verbergt de AI-API-sleutel. De fotoherkenning stuurt een foto naar de backend, die deze naar het visiemodel doorzet en een gestructureerd JSON-resultaat teruggeeft.

### High Level Diagram

```
┌─────────────────────────────┐
│  Telefoon (browser / PWA)   │
│  React + TS, installeerbaar  │
│  - hoofd/dagscherm           │
│  - foto-log-flow (camera)    │
│  - gewicht/product-log-flow  │
│  - voortgang & grafiek       │
└──────────────┬──────────────┘
               │ HTTPS (REST/JSON)
               ▼
┌─────────────────────────────┐
│  Backend (Node + TS)        │
│  - REST API                  │
│  - rekenlogica TDEE/budget   │
│  - AI-proxy (sleutel hier)   │
│  - voedingsreferentie-lookup │
└───────┬───────────────┬──────┘
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────────────┐
│  Database    │  │  Claude Vision API   │
│  (SQLite)    │  │  foto → JSON-schatting│
│  profiel     │  └──────────────────────┘
│  eetlog      │
│  gewicht     │  ┌──────────────────────┐
│  referentie  │◀─│  Open Food Facts     │
└──────────────┘  │  (product-lookup)    │
                  └──────────────────────┘
```

### Architectural Patterns

- **Backend-for-Frontend (BFF):** de backend is toegesneden op precies wat deze ene frontend nodig heeft. *Rationale:* eenvoud voor één ontwikkelaar/één client.
- **AI-proxy-pattern:** de client praat nooit rechtstreeks met de AI-provider. *Rationale:* de API-sleutel blijft server-side (NFR5) en kosten/gebruik zijn centraal te beheersen (NFR7).
- **Geïsoleerde domeinlogica:** TDEE/budget-berekeningen in pure, testbare functies zonder I/O. *Rationale:* dit is de kern die correct moet zijn (PRD testing-eis).
- **Repository-pattern voor data-toegang:** *Rationale:* eenvoudig van SQLite naar Postgres te migreren als multi-user later nodig is.

---

## 3. Tech Stack (definitief voorstel)

| Categorie | Technologie | Versie/keuze | Rationale |
|---|---|---|---|
| Frontend-taal | TypeScript | 5.x | Typeveiligheid, deelt types met backend |
| Frontend-framework | React | 18.x | Volwassen, groot ecosysteem, PWA-vriendelijk |
| Build/PWA | Vite + vite-plugin-pwa | laatste | Snelle build, service-worker/manifest out-of-the-box |
| UI-styling | Tailwind CSS | 3.x | Snel, mobile-first utilities, grote tikdoelen eenvoudig |
| Grafiek | Recharts | 2.x | Gewichtstrend-grafiek (Epic 4) |
| State | React Query (TanStack) | 5.x | Server-state caching, offline-vriendelijk (NFR6) |
| Backend-taal | TypeScript (Node) | Node 20 LTS | Eén taal full-stack, gedeelde types |
| Backend-framework | Fastify | 4.x | Licht, snel, goede TS-support |
| ORM/DB-access | Prisma | 5.x | Typeveilige queries, migraties, SQLite→Postgres |
| Database | SQLite | (Postgres later) | Single-user v1, nul-config; migratiepad open |
| AI-provider | Claude Vision API | zie §5 | Fotoherkenning → gestructureerde JSON |
| Voedingsdata | Open Food Facts API | v2 | Publieke bron voor kcal-per-100g |
| Testing | Vitest | laatste | Unit/integratie voor rekenlogica |
| Hosting | Eén kleine VPS of lokaal | n.t.b. | Backend serveert ook de PWA-assets |

---

## 4. Data Models

Gedeelde TypeScript-interfaces (frontend + backend). Alle tijden ISO-8601, gewichten in gram, lengte in cm.

### UserProfile (single-user v1: één rij)

```typescript
interface UserProfile {
  id: string;
  heightCm: number;
  weightKg: number;          // meest recente gewicht (spiegelt WeightEntry)
  birthDate: string;         // voor leeftijdsberekening
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goalRateKgPerWeek: number; // bv. -0.5 (afvallen); negatief = tekort
  targetWeightKg?: number;
  updatedAt: string;
}
```

### FoodEntry (een gelogd item op een dag)

```typescript
interface FoodEntry {
  id: string;
  loggedAt: string;          // bepaalt de dag
  name: string;
  source: 'photo' | 'weight' | 'recent';
  grams?: number;            // bij weight-based
  calories: number;          // altijd aanwezig (berekend of geschat)
  protein?: number;
  carbs?: number;
  fat?: number;
  isEstimate: boolean;       // true voor AI-schattingen (toon marge)
  photoRef?: string;         // optionele referentie, niet lang bewaard
}
```

### WeightEntry (gewichtsmeting)

```typescript
interface WeightEntry {
  id: string;
  measuredAt: string;
  weightKg: number;
}
```

### FoodReference (kcal-per-100g cache/lookup)

```typescript
interface FoodReference {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  externalId?: string;       // Open Food Facts barcode/id
}
```

### DailyBudget (afgeleid, niet opgeslagen)

```typescript
interface DailyBudget {
  date: string;
  tdee: number;              // onderhoudsniveau
  budget: number;            // tdee + dagelijks tekort (met veilige ondergrens)
  consumed: number;          // som van FoodEntry.calories die dag
  remaining: number;         // budget - consumed
  status: 'under' | 'near' | 'over';
}
```

---

## 5. AI Fotoherkenning — Contract

Dit is het hart van de "AI-ondersteunde" belofte. De backend roept de Claude-visie-API aan met de foto en een schema dat een gestructureerde JSON-schatting afdwingt.

### Modelkeuze

| Optie | Model-ID | Afweging |
|---|---|---|
| Aanbevolen (balans) | `claude-sonnet-5` | Sterke visie/redenering, lagere kosten dan Opus |
| Kostenoptie | `claude-haiku-4-5` | Goedkoopst; nauwkeurigheid valideren op eten |
| Hoogste kwaliteit | `claude-opus-4-8` | Beste redenering; duurder per foto |

**Aanbeveling:** start met `claude-sonnet-5` en voer een korte proef uit (10–20 echte maaltijdfoto's) om nauwkeurigheid vs. kosten (NFR7) te valideren; val terug op `claude-haiku-4-5` als de nauwkeurigheid voldoende blijkt. Dit is een expliciete open beslissing (PRD §9.2).

### Request (backend → Claude)

- **Endpoint:** Messages API (`client.messages.create`), server-side met de Anthropic SDK.
- **Input:** de foto als image-content-block (base64) + een tekstinstructie.
- **Gestructureerde output:** `output_config.format` met een `json_schema` dwingt geldige JSON af (ondersteund op Sonnet 5, Haiku 4.5, Opus 4.8).

Voorbeeld van het afgedwongen outputschema (conceptueel):

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "estimatedGrams": { "type": "number" },
          "calories": { "type": "number" },
          "protein": { "type": "number" },
          "carbs": { "type": "number" },
          "fat": { "type": "number" },
          "confidence": { "type": "string", "enum": ["low", "medium", "high"] }
        },
        "required": ["name", "estimatedGrams", "calories", "confidence"],
        "additionalProperties": false
      }
    }
  },
  "required": ["items"],
  "additionalProperties": false
}
```

### Response-verwerking

- De backend valideert de JSON, markeert alle items als `isEstimate: true` en geeft ze terug aan de client als **voorlopige** schatting (met marge).
- De gebruiker corrigeert hoeveelheid/calorieën vóór opslaan (Story 3.3).
- **Foutafhandeling:** geen verbinding of API-fout → nette melding + terugval naar handmatig loggen (Story 3.1 AC3). Time-out richtwaarde ~10s (NFR3).
- **Privacy:** de foto wordt alleen voor herkenning gebruikt en niet langer bewaard dan nodig (NFR4); de API-sleutel staat uitsluitend server-side.
- **Kosten:** één efficiënt visiemodel; overweeg de fotoresolutie client-side te beperken vóór upload om beeld-tokens te sparen.

---

## 6. REST API (kerncontract)

Alle endpoints onder `/api`. JSON in/uit. Single-user, dus geen auth-token in v1 (wel over HTTPS).

| Methode | Pad | Doel | Epic |
|---|---|---|---|
| `GET` | `/api/profile` | Profiel ophalen | 1 |
| `PUT` | `/api/profile` | Profiel + doel opslaan/wijzigen | 1 |
| `GET` | `/api/budget?date=YYYY-MM-DD` | Dagbudget (TDEE, budget, consumed, remaining) | 1,2 |
| `GET` | `/api/entries?date=YYYY-MM-DD` | Gelogde items van een dag | 2 |
| `POST` | `/api/entries` | Item loggen (weight/recent/photo-bevestigd) | 2,3 |
| `PATCH` | `/api/entries/:id` | Item bewerken | 2 |
| `DELETE` | `/api/entries/:id` | Item verwijderen | 2 |
| `GET` | `/api/entries/recent` | Recent/vaak gelogde items | 2 |
| `POST` | `/api/foods/search` | Product zoeken (Open Food Facts + cache) | 2 |
| `POST` | `/api/photo/analyze` | Foto → AI-schatting (nog niet opgeslagen) | 3 |
| `GET` | `/api/weights` | Gewichtsgeschiedenis | 4 |
| `POST` | `/api/weights` | Gewichtsmeting toevoegen | 4 |
| `PATCH` | `/api/weights/:id` | Meting bewerken | 4 |
| `DELETE` | `/api/weights/:id` | Meting verwijderen | 4 |

*Belangrijk:* `POST /api/photo/analyze` slaat niets op — het retourneert alleen de schatting. Opslaan gebeurt daarna via `POST /api/entries` ná correctie door de gebruiker.

---

## 7. Rekenlogica (geïsoleerd & testbaar)

Pure functies in `packages/core` (of `backend/src/domain`), zonder I/O — dit is de kern die de PRD als testverplichting markeert.

- **TDEE (Mifflin-St Jeor):**
  - Man: `BMR = 10*kg + 6.25*cm − 5*leeftijd + 5`
  - Vrouw: `BMR = 10*kg + 6.25*cm − 5*leeftijd − 161`
  - `TDEE = BMR × activiteitsfactor` (sedentary 1.2 … very_active 1.9)
- **Dagbudget:** `budget = TDEE + (goalRateKgPerWeek × 7700 / 7)` (≈7700 kcal per kg), met een **veilige ondergrens** (bijv. niet onder ~1200 kcal ♀ / ~1500 kcal ♂) en een waarschuwing bij overschrijding van die grens (Story 1.3 AC3).
- **Dagtotaal/resterend:** `remaining = budget − Σ entry.calories`; status-drempels bepalen `under/near/over` voor de visuele indicator (Story 2.2).

Unit tests dekken grenswaarden, geslacht, activiteitsniveaus en de ondergrens-clamping.

---

## 8. Projectstructuur (monorepo)

```
CalCount/
├─ docs/
│  ├─ prd.md
│  └─ architecture.md
├─ packages/
│  └─ core/                 # gedeelde types + rekenlogica (pure functies)
├─ web/                     # React PWA
│  ├─ src/
│  │  ├─ screens/           # hoofd/dag, foto-log, gewicht/product-log, voortgang
│  │  ├─ components/
│  │  ├─ api/               # client-calls naar backend
│  │  └─ pwa/               # manifest, service worker
├─ api/                     # Fastify backend
│  ├─ src/
│  │  ├─ routes/
│  │  ├─ domain/            # (of via packages/core)
│  │  ├─ services/          # ai-proxy, foodref-lookup
│  │  ├─ repositories/      # Prisma data-access
│  │  └─ prisma/            # schema + migraties
└─ package.json             # workspaces
```

---

## 9. Non-Functional Realisatie (koppeling met NFR's)

| NFR | Realisatie |
|---|---|
| NFR1 (PWA iOS/Android) | Vite PWA-plugin: manifest + service worker; installeerbaar |
| NFR2 (één hand) | Tailwind mobile-first, grote tikdoelen, onderin-navigatie |
| NFR3 (~10s AI) | Backend-time-out + laadindicator; resolutie beperken |
| NFR4 (foto-privacy) | Cameratoestemming; foto niet persistent bewaren |
| NFR5 (veilige data) | Server-side sleutel; HTTPS; data niet naar derden buiten AI-provider |
| NFR6 (offline) | React Query cache + service worker; handmatig loggen offline; foto vereist net |
| NFR7 (AI-kosten) | Efficiënt model, resolutie-limiet, één call per foto |
| NFR8 (schatting, geen medisch) | UI toont "schatting met marge"; disclaimer |

---

## 10. Bouwvolgorde & Verificatie

Volg de PRD-epics 1→4. Per epic:
1. Datamodel + migratie.
2. Backend-endpoints + domeinlogica-tests.
3. Frontend-scherm(en) tegen de endpoints.
4. Handmatige end-to-end verificatie (voor Epic 3: de foto-flow met echte foto's).

**Aanbevolen eerste stap:** Story 1.1 (app-shell frontend+backend) + `packages/core` met de TDEE/budget-functies en hun tests — dan staat het testbare fundament en kan Epic 1 verder.

---

## 11. Beslissingen (bevestigd)

De open punten uit PRD §9 zijn bevestigd tijdens de bouw — zie [prd.md](prd.md) §9 voor de
volledige lijst. Kort: PWA + single-user; stack React/Vite + Fastify/Prisma/SQLite (lokaal);
voedingsbronnen Open Food Facts + handmatig + AI-tekst (+ AI-foto later), met handmatig als
altijd-beschikbare terugval; AI-model instelbaar via env (default `claude-opus-4-8`); gewicht
werkt profielgewicht bij zodat budget meebeweegt; streefgewicht optioneel.

---

## 12. Deployment-doel (Netlify + Supabase)

De architectuur hierboven beschrijft de **lokale/dev-opzet** (Fastify + SQLite). Voor productie
is het voorstel om serverless te gaan: **Netlify** (frontend + Functions) + **Supabase**
(Postgres). Reden: statische hosts kunnen de Node-backend niet draaien, en serverless vermijdt
serverbeheer.

Mapping:

| Lokaal/dev | Productie |
|---|---|
| Fastify-server | Netlify Functions (routes → functies), `netlify.toml` redirect `/api/*` |
| SQLite + Prisma | Supabase Postgres (via `@supabase/supabase-js` of Prisma met Postgres-provider) |
| `packages/core` | Ongewijzigd hergebruikt |
| Frontend | Ongewijzigd; roept nog steeds `/api/*` aan |

Secrets (`ANTHROPIC_API_KEY`, Supabase service-role-key) blijven server-side als env-variabelen;
de frontend bevat geen sleutels. Dit is **nog niet geïmplementeerd** — het volledige plan met
schema-SQL, `netlify.toml` en stappen staat in **[deployment.md](deployment.md)**.
