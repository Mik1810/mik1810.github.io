# Piccirilli Michael Portfolio

## Abstract

Questa repository implementa un sistema full-stack per la pubblicazione, amministrazione e distribuzione di contenuti di tipo portfolio/curriculum strutturato. Dal punto di vista funzionale, il progetto serve a:

- rappresentare in forma digitale un profilo professionale e accademico;
- esporre contenuti localizzati (`it`, `en`) relativi a profilo, competenze, progetti, esperienze ed education;
- fornire un backend amministrativo per la modifica dei dati persistiti;
- usare la stessa base dati come fonte canonica sia per la UI pubblica sia per l'area admin.

Il portfolio, quindi, non e' solo una landing page, ma un piccolo sistema informativo orientato a contenuti strutturati, localizzazione, consistenza dei dati e gestione operativa.

## Scope del sistema

### Dominio applicativo

Il sistema modella le seguenti entita' principali:

- profilo personale;
- ruoli/claim principali mostrati nella hero section;
- link social;
- interessi;
- progetti portfolio custom;
- progetti GitHub featured con galleria immagini;
- esperienze;
- education;
- categorie tecnologiche e stack tecnico;
- categorie di skill e skill localizzate.

### Obiettivo operativo

L'obiettivo del sistema e' rendere interrogabile e aggiornabile un dataset personale coerente, versionato in Git e servito via API, mantenendo:

- separazione tra concerns UI, logica applicativa e accesso dati;
- supporto i18n a livello di persistenza;
- possibilita' di amministrazione controllata lato server;
- build riproducibile e deploy su Vercel.

## Stato attuale della repository

Stato della codebase al momento della stesura:

- frontend runtime interamente in TypeScript/TSX;
- backend API interamente in TypeScript;
- pattern architetturale principale: `api -> service -> repository -> database`;
- accesso dati pubblico su Drizzle ORM;
- accesso dati admin via SQL parametrizzato con driver `postgres`;
- autenticazione admin via Supabase Auth REST;
- `supabaseAdmin.ts` assente dal runtime;
- `npm run typecheck`, `npm run lint` e `npm run build` tutti passanti.

## Stack tecnologico

### Frontend

- React 19
- React Router 7
- Vite 7
- TypeScript 5
- CSS organizzato per componente/sezione

### Backend

- API handlers in `api/*.ts`
- runtime locale custom in `lib/devApiServer.ts`
- cookie session signing lato server
- rate limiting in-memory
- error handling condiviso

### Data layer

- PostgreSQL ospitato tramite Supabase
- Drizzle ORM
- driver `postgres`
- schema applicativo descritto in `lib/db/schema.ts`

### Tooling

- ESLint flat config
- Prettier
- `tsx` per execution/watch
- Drizzle Kit
- GitHub Actions

## Architettura logica

### Pipeline backend

Il backend segue il seguente pipeline model:

```txt
HTTP Request
  -> API Handler
  -> Service Layer
  -> Repository Layer
  -> SQL / Drizzle
  -> PostgreSQL
  -> JSON Response
```

### Responsabilita' per layer

#### API layer

Posizione:
- `api/*.ts`
- `api/admin/*.ts`

Responsabilita':
- controllo del metodo HTTP;
- lettura di query/body;
- wiring della cache HTTP;
- conversione eccezioni -> errori HTTP;
- logging contestuale.

#### Service layer

Posizione:
- `lib/services/publicContentService.ts`
- `lib/services/adminAuthService.ts`
- `lib/services/adminTableService.ts`

Responsabilita':
- orchestrazione di use case applicativi;
- validazione di input a livello di servizio;
- coordinamento tra repository;
- separazione tra protocollo HTTP e logica di dominio.

#### Repository layer

Posizione:
- `lib/db/repositories/*`

Responsabilita':
- interrogazione della persistenza;
- mapping record/tabella -> DTO applicativi;
- aggregazione di relazioni 1:N e tabelle `*_i18n`;
- isolamento della logica SQL dal resto del sistema.

## Architettura frontend

Il frontend e' organizzato come composizione di provider di contesto e componenti di sezione.

Pipeline tipica:

```txt
App
  -> Context Providers
  -> data fetch verso /api/*
  -> normalizzazione payload
  -> render delle sezioni pubbliche o dell'area admin
```

Provider principali:

- `LanguageContext`
- `ThemeContext`
- `AuthContext`
- `ProfileContext`
- `ContentContext`

Il frontend consuma il backend esclusivamente via fetch HTTP. Non esiste un client Supabase nel browser.

## Modello informativo

La persistenza segue un modello relazionale normalizzato con forte uso di tabelle localizzate.

### Pattern generale

Per molte entita' il pattern e':

```txt
base_table + base_table_i18n(locale, ...)
```

Esempi:

- `profile` + `profile_i18n`
- `hero_roles` + `hero_roles_i18n`
- `about_interests` + `about_interests_i18n`
- `projects` + `projects_i18n`
- `github_projects` + `github_projects_i18n`
- `experiences` + `experiences_i18n`
- `education` + `education_i18n`
- `tech_categories` + `tech_categories_i18n`
- `skill_categories` + `skill_categories_i18n`
- `skill_items` + `skill_items_i18n`

### Proprieta' del modello

Il modello privilegia:

- identificatori numerici stabili (`bigint` o `smallint`);
- `order_index` per l'ordinamento semantico lato UI;
- `slug` per entita' navigabili o logicamente nominabili;
- chiavi primarie composite per localizzazioni;
- constraint di unicita' per preservare l'ordine entro una relazione padre-figlio.

### Locale

Locale supportate:

- `it`
- `en`

La lingua di fallback lato repository e API pubbliche e' `it`.

## Schema Drizzle

Lo schema applicativo corrente e' in:

- [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts)

Lo schema e' stato calibrato sul dump reale del database, non solo su ipotesi statiche. Elementi rilevanti:

- uso esplicito di `bigint(..., { mode: 'number' })`;
- `profile.id` modellato come `smallint` con check `id = 1`;
- primary key composite nelle tabelle `*_i18n`;
- unique su:
  - `order_index`
  - `slug`
  - coppie come `(project_id, order_index)`.

File di riferimento:

- [dump_schema.sql](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/dump/dump_schema.sql)
- [dump.sql](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/dump/dump.sql)

Tra i due, `dump_schema.sql` e' il riferimento principale per struttura, vincoli e cardinalita'.

## Database access model

### Repository pubblici

I repository pubblici sono implementati in Drizzle:

- `aboutRepository.ts`
- `profileRepository.ts`
- `skillsRepository.ts`
- `experiencesRepository.ts`
- `projectsRepository.ts`

Ogni repository produce DTO gia' compatibili con il contratto API consumato dal frontend.

### Repository admin

L'area admin usa un modello differente:

- auth via REST HTTP verso Supabase Auth;
- CRUD generico via SQL parametrizzato e validazione di identifier.

Questo approccio e' stato scelto per mantenere:

- admin dinamico su piu' tabelle;
- indipendenza da un client Supabase ad hoc;
- controllo esplicito sul comportamento SQL.

## Sistema di autenticazione admin

### Modello

Il sistema admin non delega la sessione al browser tramite SDK remoto. Il modello attuale e':

1. `POST /api/admin/login`
2. verifica credenziali via `SUPABASE_URL/auth/v1/token?grant_type=password`
3. estrazione utente
4. creazione token locale firmato
5. invio cookie di sessione HTTP

### Implementazione

File coinvolti:

- `lib/db/repositories/adminAuthRepository.ts`
- `lib/services/adminAuthService.ts`
- `lib/authSession.ts`
- `lib/requireAdminSession.ts`
- `api/admin/login.ts`
- `api/admin/logout.ts`
- `api/admin/session.ts`

### Proprieta'

- il frontend non riceve un SDK auth stateful;
- la sessione e' verificata server-side;
- il cookie e' la fonte di verita' per l'autenticazione admin locale.

## Admin generic CRUD

L'endpoint:

- `GET|POST|PATCH|DELETE /api/admin/table`

fornisce un'interfaccia generica per l'editing delle tabelle consentite.

### Vincoli di sicurezza

- whitelist tabelle in `lib/adminTables.ts`;
- validazione dei nomi colonna come SQL identifiers;
- query parametrizzate per i valori;
- controllo esplicito delle primary keys richieste;
- rate limiting lato endpoint.

### Implicazioni

L'admin panel e' intenzionalmente schema-aware ma non schema-specific lato UI: manipola `Record<string, unknown>` mantenendo la flessibilita' necessaria a un pannello dati generico.

## API surface

### Endpoint pubblici

- `GET /api/profile?lang=it|en`
- `GET /api/about?lang=it|en`
- `GET /api/projects?lang=it|en`
- `GET /api/experiences?lang=it|en`
- `GET /api/skills?lang=it|en`
- `GET /api/health`

### Endpoint admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/tables`
- `GET|POST|PATCH|DELETE /api/admin/table`

Contratto dettagliato:

- [API_CONTRACT.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/docs/API_CONTRACT.md)

## Caching e comportamento runtime

### Cache applicativa

Gli endpoint pubblici usano una cache in memoria TTL tramite:

- `lib/cache/memoryCache.ts`

Uso corrente:

- `profile`
- `about`
- `projects`
- `skills`
- `experiences`

### Header HTTP

Gli handler pubblici impostano tipicamente:

```txt
Cache-Control: s-maxage=60, stale-while-revalidate=300
```

### Limiti del modello attuale

La cache e il rate limiting sono process-local:

- non condivisi tra istanze;
- sufficienti per sviluppo e baseline deploy;
- non equivalenti a un sistema distribuito tipo Redis.

## Error handling, validation, logging

### Error model

Helper comuni:

- `lib/http/apiUtils.ts`
- `lib/logger.ts`

Funzionalita':

- enforcement del metodo HTTP;
- `HttpError`;
- risposta JSON uniforme;
- logging contestuale per endpoint e metadata request.

### Validation model

La validazione e' oggi distribuita tra:

- API handlers
- service layer
- whitelist admin
- validazione identifier SQL

Non e' ancora presente un framework formale di schema validation tipo Zod nel runtime.

## Frontend composition

### Sezioni principali

Componenti pubblici:

- `Navbar`
- `HeroTyping`
- `About`
- `Projects`
- `Experience`
- `Skills`
- `Contact`
- `Footer`

Componenti admin:

- `AdminLogin`
- `AdminDashboard`
- `RequireAdmin`

### Data ingress

Il frontend carica:

- `profile` da `ProfileContext`
- `about/projects/experiences/skills` da `ContentContext`
- etichette statiche locali da `src/data/staticI18n.json`

### Comportamento di boot

L'applicazione usa un boot gate nella home per evitare render prematuri prima del completamento del caricamento dati e di un breve delay di inizializzazione UI.

## Variabili ambiente

La configurazione locale e' basata su [`.env.local`](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/.env.local).

Variabili rilevanti:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<service-role-or-secret>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require
```

Semantica:

- `SUPABASE_URL`: endpoint HTTP del progetto Supabase
- `SUPABASE_SECRET_KEY`: chiave usata per auth REST admin
- `DATABASE_URL`: DSN Postgres usato da Drizzle, `postgres` e tooling SQL

`DATABASE_URL` deve essere una connection string Postgres reale; una URL HTTP Supabase non e' valida per Drizzle o `pg_dump`.

## Script e riproducibilita'

### Sviluppo

Frontend:

```bash
npm run dev
```

Backend locale in watch mode:

```bash
npm run dev:api
```

Sistema completo:

```bash
npm run dev:fast
```

Simulazione ambiente Vercel:

```bash
npm run dev:vercel
```

### Qualita'

```bash
npm run typecheck
npm run lint
npm run build
npm run format
```

### Database

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Deploy model

### Vercel

Il target di deploy e' Vercel.

Caratteristiche operative:

- branch di produzione: `main`
- preview deploy su branch non-production
- configurazione runtime in `vercel.json`

### GitHub Actions

Workflow incluso:

- `.github/workflows/cleanup-deployments.yml`

Scopo:

- ridurre lo storico dei GitHub Deployments mantenendo solo gli ultimi record `preview` e `production`.

Questo workflow non sostituisce la retention interna delle deploy Vercel.

## Struttura della repository

```txt
api/
  public API handlers
  admin API handlers

lib/
  auth, dev server, cache, http helpers, services, repositories, schema

src/
  app root, context providers, UI components, static client-side data

docs/
  API contract

dump/
  SQL dump and schema dump
```

File particolarmente rilevanti:

- `src/App.tsx`
- `src/context/ContentContext.tsx`
- `lib/services/publicContentService.ts`
- `lib/services/adminTableService.ts`
- `lib/db/client.ts`
- `lib/db/schema.ts`
- `docs/API_CONTRACT.md`
- `SESSION.md`
- `IMPROVEMENTS.md`

## Proprieta' ingegneristiche attuali

La repository, allo stato attuale, presenta le seguenti proprieta':

- tipizzazione end-to-end su applicazione e API;
- separazione chiara tra livelli applicativi;
- schema dati esplicito e verificabile;
- assenza di client SDK Supabase nel runtime applicativo;
- supporto a localizzazione dei contenuti a livello DB;
- area admin server-side con sessione firmata e controllo accessi.

## Limiti e superfici aperte

Pur essendo funzionalmente stabile, il sistema mantiene alcune superfici di evoluzione:

- il rate limiting e la cache non sono distribuiti;
- il CRUD admin e' generic SQL-based, non ancora schema-driven a livello di tipo;
- la documentazione API e la UI admin possono essere ulteriormente formalizzate;
- restano aperti miglioramenti funzionali ed evolutivi descritti in `IMPROVEMENTS.md`.

## Riferimenti interni

- roadmap: [IMPROVEMENTS.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/IMPROVEMENTS.md)
- session log: [SESSION.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/SESSION.md)
- contratto API: [API_CONTRACT.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/docs/API_CONTRACT.md)
- schema dump: [dump_schema.sql](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/dump/dump_schema.sql)
