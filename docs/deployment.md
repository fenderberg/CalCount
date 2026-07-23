# CalCount — Deployment (Netlify + Neon)

> **Status: repo-kant geïmplementeerd, productie-koppeling nog niet uitgevoerd.** Dit
> document beschrijft hoe CalCount online gaat met Netlify (frontend + één serverless
> functie) en Neon (managed Postgres). De code in deze repo is al aangepast voor dit pad;
> wat nog moet gebeuren is het aanmaken van het Neon-project en de Netlify-site zelf (zie
> "Nog te doen" onderaan).
>
> **Waarom Neon en niet Supabase:** functioneel identiek voor dit doel (beide zijn managed
> Postgres met een pooled + directe connection string, prima gratis tier). Gekozen omdat
> het gratis-projectlimiet bij Supabase al bereikt was. Prisma praat met beide providers
> op exact dezelfde manier — mocht je later alsnog naar Supabase (of een andere Postgres-
> host) willen, verandert er niets aan `api/prisma/schema.prisma` of de route-code, alleen
> de connection strings.

## Waarom niet puur statische hosting

CalCount is full-stack. De frontend is statisch (kan op elke CDN), maar de backend
(profielopslag, budget, eten zoeken, AI-proxy) heeft server-side logica en een database
nodig. Statische hosts (GitHub Pages, de statische kant van Netlify) kunnen dat niet
draaien. **Netlify Functions** (serverless) + **Neon** (managed Postgres) leveren die
backend zonder dat je zelf een server beheert.

## Gekozen aanpak: één functie, Fastify en Prisma ongewijzigd

Een eerdere versie van dit document stelde voor om de vijf routebestanden te herschrijven
tot losse Netlify Functions per endpoint én Prisma te vervangen door rechtstreekse
provider-SDK-calls tegen een handmatig herschreven snake_case-schema. Dat is losgelaten:
voor een single-user hobby-app levert dat alleen extra herschreef- en testwerk op zonder
voordeel (geen verkeer dat per-route schaling nodig heeft). In plaats daarvan:

- **Prisma blijft** — alleen het datasource-provider wisselt van `sqlite` naar
  `postgresql` (`api/prisma/schema.prisma`). Alle route-code (`api/src/routes/*.ts`) en
  services (`api/src/services/*.ts`) roepen nog steeds `prisma.<model>.<method>()` aan,
  ongewijzigd. Dit maakt de keuze van Postgres-*provider* (Neon, Supabase, of iets anders)
  een pure configuratiekeuze — geen coderisico.
- **Eén Netlify Function**, niet zeven. De bestaande Fastify-app (nu in `api/src/app.ts`
  als `buildApp()`, losgetrokken van de `.listen()`-call in `api/src/server.ts`) wordt in
  `netlify/functions/api.ts` gewrapt met `aws-lambda-fastify`. Alle routes, validatie en
  services worden zo volledig hergebruikt.
- **`netlify.toml`** stuurt `/api/*` en `/health` door naar die ene functie, zonder het pad
  te herschrijven — de frontend (`web/src/api.ts`) roept alles al relatief aan
  (`/api/profile`, `/api/entries`, ...), dus die hoeft niet te veranderen.

## Doelarchitectuur

```
Browser (PWA)
   │  /api/*  en  /health
   ▼
Netlify (CDN: web/dist  +  netlify/functions/api.ts = de hele Fastify-app)
   │            │  ANTHROPIC_API_KEY (env)
   │            ▼
   │        Claude API (AI-tekst/foto-schatting)
   ▼
Neon Postgres  ◀── DATABASE_URL (pooled, runtime) / DIRECT_URL (direct, migraties)
```

## Component-mapping

| Nu (lokaal) | Straks (deploy) |
|---|---|
| `tsx src/server.ts` (luistert op :3001) | `netlify/functions/api.ts` (`aws-lambda-fastify` wrapt `buildApp()`) |
| Prisma + SQLite (`file:./dev.db`) | Prisma + Neon Postgres (`DATABASE_URL`/`DIRECT_URL`) |
| `api/src/routes/*.ts`, `api/src/services/*.ts` | **Ongewijzigd hergebruikt** |
| `packages/core` (rekenlogica) | **Ongewijzigd hergebruikt** |
| Frontend `web/` | **Ongewijzigd**; blijft `/api/*` en `/health` aanroepen (redirects regelen de rest) |

## Wat al in de repo staat

- `api/src/app.ts` — `buildApp()`, de Fastify-app zonder `.listen()`.
- `api/src/server.ts` — dunne lokale-dev-entrypoint die `buildApp()` aanroept en
  `.listen()` doet (ongewijzigd gedrag voor `npm run dev:api`).
- `api/prisma/schema.prisma` — `datasource db` nu `postgresql` met `url`/`directUrl` uit
  env, plus `binaryTargets` voor de Lambda-runtime. Provider-agnostisch: werkt met Neon,
  Supabase, of elke andere Postgres, zonder aanpassing.
- `netlify/functions/api.ts` — de ene functie; cachet de opgebouwde Fastify-proxy op
  moduleniveau zodat een warme container 'm hergebruikt (geen her-bouwen of
  `$disconnect()` per request — dat zou de Prisma-singleton in `api/src/db.ts` juist
  minder effectief maken).
- `netlify.toml` — redirects + build-config (zie hieronder).
- `api/package.json` — `postinstall: prisma generate` (zorgt dat zowel lokaal als bij de
  Netlify-build de Prisma-client met het juiste binary target wordt gegenereerd),
  `db:deploy: prisma migrate deploy` (voor het toepassen van migraties op de
  productie-database, aangeroepen vanuit `netlify.toml`'s `build.command`); Prisma is
  opgehoogd van 5.22 naar 6.19 (geen functionele noodzaak gebleken, maar wel de nieuwste
  stabiele 6.x — zie de kanttekening hieronder over wat het *echte* probleem bleek te zijn).
- Root `package.json` — de nieuwe dependencies `aws-lambda-fastify` en
  `@netlify/functions` (horen bij `netlify/functions/api.ts`, dat buiten de `api`-workspace
  valt), plus een root `tsconfig.json` zodat die functie los te typecheck en is.
- `.gitignore` — `.env`/`.env.*` toegevoegd (ontbrak eerder; nodig zodra er echte
  connection strings/sleutels lokaal bijkomen).
- `api/prisma/migrations/20260723094159_init/` — de oude SQLite-migraties zijn verwijderd
  (niet compatibel met Postgres); deze verse Postgres-migratie is gegenereerd via
  `prisma migrate diff --from-empty --to-schema-datamodel` (puur uit het schema, zonder
  een databaseverbinding nodig te hebben) en al gecommit. Ze wordt pas daadwerkelijk
  *toegepast* tijdens de eerste Netlify-build (zie Stap 2 en `netlify.toml`'s
  `build.command`).
  > **Wat er echt mis was (leerpunt):** de eerste poging om te migreren gaf op zowel de
  > ontwikkelmachine als in Netlify's build een generieke `P1001: Can't reach database
  > server`. Na uitgebreid uitsluiten van netwerk-/firewall-/IPv6-oorzaken bleek de
  > werkelijke fout veel simpeler: één teken fout overgetypt uit een screenshot van de
  > Neon-connection-string (`a5vi2l48` i.p.v. `asvi2l48` in de endpoint-hostnaam). DNS en
  > de TLS-handshake slaagden alsnog (wildcard-certificaat + gedeelde regionale IP's dekken
  > élke subdomeinnaam), maar Neon's proxy kon de niet-bestaande endpoint-id niet naar een
  > echte compute routeren, wat zich als een connectie-timeout/`P1001` uitte in plaats van
  > een duidelijke "endpoint niet gevonden"-fout. Met de juiste hostnaam werkt gewone
  > Prisma over een normale TCP-verbinding gewoon — zowel lokaal als vanuit Netlify's
  > build. **Praktische les:** kopieer connection strings altijd als tekst (Neon's "Copy
  > snippet"-knop), nooit overtypen vanaf een screenshot.

## Nog te doen (vereist accounts/dashboard-acties)

### Stap 1 — Neon-project aanmaken

Maak een project aan op [neon.tech](https://neon.tech) (gratis tier). Neon geeft in het
dashboard (Connection Details) een connection string met een `-pooler` in de hostnaam voor
de pooled/serverless-verbinding, en dezelfde host zónder `-pooler` voor de directe
verbinding:

- **Pooled** (bevat `-pooler` in de hostnaam) → wordt `DATABASE_URL`. Voeg
  `&pgbouncer=true&connection_limit=1` toe aan de querystring (naast het al aanwezige
  `sslmode=require`) — dit is de door Prisma aanbevolen instelling voor serverless.
- **Direct** (zonder `-pooler`) → wordt `DIRECT_URL` (alleen voor migraties).

### Stap 2 — Netlify-site koppelen (dit past ook meteen de migratie toe)

De site (`calcount-fenderberg`, https://calcount-fenderberg.netlify.app) is al aangemaakt
via `netlify-cli` (team `fenderberg`/"TAP"), en de vier env-variabelen (`DATABASE_URL`,
`DIRECT_URL`, `ANTHROPIC_API_KEY`, `CALCOUNT_AI_MODEL`) staan er al op (via
`netlify env:set --secret`). Wat nog moet:

1. Netlify-dashboard → `calcount-fenderberg` → Project configuration → Build & deploy →
   Continuous deployment → **Link repository** → GitHub → autoriseren indien gevraagd →
   kies `fenderberg/CalCount`. Dit vereist een browser-actie (GitHub-autorisatie) en kan
   niet via de CLI.
2. Build-instellingen komen automatisch uit `netlify.toml`. Trigger een deploy (gebeurt
   meestal automatisch zodra de koppeling actief is).

### Stap 3 — Lokaal testen met `netlify dev` (optioneel)

`netlify-cli` staat al globaal geïnstalleerd. Met dezelfde env-variabelen in een
root-`.env` (gitignored):

```bash
npm run build:web
npx netlify dev
```

Dit draait `netlify/functions/api.ts` lokaal via dezelfde esbuild/Lambda-emulatie als
productie — het beste moment om een bundel- of Prisma-binary-probleem te ontdekken vóór
een echte deploy.

## Verificatie na deploy

1. `curl https://<site>.netlify.app/health` → `{"status":"ok"}` (redirect + functie werkt).
2. `curl https://<site>.netlify.app/api/profile` → `404 {"error":"Nog geen profiel ingesteld"}`
   (bevestigt dat de Postgres-verbinding werkt, niet alleen dat de functie opstart).
3. Doorloop de onboarding in de browser, log een item via Zoeken (test de Open Food
   Facts-call + `FoodReference`-cache) en via AI-tekstschatting (test `ANTHROPIC_API_KEY`
   vanuit de Netlify-functie).
4. Neon-dashboard → Tables → controleer dat `Profile`/`FoodEntry`/`WeightEntry`/
   `FoodReference` bestaan met de verwachte kolommen.
5. Netlify-dashboard → Functions → `api` → logs controleren op de eerste requests (geen
   "cannot find module", geen Prisma "engine not found" — dat zou op een verkeerd
   `binaryTargets`/`included_files` wijzen).
6. Netlify-dashboard → Deploys → build log van de eerste deploy: controleer dat
   `npm run db:deploy -w api` zonder fouten liep.
7. `npx prisma migrate status --schema=api/prisma/schema.prisma` (met `DIRECT_URL` gezet)
   → "Database schema is up to date".

## Alternatief: alles op één Node-host

Wil je toch geen serverless functies, host dan het geheel op een Node-host met
persistente opslag (Render, Railway, Fly.io — gratis tier, eigen account nodig). De
Fastify-server (`api/src/server.ts`) kan dan ook de gebouwde frontend serveren. Nadeel
t.o.v. Netlify+Neon: je beheert een server en moet zelf voor SQLite een persistent volume
regelen (of alsnog naar Postgres migreren, zoals hierboven).
