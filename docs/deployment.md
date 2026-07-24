# CalCount — Deployment (GitHub Pages + Render + Neon)

> **Status: live en geverifieerd op 2026-07-24.** GitHub Pages antwoordt met HTTP 200 en
> `https://calcount-api.onrender.com/health` met `{"status":"ok"}`. De Epic 5-migraties
> voor `Profile.timeZone` en `BadgeAward` zijn op 2026-07-24 handmatig en succesvol op
> Neon toegepast. Migratie `20260724150000_add_theme_and_epic6` voor profielthema,
> inzichtsnapshots en coachgebruik is eveneens toegepast. De code wacht op de
> eerstvolgende normale deploy.

## Voorgeschiedenis

Dit is de derde hosting-iteratie van dit project:

1. **Netlify + Supabase** (voorstel, nooit uitgevoerd) — losse Netlify Functions per
   route + Prisma vervangen door `@supabase/supabase-js`. Losgelaten: te veel herschrijf-
   werk voor een single-user hobby-app.
2. **Netlify Functions + Neon** (uitgevoerd, werkte) — één Netlify Function
   (`aws-lambda-fastify` wrapt de bestaande Fastify-app) + Neon Postgres via Prisma,
   ongewijzigd. Werkte, maar liep na een tijdje tegen Netlify's gratis-credit-limiet aan.
3. **GitHub Pages + Render + Neon** (huidig) — frontend naar GitHub Pages (vereist een
   publieke repo, wat deze inmiddels is), backend **ongewijzigd** naar Render (een
   gewone Node-host, geen serverless-wrapper nodig), Neon blijft de database.

**Overwogen alternatief (bewust niet gekozen):** de backend helemaal weglaten en de
frontend rechtstreeks laten praten met Neon's ingebouwde Data API (PostgREST-achtige
REST-laag op je tabellen). Dat vereist Row-Level Security-policies op elke tabel en een
losse serverless functie alleen voor de Claude-aanroep (de AI-sleutel mag nooit in de
browser staan — zie hieronder). Voor v1 is dat meer herbouwwerk dan de huidige Fastify-
backend gewoon verhuizen; bewaard als optie voor als er ooit echte multi-user/login bij
komt.

## Waarom de AI-sleutel altijd server-side moet blijven

Een API-sleutel in frontend-JavaScript wordt met elke paginalading naar de browser van de
bezoeker gestuurd — die is dus voor iedereen die de bundel opent te vinden en te
misbruiken (op jouw rekening). Claude's API zelf kan niet zien of een verzoek van je
eigen app komt of van iemand die de sleutel heeft gejat; hij ziet alleen "geldige sleutel,
verzoek uitvoeren". Daarom blijft de backend een **AI-proxy**: de frontend praat met
`/api/foods/estimate` (eigen server), en alléén die server — met de sleutel als
env-variabele, nooit in client-code — praat met Claude.

## Doelarchitectuur

```
Browser (PWA, GitHub Pages)
   │  https://fenderberg.github.io/CalCount/
   │
   │  VITE_API_URL (absolute URL, want andere origin dan de frontend)
   ▼
Render (Node-host: Fastify-server, ongewijzigd t.o.v. lokale dev)
   │            │  ANTHROPIC_API_KEY (env)
   │            ▼
   │        Claude API (AI-tekst/foto-schatting)
   ▼
Neon Postgres  ◀── DATABASE_URL (pooled, runtime) / DIRECT_URL (direct, migraties)
```

## Component-mapping

| Lokaal | Productie |
|---|---|
| `tsx src/server.ts` (luistert op :3001) | Zelfde commando, draait als Render Web Service (Render zet zelf `PORT`) |
| Prisma + Neon Postgres | Ongewijzigd — zelfde `DATABASE_URL`/`DIRECT_URL` |
| `api/src/routes/*.ts`, `api/src/services/*.ts` | **Ongewijzigd hergebruikt** — geen serverless-wrapper nodig, Render draait een gewoon Node-proces |
| `packages/core` (rekenlogica) | **Ongewijzigd hergebruikt** |
| Frontend `web/` | Bouwt naar `web/dist`, gepubliceerd op GitHub Pages; roept de backend nu via een **absolute** URL aan (zie `VITE_API_URL`) i.p.v. relatieve `/api/*`-paden, omdat frontend en backend nu op verschillende domeinen draaien |

## Wat al in de repo staat

- `web/src/api.ts` — alle fetch-calls gebruiken nu `${API_BASE}${path}`, met
  `API_BASE = import.meta.env.VITE_API_URL ?? ''`. Lokaal (`npm run dev:web`) blijft dit
  leeg, dus de bestaande Vite dev-proxy naar `localhost:3001` werkt ongewijzigd.
- `web/vite.config.ts` — `base: '/CalCount/'` bij een build (GitHub Pages serveert een
  project-repo vanaf `/<repo-naam>/`, niet vanaf de domeinroot); PWA-manifest
  `start_url`/`scope` volgen dezelfde base. Dev-server blijft op `/`.
- `.github/workflows/pages.yml` — bouwt bij elke push naar `main` (`npm run build:web`
  met `VITE_API_URL` uit de repo-variabele van dezelfde naam) en publiceert `web/dist`
  naar GitHub Pages via de officiële `actions/deploy-pages`-actie.
- GitHub Pages staat al aan (`build_type: workflow`, publieke URL
  `https://fenderberg.github.io/CalCount/`) en de repo-variabele `VITE_API_URL` staat al
  op `https://calcount-api.onrender.com` (pas aan als je service-naam op Render anders
  uitpakt — zie Stap 2).
- `render.yaml` — Blueprint voor de backend: `buildCommand: npm install && npm run
  db:deploy -w api` (past migraties toe bij elke deploy, net als voorheen bij Netlify),
  `startCommand: npm run start -w api` (draait `api/src/server.ts` gewoon met
  `.listen()` — geen serverless-aanpassing nodig omdat Render, in tegenstelling tot
  Netlify Functions, een persistent Node-proces draait).
- `api/prisma/schema.prisma` — `binaryTargets` (die specifiek voor de Lambda-runtime van
  Netlify Functions nodig was) verwijderd; Render bouwt en draait in dezelfde omgeving,
  dus het default `native`-target volstaat.
- Repo is **publiek** gezet (vereiste voor gratis GitHub Pages). Gecontroleerd: er heeft
  nooit een echte `.env`/sleutel in de geschiedenis gestaan, alleen `api/.env.example`.
- Netlify-specifieke bestanden verwijderd (`netlify.toml`, `netlify/`,
  `aws-lambda-fastify`/`@netlify/functions`-dependencies, het root-`tsconfig.json` dat
  alleen voor de Netlify Function was).

## Herstelprocedure: Render-service opnieuw aanmaken

De onderstaande stappen zijn bewaard als herstel-/herinstallatieprocedure. Voor de
huidige live service zijn ze al uitgevoerd.

### Stap 1 — Render-account + Blueprint

1. Ga naar [render.com](https://render.com) en log in (GitHub-login kan direct).
2. **New → Blueprint** → kies de `fenderberg/CalCount`-repo. Render leest `render.yaml`
   en stelt de `calcount-api`-service voor.
3. Vul de secrets in wanneer gevraagd (of erna via Environment):

   | Variabele | Waarde |
   |---|---|
   | `DATABASE_URL` | pooled Neon-connection string |
   | `DIRECT_URL` | directe Neon-connection string |
   | `ANTHROPIC_API_KEY` | je Claude-sleutel |
   | `CALCOUNT_AI_MODEL` | optioneel, bv. `claude-haiku-4-5` |
   | `CALCOUNT_AI_PHOTO_MODEL` | optioneel, valt terug op `CALCOUNT_AI_MODEL` |
   | `AUTH_USERNAME` | login-gebruikersnaam (simpele single-user toegangscontrole) |
   | `AUTH_PASSWORD` | login-wachtwoord |
   | `AUTH_SECRET` | willekeurige lange string die de sessie-cookie ondertekent — genereer met `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

   `COOKIE_SECURE=true` staat al vast in `render.yaml` (nodig omdat frontend en
   backend verschillende origins zijn — zie architecture.md).

4. Deploy. Render geeft de service-URL (verwacht: `https://calcount-api.onrender.com`,
   tenzij die naam al bezet is — dan krijg je een variant met een suffix).

### Stap 2 — URL kloppend maken (alleen als de Render-URL afwijkt)

Als de werkelijke Render-URL afwijkt van `https://calcount-api.onrender.com`:

```bash
gh variable set VITE_API_URL --body "https://<jouw-service>.onrender.com" --repo fenderberg/CalCount
```

Dan een nieuwe Pages-build triggeren (nieuwe push, of handmatig via Actions-tab →
"Deploy frontend to GitHub Pages" → Run workflow).

### Kanttekening: koude start

Render's gratis tier zet de service in slaap na inactiviteit; het eerste verzoek daarna
duurt een paar seconden extra terwijl 'm wakker wordt. Voor een single-user hobby-app is
dat een acceptabele afweging tegen de gratis prijs.

## Verificatie na deploy

1. `curl https://calcount-api.onrender.com/health` → `{"status":"ok"}` (blijft open, geen login nodig).
2. `curl https://calcount-api.onrender.com/api/profile` → `401 {"error":"Niet ingelogd"}`
   (bevestigt dat de login-guard actief is — alles behalve `/health` en `/api/login`
   vereist nu een sessie).
3. Open `https://fenderberg.github.io/CalCount/` in de browser → moet het inlogscherm
   tonen; log in met `AUTH_USERNAME`/`AUTH_PASSWORD` → moet daarna je bestaande profiel
   tonen (bevestigt dat `VITE_API_URL`, CORS met `credentials: true`, en de
   cross-origin sessie-cookie allemaal kloppen).
4. Log een item via Zoeken en via AI-tekstschatting om end-to-end te bevestigen dat de
   browser (ander domein dan de backend) succesvol met Render praat, met sessie intact.
5. GitHub → Actions-tab → controleer dat de "Deploy frontend to GitHub Pages"-workflow
   groen is.
6. Render-dashboard → Logs → controleer dat `npm run db:deploy -w api` zonder fouten
   liep. Bij de eerstvolgende deploy hoort migratie
   `20260724150000_add_theme_and_epic6` al toegepast te zijn; `No pending migrations` is verwacht.
