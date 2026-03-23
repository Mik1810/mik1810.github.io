# SESSION

## Aggiornamento release 1.1.3 (2026-03-23)

- Corretto lo switch lingua hero per usare fallback immediato della lingua attiva finché i dati profilo locale non sono effettivamente allineati (`profileLang`).
- Evitata la ripetizione visiva fallback -> DB nel typing quando il primo ruolo DB coincide con l'ultimo ruolo fallback mostrato.
- Esteso il contratto `ProfileContext` con `profileLang` per distinguere snapshot dati correnti da snapshot di lingua precedente.
- Verifiche pre-push:
  - `npm run lint` ✅
  - `npm run typecheck` ✅

## Aggiornamento release 1.1.2 (2026-03-23)

- Corretto errore lint CI (`react-hooks/set-state-in-effect`) in `HeroTyping`.
- Rimosse transizioni di stato sincrone dentro `useEffect` e mantenuto il reset immediato al cambio lingua con remount keyed.
- Verifiche locali eseguite prima del push:
  - `npm run lint` ✅
  - `npm run typecheck` ✅

## Aggiornamento release 1.1.1 (2026-03-23)

- Consolidato fallback hero in `src/data/heroFallback.json` per evitare costanti sparse nei componenti.
- Stabilizzato il comportamento di fallback/idratazione su `/home`:
  - switch lingua immediato su greeting, typing e badge universita`.
  - riduzione dei refresh non necessari quando i dati DB sono semanticamente uguali.
  - ordine social coerente tra fallback e DB (`LinkedIn` -> `GitHub`).
- Allineato fallback branding navbar al profilo hero pre-hydration.
- Preparato bump versione da `1.1.0` a `1.1.1` con aggiornamento changelog.

## Sessione

- Data inizio: `2026-03-14`
- Ora locale: `17:30:45 CET`
- Fuso di riferimento: `Europe/Rome`
- Repo: `.`
- Obiettivo: eseguire la `Fase 1` della roadmap, mantenendo traccia dei cambi e preparando il terreno per la correzione dei lint errors.

## Contesto iniziale

- `TypeScript`, `tsconfig.json`, `typecheck` e `Prettier` erano gia stati introdotti.
- `npm run typecheck` passava.
- `npm run lint` falliva per errori reali in frontend e in due file admin backend.
- I file target della `Fase 1` individuati per la migrazione erano:
  - `lib/supabaseAdmin.js`
  - `lib/requireAdminSession.js`
  - `api/projects.js`
- Durante la lettura delle dipendenze e emerso che anche `lib/authSession.js` era parte del percorso critico auth e andava tipizzato insieme agli altri due file `lib/`.

## Decisioni prese

### 1. Estendere la Fase 1 a `authSession`

Motivo:
- `requireAdminSession` dipende direttamente da `getSessionFromRequest`
- lasciare `authSession.js` in JavaScript avrebbe mantenuto non tipizzato il cuore del flusso admin

### 2. Abilitare il runtime locale per file `.ts`

Motivo:
- il progetto usa un dev server custom in `lib/devApiServer.js`
- il resolver locale cercava solo endpoint `.js`
- senza questo fix, la migrazione a `.ts` avrebbe funzionato al typecheck ma non nel flusso locale `npm run dev:api`

## Modifiche eseguite

### Dipendenze e script

File toccato: `package.json`

Cambi:
- aggiunta dipendenza dev `tsx`
- aggiornato script `dev:api` da:

```json
"dev:api": "node lib/devApiServer.js"
```

a:

```json
"dev:api": "tsx lib/devApiServer.js"
```

### Tipi base introdotti

Nuovi file:
- `lib/types/http.ts`
- `lib/types/auth.ts`

Scopo:
- tipizzare request/response API lato backend
- tipizzare sessione admin e utente autenticato

Snippet principale:

```ts
export interface ApiRequest<TBody = unknown> {
  method?: string
  query?: Record<string, string | undefined>
  headers?: Record<string, string | string[] | undefined>
  body?: TBody
  url?: string
}
```

### Migrazione `lib/supabaseAdmin.js` -> `lib/supabaseAdmin.ts`

Stato:
- completata

Note:
- mantenuto comportamento invariato
- tipizzazione delegata in modo naturale al client Supabase

### Migrazione `lib/authSession.js` -> `lib/authSession.ts`

Stato:
- completata

Migliorie:
- tipi su cookie parsing, token e payload sessione
- gestione esplicita di `cookie` come `string | string[] | undefined`

Snippet chiave:

```ts
export function getSessionFromRequest(req: ApiRequest) {
  const cookieHeader = req.headers?.cookie
  const cookies = parseCookies(Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader || '')
  const token = cookies[SESSION_COOKIE_NAME]
  return verifySessionToken(token)
}
```

### Migrazione `lib/requireAdminSession.js` -> `lib/requireAdminSession.ts`

Stato:
- completata

Migliorie:
- ritorno tipizzato `SessionUser | null`
- request/response tipizzate tramite i tipi base introdotti

### Migrazione `api/projects.js` -> `api/projects.ts`

Stato:
- completata

Migliorie:
- introdotte interfacce locali per record Supabase e payload finale
- tipizzato il layer cache
- isolata la normalizzazione lingua
- mantenuto invariato il comportamento runtime dell'endpoint

Snippet chiave:

```ts
const cache = new Map<string, { at: number; value: ProjectsResponse }>()

const normalizeLocale = (value: string | undefined): Locale =>
  value === 'en' ? 'en' : 'it'
```

### Compatibilita dev server

File toccato: `lib/devApiServer.js`

Problema:
- cercava solo `api/*.js`

Soluzione:
- ora prova prima `*.ts` e poi `*.js`

Snippet:

```js
const candidates = [`${safeBasePath}.ts`, `${safeBasePath}.js`];
const match = candidates.find((candidate) =>
  existsSync(path.join(apiDir, candidate))
);
return path.join(apiDir, match || `${safeBasePath}.js`);
```

## File creati

- `.vscode/settings.json`
- `.prettierignore`
- `.prettierrc.json`
- `SESSION.md`
- `api/projects.ts`
- `lib/authSession.ts`
- `lib/requireAdminSession.ts`
- `lib/supabaseAdmin.ts`
- `lib/types/auth.ts`
- `lib/types/http.ts`
- `tsconfig.json`

## File rimossi nella Fase 1

- `api/projects.js`
- `lib/authSession.js`
- `lib/requireAdminSession.js`
- `lib/supabaseAdmin.js`

## Verifiche eseguite

### `npm run typecheck`

Esito:
- `PASS`

Output sintetico:

```txt
> mik1810.github.io@0.0.0 typecheck
> tsc --noEmit
```

### `npm run lint`

Stato al momento della sessione:
- ancora non corretto in questa fase
- restano errori gia individuati in `src/App.jsx`, `src/components/jsx/HeroTyping.jsx`, `src/components/jsx/Projects.jsx`, alcuni `context`, e due `catch (err)` backend admin

## Prossimi passi concordati

1. chiudere formalmente la `Fase 1` verificando anche il runtime locale dell'API migrata
2. passare alla correzione dei lint errors
3. mantenere `SESSION.md` aggiornato con timestamp e passaggi successivi

## Ultimo aggiornamento

- Ora locale: `2026-03-14 17:34:26 CET`
- Stato: `Fase 1 in corso di validazione finale`

## Validazione finale Fase 1

### Import runtime dei moduli TypeScript

Comandi eseguiti:

```bash
npx tsx -e "import('./api/projects.ts').then((mod) => console.log(typeof mod.default))"
npx tsx -e "import('./lib/requireAdminSession.ts').then((mod) => console.log(typeof mod.requireAdminSession))"
```

Esito:
- `PASS`
- entrambi i moduli esportano correttamente una funzione

Output sintetico:

```txt
function
function
```

### Stato lint dopo la Fase 1

Comando eseguito:

```bash
npm run lint
```

Esito:
- `FAIL`, ma senza errori nuovi introdotti dalla migrazione TypeScript del backend core

Errori ancora aperti:
- `api/admin/login.js`: variabile `err` non usata
- `api/admin/table.js`: variabile `err` non usata
- `src/App.jsx`: `react-hooks/set-state-in-effect`
- `src/components/jsx/HeroTyping.jsx`: `react-hooks/set-state-in-effect`
- `src/components/jsx/Projects.jsx`: `react-hooks/set-state-in-effect`
- `src/context/AuthContext.jsx`: `react-refresh/only-export-components`
- `src/context/ContentContext.jsx`: `react-refresh/only-export-components`
- `src/context/LanguageContext.jsx`: `react-refresh/only-export-components`
- `src/context/ProfileContext.jsx`: `react-refresh/only-export-components`
- `src/context/ThemeContext.jsx`: `react-refresh/only-export-components`

Conclusione:
- la `Fase 1` backend puo considerarsi completata
- il passo successivo naturale e la correzione sistematica dei lint errors

### Test runtime locale API

Comando eseguito:

```bash
npm run dev:api
GET http://localhost:3000/api/projects?lang=it
```

Esito:
- `PASS`
- risposta HTTP `200`
- payload restituito correttamente dal nuovo endpoint `api/projects.ts`

Output sintetico:

```txt
STATUS=200
{"projects":[...],"githubProjects":[...]}
```

Nota:
- questo conferma che il fix a `lib/devApiServer.js` per la risoluzione `*.ts`/`*.js` funziona anche nel runtime locale

## Correzione lint errors

### Obiettivo

Portare `npm run lint` a esito positivo senza limitarsi a spegnere le regole, mantenendo invariato il comportamento utente dell'app.

### Interventi backend

File toccati:
- `api/admin/login.js`
- `api/admin/table.js`

Modifica:
- rimossi i parametri `err` inutilizzati nei blocchi `catch`

Esempio:

```js
} catch {
  return res.status(500).json({ error: 'Internal server error' });
}
```

### Interventi frontend su state/effect

File toccati:
- `src/App.jsx`
- `src/components/jsx/HeroTyping.jsx`
- `src/components/jsx/Projects.jsx`
- `src/components/jsx/AdminDashboard.jsx`

Dettagli:
- `App.jsx`: separato il reset di `bootDelayDone` dal delayed boot gate per evitare aggiornamenti sincroni nello stesso `useEffect`
- `HeroTyping.jsx`: estratta una versione stateful keyed della hero animation per resettare l'animazione tramite remount invece che con `setState` sincroni nell'effetto
- `Projects.jsx`: estratto un carousel keyed per azzerare lo stato media quando cambia il progetto, evitando reset sincroni in `useEffect`
- `AdminDashboard.jsx`: stabilizzati `primaryKeys` e `loadRows` per eliminare i warning residui `react-hooks/exhaustive-deps`

Snippet rappresentativi:

```jsx
<HeroTypingAnimation
  key={animationKey}
  nameText={nameText}
  roles={roles}
  ...
/>
```

```jsx
<GithubProjectMediaCarousel
  key={`${project.slug}:${images.join('|')}`}
  project={project}
  images={images}
  loopedImages={loopedImages}
/>
```

### Rifinitura context per React Fast Refresh

Problema:
- i file `src/context/*` esportavano nello stesso modulo sia il provider che hook/helper non-component, causando errori `react-refresh/only-export-components`

Soluzione:
- mantenuti i provider nei file esistenti
- spostati i valori context in file dedicati `*ContextValue.js`
- spostati i custom hook in file dedicati `use*.js`
- aggiornati tutti gli import nei componenti

Nuovi file creati:
- `src/context/authContextValue.js`
- `src/context/contentContextValue.js`
- `src/context/languageContextValue.js`
- `src/context/profileContextValue.js`
- `src/context/themeContextValue.js`
- `src/context/useAuth.js`
- `src/context/useContent.js`
- `src/context/useLanguage.js`
- `src/context/useProfile.js`
- `src/context/useTheme.js`

Esempio:

```js
import { useContext } from 'react';
import { LanguageContext } from './languageContextValue';

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
```

### Verifiche finali dopo i fix lint

Comandi eseguiti:

```bash
npm run lint
npm run build
npm run typecheck
```

Esito:
- `PASS`
- nessun errore lint residuo
- build frontend ancora valida
- typecheck ancora valido

Output sintetico:

```txt
> npm run lint
> eslint .

> npm run build
> vite build
✓ built in 8.85s

> npm run typecheck
> tsc --noEmit
```

## Ultimo aggiornamento

- Ora locale: `2026-03-14 18:05:18 CET`
- Stato: `Lint errors risolti, baseline tecnica pulita`

## Nota su todo.md

- Inclusa nel commit anche la modifica locale gia presente sul file oggi chiamato `todo.md`
- La modifica rimuove la sezione `Fase 10 — Sync GitHub automatica` e i relativi riferimenti nella matrice/struttura proposta
- Questa modifica non e stata generata durante i fix lint, ma viene tracciata intenzionalmente nel commit finale per mantenere il branch coerente con lo stato attuale del documento

## Migrazione TypeScript endpoint pubblici

### Obiettivo

Proseguire la roadmap completando la migrazione a TypeScript degli endpoint pubblici rimasti, prima di introdurre `repository layer` e `service layer`.

### File migrati

- `api/profile.js` -> `api/profile.ts`
- `api/about.js` -> `api/about.ts`
- `api/skills.js` -> `api/skills.ts`
- `api/experiences.js` -> `api/experiences.ts`

### Cosa e stato fatto

- mantenuto invariato il comportamento degli endpoint
- introdotti tipi locali per:
  - righe Supabase
  - payload finali
  - cache in memoria
  - normalizzazione locale `it/en`
- mantenute le compatibilita gia presenti:
  - fallback `bio` opzionale in `profile`
  - mapping flessibile di chiavi in `skills`
  - caching `s-maxage` / `stale-while-revalidate`

### Note per endpoint

#### `api/profile.ts`

- tipizzato il payload profile consumato dal frontend
- mantenuto il fallback per schema `profile_i18n` senza colonna `bio`

#### `api/about.ts`

- tipizzato il mapping tra `about_interests` e `about_interests_i18n`
- cache tipizzata `AboutResponse`

#### `api/skills.ts`

- tipizzati i record con naming alternativo delle foreign key
- mantenuti helper `keyOf` e `pick` per compatibilita con shape dati non uniformi

#### `api/experiences.ts`

- tipizzati `experiences` ed `education`
- preservato il filtro che scarta righe senza traduzione associata

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
npx tsx -e "Promise.all([import('./api/profile.ts'), import('./api/about.ts'), import('./api/skills.ts'), import('./api/experiences.ts')]).then((mods) => console.log(mods.map((m) => typeof m.default).join(',')))"
```

Esito:
- `PASS`
- import runtime confermato per tutti e quattro gli endpoint

Output sintetico:

```txt
function,function,function,function
```

## Ultimo aggiornamento

- Ora locale: `2026-03-14 18:20:30 CET`
- Stato: `Endpoint pubblici migrati a TypeScript, backend pubblico quasi interamente tipizzato`

## Migrazione TypeScript area admin/backend

### Obiettivo

Chiudere la migrazione TypeScript del backend server-side rimanente, convertendo configurazione admin e endpoint `api/admin/*` prima di passare ai layer architetturali successivi.

### File migrati

- `lib/adminTables.js` -> `lib/adminTables.ts`
- `api/admin/login.js` -> `api/admin/login.ts`
- `api/admin/logout.js` -> `api/admin/logout.ts`
- `api/admin/session.js` -> `api/admin/session.ts`
- `api/admin/table.js` -> `api/admin/table.ts`
- `api/admin/tables.js` -> `api/admin/tables.ts`

### Nuovi tipi introdotti

File creato:
- `lib/types/admin.ts`

Contenuto:
- `AdminTableConfig`
- `AdminTablesMap`
- `AdminSessionResponse`

Scopo:
- tipizzare configurazione admin
- tipizzare la shape della sessione admin
- ridurre la logica ad-hoc nei file `api/admin/*`

### Cosa e stato fatto

#### `lib/adminTables.ts`

- tipizzata l'intera mappa `ADMIN_TABLES`
- tipizzato `getAdminTableConfig(table: string)`

#### `api/admin/login.ts`

- tipizzato il body `email/password`
- tipizzato l'utente sessione tramite `SessionUser`

#### `api/admin/logout.ts`

- tipizzato il flow logout mantenendo invariata la verifica `requireAdminSession`

#### `api/admin/session.ts`

- tipizzato il payload restituito con `AdminSessionResponse`

#### `api/admin/table.ts`

- tipizzati body e payload `row/keys`
- mantenuta la logica CRUD generica
- scelto un typing pragmatico su `applyPrimaryKeys` usando `any` nel punto di composizione del query builder Supabase, per evitare falsi vincoli del type system senza alterare il runtime

#### `api/admin/tables.ts`

- tipizzata la serializzazione della lista tabelle esposte al frontend admin

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
npx tsx -e "Promise.all([import('./api/admin/login.ts'), import('./api/admin/logout.ts'), import('./api/admin/session.ts'), import('./api/admin/table.ts'), import('./api/admin/tables.ts')]).then((mods) => console.log(mods.map((m) => typeof m.default).join(',')))"
```

Esito:
- `PASS`
- import runtime corretto per tutti gli endpoint admin migrati

Output sintetico:

```txt
function,function,function,function,function
```

## Ultimo aggiornamento

- Ora locale: `2026-03-14 18:28:48 CET`
- Stato: `Backend server-side quasi completamente migrato a TypeScript`

## Migrazione TS/TSX supporto backend + root frontend

### Obiettivo

Ridurre drasticamente i file `.js/.jsx` residui senza entrare ancora nella conversione completa dei componenti UI, coprendo prima file di supporto, context e root dell'applicazione.

### File migrati

- `api/health.js` -> `api/health.ts`
- `lib/devApiServer.js` -> `lib/devApiServer.ts`
- `src/main.jsx` -> `src/main.tsx`
- `src/App.jsx` -> `src/App.tsx`
- `src/context/AuthContext.jsx` -> `src/context/AuthContext.tsx`
- `src/context/ContentContext.jsx` -> `src/context/ContentContext.tsx`
- `src/context/LanguageContext.jsx` -> `src/context/LanguageContext.tsx`
- `src/context/ProfileContext.jsx` -> `src/context/ProfileContext.tsx`
- `src/context/ThemeContext.jsx` -> `src/context/ThemeContext.tsx`
- `src/context/*ContextValue.js` -> `src/context/*ContextValue.ts`
- `src/context/use*.js` -> `src/context/use*.ts`

### Nuovi tipi frontend introdotti

File creato:
- `src/types/app.ts`

Contenuto principale:
- tipi per context frontend
- shape di `ProfileData`, `ProjectItem`, `GithubProjectItem`
- shape per `AboutData`, `ExperienceItem`, `EducationItem`
- `ProviderProps`
- tipi per traduzioni statiche

### Modifiche a ESLint

File toccato:
- `eslint.config.js`

Interventi:
- aggiunto supporto a `ts/tsx` tramite `typescript-eslint`
- disattivato `no-unused-vars` base sui file TS
- abilitato `@typescript-eslint/no-unused-vars` per evitare falsi positivi sui type signatures

Motivo:
- senza questo passaggio, i nuovi file TypeScript sarebbero stati lintati male o in modo incompleto

### Note tecniche rilevanti

#### `lib/devApiServer.ts`

- tipizzati request/response locali del dev server
- mantenuto il resolver `*.ts` prima di `*.js`

#### `src/App.tsx`

- convertito il root component lasciando invariata la logica applicativa
- mantenuti i componenti UI `.jsx` importati senza forzare una migrazione prematura

#### `src/context/*.tsx`

- introdotti tipi espliciti sui context
- tipizzati `profile`, `auth`, `theme`, `language`, `content`
- in `ContentContext.tsx` aggiunti normalizzatori tipizzati per payload API

#### `api/admin/table.ts`

- mantenuta una piccola eccezione locale con `any` sul query builder Supabase durante la composizione dinamica delle chiavi
- scelta motivata: evitare complessita artificiale del type system in un punto circoscritto senza contaminare il resto della codebase

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
GET http://localhost:3000/api/health
```

Esito:
- `PASS` per `typecheck`
- `PASS` per `lint`
- `PASS` per `build`
- `PASS` per `/api/health` dal dev server TypeScript

Output sintetico:

```txt
STATUS=200
{"ok":true,"service":"api","timestamp":"..."}
```

### Nota runtime

- Durante la prova di `npm run dev:api` la porta `3000` risultava gia occupata da un processo esistente sulla macchina
- Nonostante questo, la chiamata a `/api/health` ha risposto correttamente con `200`, confermando che il dev server API era effettivamente operativo

### Stato residuo dopo questo step

File `.js/.jsx` rimasti:
- `vite.config.js`
- `eslint.config.js`
- `src/data/icons.jsx`
- componenti UI in `src/components/jsx/*`

Conclusione:
- il backend di supporto e il root frontend sono ora allineati a TypeScript/TSX
- il grosso del lavoro residuo si e spostato sui componenti UI

## Ultimo aggiornamento

- Ora locale: `2026-03-14 18:43:00 CET`
- Stato: `Root frontend e context migrati a TS/TSX, lint/config aggiornati`

## Migrazione TS/TSX frontend leggero

### Obiettivo

Iniziare la migrazione dei componenti UI partendo dai file a rischio basso e ad alto riuso, senza entrare ancora nei componenti più densi come `Navbar`, `Projects` o `AdminDashboard`.

### File migrati

- `src/data/icons.jsx` -> `src/data/icons.tsx`
- `src/components/jsx/ThemeToggle.jsx` -> `src/components/jsx/ThemeToggle.tsx`
- `src/components/jsx/LanguageSwitcher.jsx` -> `src/components/jsx/LanguageSwitcher.tsx`
- `src/components/jsx/ScrollToTop.jsx` -> `src/components/jsx/ScrollToTop.tsx`
- `src/components/jsx/ScrollProgress.jsx` -> `src/components/jsx/ScrollProgress.tsx`

### Nuovi tipi introdotti

File creato:
- `src/types/icons.ts`

Contenuto:
- `IconRenderer`
- `IconMap`

Nota:
- inizialmente il tipo usava `JSX.Element`, poi corretto a `ReactElement` per compatibilita piena col typecheck del progetto

### Decisione su `src/data/icons`

- valutato se eliminare il modulo
- scelta: per ora mantenerlo

Motivo:
- e referenziato almeno da `HeroTyping` e `Footer`
- centralizza bene la mappa `icon key -> renderer SVG`
- rimuoverlo adesso avrebbe mescolato refactor concettuale e migrazione tecnica

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
```

Esito:
- `PASS`

### Stato residuo dopo questo step

File `.js/.jsx` rimasti:
- `vite.config.js`
- `eslint.config.js`
- `src/components/jsx/About.jsx`
- `src/components/jsx/AdminDashboard.jsx`
- `src/components/jsx/AdminLogin.jsx`
- `src/components/jsx/Contact.jsx`
- `src/components/jsx/Experience.jsx`
- `src/components/jsx/Footer.jsx`
- `src/components/jsx/HeroTyping.jsx`
- `src/components/jsx/Navbar.jsx`
- `src/components/jsx/Projects.jsx`
- `src/components/jsx/RequireAdmin.jsx`
- `src/components/jsx/Skills.jsx`

Conclusione:
- il blocco frontend leggero e stato chiuso senza richiedere ulteriori cambi alle regole ESLint
- i prossimi candidati migliori sono i componenti medi (`About`, `Contact`, `Footer`, `Experience`, `Skills`)

## Ultimo aggiornamento

- Ora locale: `2026-03-14 18:50:48 CET`
- Stato: `Prima tranche componenti frontend migrata a TS/TSX`

## Migrazione TS/TSX componenti frontend medi

### Obiettivo

Continuare la migrazione del frontend sui componenti a complessita media, lasciando per ultimi quelli piu densi (`Navbar`, `Projects`, `HeroTyping`, `AdminLogin`, `AdminDashboard`).

### File migrati

- `src/components/jsx/About.jsx` -> `src/components/jsx/About.tsx`
- `src/components/jsx/Contact.jsx` -> `src/components/jsx/Contact.tsx`
- `src/components/jsx/Experience.jsx` -> `src/components/jsx/Experience.tsx`
- `src/components/jsx/Footer.jsx` -> `src/components/jsx/Footer.tsx`
- `src/components/jsx/Skills.jsx` -> `src/components/jsx/Skills.tsx`
- `src/components/jsx/RequireAdmin.jsx` -> `src/components/jsx/RequireAdmin.tsx`

### Tipi aggiornati

File toccato:
- `src/types/app.ts`

Aggiunte:
- `icon?: ReactNode` su `ExperienceItem` e `EducationItem`
- `FooterProps`
- `ContactFormData`

Scopo:
- evitare cast o `any` inutili nei componenti appena convertiti

### Note per componente

#### `About.tsx`

- migrazione lineare senza cambi di comportamento

#### `Contact.tsx`

- tipizzati `ChangeEvent` e `FormEvent`
- introdotto `ContactFormData`

#### `Experience.tsx`

- tipizzato `sectionRef`
- tipizzato `querySelectorAll`
- gestita la custom property CSS `--logo-bg` con `React.CSSProperties`

#### `Footer.tsx`

- tipizzato `className` tramite `FooterProps`
- mantenuto il riuso del modulo `icons`

#### `Skills.tsx`

- tipizzato l'helper `getTechCategoryLabel`
- tipizzata la custom property CSS `--tech-color`

#### `RequireAdmin.tsx`

- tipizzato `children`
- ritorno reso esplicito con fragment React

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
```

Esito:
- `PASS`

### Stato residuo dopo questo step

File `.js/.jsx` rimasti:
- `vite.config.js`
- `eslint.config.js`
- `src/components/jsx/Navbar.jsx`
- `src/components/jsx/Projects.jsx`
- `src/components/jsx/HeroTyping.jsx`
- `src/components/jsx/AdminLogin.jsx`
- `src/components/jsx/AdminDashboard.jsx`

Conclusione:
- il frontend residuo e ora concentrato solo sui componenti piu sostanziosi
- il prossimo blocco naturale e `Navbar + HeroTyping + Projects`, lasciando `AdminLogin + AdminDashboard` per ultimi

## Ultimo aggiornamento

- Ora locale: `2026-03-14 18:54:53 CET`
- Stato: `Componenti frontend medi migrati a TS/TSX`

## Migrazione TS/TSX componenti frontend principali

### Obiettivo

Chiudere la migrazione del sito pubblico convertendo i tre componenti piu centrali lato esperienza utente:
- `Navbar`
- `HeroTyping`
- `Projects`

### File migrati

- `src/components/jsx/Navbar.jsx` -> `src/components/jsx/Navbar.tsx`
- `src/components/jsx/HeroTyping.jsx` -> `src/components/jsx/HeroTyping.tsx`
- `src/components/jsx/Projects.jsx` -> `src/components/jsx/Projects.tsx`

### Tipi aggiornati

File toccato:
- `src/types/app.ts`

Aggiunte:
- `HeroTypingAnimationProps`
- `NavbarLink`
- `GithubProjectMediaCarouselProps`

Scopo:
- evitare prop implicite o strutture dati non tipizzate nei componenti principali

### Note per componente

#### `Navbar.tsx`

- tipizzata la lista `navLinks`
- mantenuta invariata la logica di menu mobile, login/logout e route admin

#### `HeroTyping.tsx`

- tipizzate le props della subcomponent `HeroTypingAnimation`
- mantenuta la logica keyed per il reset dell'animazione
- riusata la mappa `icons` tipizzata

#### `Projects.tsx`

- tipizzati tilt handlers, media carousel e fallback image logic
- tipizzati `safeProjects` e `featuredGithubProjects`
- corretto il fallback DOM `nextElementSibling` come `HTMLElement | null`

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
```

Esito:
- `PASS`

### Stato residuo dopo questo step

File `.js/.jsx` rimasti:
- `vite.config.js`
- `eslint.config.js`
- `src/components/jsx/AdminLogin.jsx`
- `src/components/jsx/AdminDashboard.jsx`

Conclusione:
- il frontend pubblico e ora sostanzialmente migrato a TypeScript/TSX
- restano solo i componenti admin e, se vogliamo chiudere proprio tutto, i due file config `vite.config.js` e `eslint.config.js`

## Ultimo aggiornamento

- Ora locale: `2026-03-14 19:02:30 CET`
- Stato: `Frontend pubblico migrato quasi completamente a TS/TSX`

## Migrazione TS/TSX componenti admin frontend

### Obiettivo

Chiudere la migrazione dei componenti React rimanenti convertendo anche l'area admin UI.

### File migrati

- `src/components/jsx/AdminLogin.jsx` -> `src/components/jsx/AdminLogin.tsx`
- `src/components/jsx/AdminDashboard.jsx` -> `src/components/jsx/AdminDashboard.tsx`

### Tipi aggiornati

File toccato:
- `src/types/app.ts`

Aggiunte:
- `AdminTableDefinition`
- `AdminTablesResponse`
- `AdminRowsResponse`
- `AdminRowResponse`
- `AdminOkResponse`

Scopo:
- tipizzare le chiamate fetch dell'admin dashboard
- evitare payload impliciti o `any` lato frontend admin

### Note per componente

#### `AdminLogin.tsx`

- tipizzato `FormEvent`
- tipizzato `error` come `string | null`
- mantenuto invariato il flusso:
  - redirect automatico se gia autenticato
  - submit login
  - redirect su `/admin`

#### `AdminDashboard.tsx`

- tipizzati:
  - tabelle disponibili
  - righe tabella
  - risposte API CRUD
  - `draftRow`
  - `selectedRow`
- mantenuta invariata la UX:
  - lista tabelle
  - ricerca/paginazione
  - insert/update/delete
  - modal editor e conferma delete

Nota:
- il dashboard resta volutamente generico su `Record<string, unknown>` perche manipola tabelle eterogenee
- in questo caso e un buon compromesso: tipizzato dove serve, senza introdurre una falsa rigidita schema-specific

### Verifiche eseguite

Comandi:

```bash
npm run typecheck
npm run lint
npm run build
```

Esito:
- `PASS`

### Stato residuo dopo questo step

File `.js/.jsx` rimasti:
- `vite.config.js`
- `eslint.config.js`

Conclusione:
- tutta l'applicazione runtime principale e ora migrata a TypeScript/TSX
- restano solo i due file di configurazione toolchain

## Ultimo aggiornamento

- Ora locale: `2026-03-14 19:17:07 CET`
- Stato: `Componenti admin migrati, restano solo i file config JS`
## 2026-03-14 20:00 CET - Deployment cleanup workflow

- Added [cleanup-deployments.yml](./.github/workflows/cleanup-deployments.yml) to keep only the latest GitHub deployment for `production` and the latest for `preview`.
- The workflow runs on `deployment_status` success, marks older deployments as `inactive`, then deletes them via the GitHub Deployments API.
- Environment grouping is inferred from deployment environment names containing `production` or `preview`.
- Follow-up check needed after the first runs: confirm the actual deployment environment names emitted by Vercel/GitHub match the workflow classification.
## 2026-03-14 20:45 CET - Repository layer kickoff

- Added [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts) to isolate Supabase reads and data mapping for projects and featured GitHub projects.
- Added [profileRepository.ts](./lib/db/repositories/profileRepository.ts) to isolate profile, socials, and hero role reads, including the legacy `bio` fallback.
- Simplified [projects.ts](./api/projects.ts) so it now handles HTTP concerns and cache only.
- Simplified [profile.ts](./api/profile.ts) so it now delegates data access to the repository layer.
- Next step after verification: decide whether to keep extracting more repositories first or introduce a thin service layer on top of these two repositories.
## 2026-03-14 21:05 CET - Repository layer extended to remaining public endpoints

- Added [aboutRepository.ts](./lib/db/repositories/aboutRepository.ts) for about interests data access.
- Added [skillsRepository.ts](./lib/db/repositories/skillsRepository.ts) for tech stack and skill category aggregation.
- Added [experiencesRepository.ts](./lib/db/repositories/experiencesRepository.ts) for experiences and education mapping.
- Simplified [about.ts](./api/about.ts), [skills.ts](./api/skills.ts), and [experiences.ts](./api/experiences.ts) so they now focus on HTTP and cache concerns.
- Reused the existing repository locale normalization to keep locale handling consistent across all public API endpoints.
## 2026-03-14 21:20 CET - Public service layer introduced

- Added [publicContentService.ts](./lib/services/publicContentService.ts) as a thin application layer between public API handlers and repositories.
- Updated [about.ts](./api/about.ts), [profile.ts](./api/profile.ts), [projects.ts](./api/projects.ts), [skills.ts](./api/skills.ts), and [experiences.ts](./api/experiences.ts) to call the service layer instead of repositories directly.
- Centralized locale normalization export in the service layer so handlers no longer need to know which repository defines it.
- The service layer is intentionally thin for now, giving us a stable place to add orchestration, cross-repository composition, logging, or validation later without rewriting handlers again.
## 2026-03-14 21:40 CET - Admin repositories and services introduced

- Added [adminAuthRepository.ts](./lib/db/repositories/adminAuthRepository.ts) to isolate Supabase admin sign-in.
- Added [adminTableRepository.ts](./lib/db/repositories/adminTableRepository.ts) to isolate dynamic CRUD operations for allowed admin tables.
- Added [adminAuthService.ts](./lib/services/adminAuthService.ts) for login, logout, and session response orchestration.
- Added [adminTableService.ts](./lib/services/adminTableService.ts) for table validation, payload normalization, limit parsing, and CRUD delegation.
- Updated [login.ts](./api/admin/login.ts), [logout.ts](./api/admin/logout.ts), [session.ts](./api/admin/session.ts), [tables.ts](./api/admin/tables.ts), and [table.ts](./api/admin/table.ts) to use the new admin service layer.
## 2026-03-14 22:00 CET - Backend hardening baseline

- Added [apiUtils.ts](./lib/http/apiUtils.ts) with shared helpers for method enforcement, typed HTTP errors, generic error responses, and simple non-empty string validation.
- Added [logger.ts](./lib/logger.ts) for structured API error logging with context metadata.
- Updated public endpoints and [health.ts](./api/health.ts) to use shared method enforcement and centralized error handling.
- Hardened [login.ts](./api/admin/login.ts) with explicit trimmed string validation and more predictable auth error mapping.
- Improved [table.ts](./api/admin/table.ts) so missing-vs-disallowed table errors are distinguished and server-side failures are logged with request metadata.
## 2026-03-14 22:15 CET - Admin rate limiting

- Added [rateLimit.ts](./lib/http/rateLimit.ts) with a simple in-memory limiter keyed by client IP or forwarded headers.
- Extended [http.ts](./lib/types/http.ts) and [devApiServer.ts](./lib/devApiServer.ts) so local API requests carry an `ip` field when available.
- Applied a strict limiter to [login.ts](./api/admin/login.ts): `5` attempts per minute per client.
- Applied a broader limiter to [table.ts](./api/admin/table.ts): `120` requests per minute per client.
- This limiter is intentionally lightweight and process-local, which is enough for baseline protection now and keeps the next migration path open if we later move to a shared store.
## 2026-03-14 22:25 CET - API dev server autoreload

- Updated [package.json](./package.json) so `dev:api` now runs `tsx watch lib/devApiServer.ts`.
- Result: local backend changes under `api/` and `lib/` should now restart the API server automatically during development.
- Practical impact: after switching to the new script once, future backend edits should no longer require a manual `dev:api` restart in most cases.
## 2026-03-14 22:35 CET - Cache utility and stricter admin payload validation

- Added [memoryCache.ts](./lib/cache/memoryCache.ts) to centralize simple TTL-based in-memory caching for public endpoints.
- Updated [about.ts](./api/about.ts), [profile.ts](./api/profile.ts), [projects.ts](./api/projects.ts), [skills.ts](./api/skills.ts), and [experiences.ts](./api/experiences.ts) to use the shared cache utility instead of duplicating map-and-timestamp logic.
- Hardened [adminTableService.ts](./lib/services/adminTableService.ts) so invalid `limit` values now return a `400` instead of silently falling back, and empty object payloads are rejected explicitly.
- Updated [table.ts](./api/admin/table.ts) so `POST`, `PATCH`, and `DELETE` reject missing or empty `row`/`keys` payloads with clearer client errors.
## 2026-03-14 22:50 CET - Drizzle foundation

- Added Drizzle scripts in [package.json](./package.json): `db:generate`, `db:migrate`, and `db:studio`.
- Added [drizzle.config.ts](./drizzle.config.ts) using `DATABASE_URL` or `SUPABASE_DB_URL`, without switching runtime queries yet.
- Added [client.ts](./lib/db/client.ts) as the shared Drizzle client entrypoint.
- Added [schema.ts](./lib/db/schema.ts) with the current content tables modeled in Drizzle for the gradual migration away from raw query builders.
## 2026-03-14 23:05 CET - Drizzle env loading clarified

- Updated [drizzle.config.ts](./drizzle.config.ts) and [client.ts](./lib/db/client.ts) to load `.env.local` explicitly via `dotenv`.
- Drizzle now also checks `SUPABASE_URL` as a fallback name, but only if it is actually a PostgreSQL connection string.
- Added an explicit error message for the common mismatch where `SUPABASE_URL` is the Supabase HTTP project URL rather than the Postgres DSN.
- `SUPABASE_SECRET_KEY` is not used by Drizzle ORM and does not help for `pg_dump` or direct SQL connections.
## 2026-03-14 23:20 CET - First Drizzle repository pilot

- Updated [aboutRepository.ts](./lib/db/repositories/aboutRepository.ts) to use Drizzle instead of the Supabase query builder.
- The pilot uses [client.ts](./lib/db/client.ts), [schema.ts](./lib/db/schema.ts), and typed Drizzle filters/order clauses (`eq`, `asc`).
- Chosen pilot scope: `about` because it is small enough to validate the Drizzle path without opening the higher-complexity `projects` flow immediately.
## 2026-03-14 23:35 CET - Second Drizzle migration: profile repository

- Updated [profileRepository.ts](./lib/db/repositories/profileRepository.ts) to use Drizzle for profile, profile_i18n, social links, and hero roles.
- Replaced Supabase query builder calls with typed Drizzle selects, filters, and order clauses while keeping the public `ProfileResponse` payload unchanged.
- This second migration gives us a better signal than `about` because it spans multiple tables and preserves aggregation logic for socials and localized hero roles.
## 2026-03-14 23:50 CET - Third Drizzle migration: skills repository

- Updated [skillsRepository.ts](./lib/db/repositories/skillsRepository.ts) to use Drizzle for tech categories, tech items, skill categories, and skill item translations.
- Replaced the old defensive Supabase row-shape compatibility helpers with typed Drizzle selects based on the normalized schema in [schema.ts](./lib/db/schema.ts).
- Verified the migrated repository against live data: `4` tech categories and `4` skill categories were returned for locale `it`, with `Linguaggi` and `Programmazione` as the first labels.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after the migration.
- Build note: the one temporary Vite failure during verification was caused by launching the build from the old junction path `mik1810.github.io`; the real repository root [repository root](./) builds correctly and should be preferred for future commands.
## 2026-03-15 00:05 CET - Fourth Drizzle migration: experiences repository

- Updated [experiencesRepository.ts](./lib/db/repositories/experiencesRepository.ts) to use Drizzle for both the `experiences` and `education` flows.
- Replaced Supabase reads with typed Drizzle selects over [experiences](./lib/db/schema.ts), [experiencesI18n](./lib/db/schema.ts), [education](./lib/db/schema.ts), and [educationI18n](./lib/db/schema.ts), preserving the existing payload shape and the rule that untranslated rows are skipped.
- Verified the migrated repository against live data: locale `it` returned `3` experiences and `2` education entries, with `Cybersecurity National Lab` and `Università degli Studi dell'Aquila` as the first labels.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after this migration as well.
## 2026-03-15 00:20 CET - Fifth Drizzle migration: projects repository

- Updated [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts) to use Drizzle for the full public projects flow: portfolio projects, localized project content, tags, featured GitHub projects, GitHub tags, and GitHub image galleries.
- Removed the old Supabase compatibility layer for alternate foreign-key field names because the real database schema is now modeled explicitly in [schema.ts](./lib/db/schema.ts).
- Preserved the external payload shape used by [projects.ts](./api/projects.ts), including `live`, `githubUrl`, `liveUrl`, primary preview image, and gallery images.
- Verified the migrated repository against live data: locale `it` returned `2` standard projects and `4` featured GitHub projects; the first GitHub project (`Unify`) exposed `5` gallery images through Drizzle.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after the final repository migration.
## 2026-03-15 00:35 CET - Removed supabaseAdmin.ts dependency

- Reworked [adminTableRepository.ts](./lib/db/repositories/adminTableRepository.ts) to use direct SQL through [client.ts](./lib/db/client.ts) instead of the Supabase query builder.
- Added identifier validation and parameterized query construction for the generic admin CRUD flow so the admin area keeps its current flexibility without relying on `supabase-js`.
- Reworked [adminAuthRepository.ts](./lib/db/repositories/adminAuthRepository.ts) to authenticate against Supabase Auth over HTTP (`/auth/v1/token?grant_type=password`) using `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- Removed [supabaseAdmin.ts](./lib/supabaseAdmin.ts) entirely and removed `@supabase/supabase-js` from [package.json](./package.json).
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 18:24 CET - Aligned admin table headers with centered visual columns

- Refined the admin table header alignment so column titles now follow the same visual logic as their cells.
- Updated:
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
- Changes:
  - introduced header alignment classes derived from the existing per-column layout helper
  - media, icon, and color-swatch columns now center their headers
  - textual columns keep left alignment
- Result:
  - column headers now feel visually anchored to the content beneath them
  - compact visual columns no longer have left-aligned titles over centered content
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 18:34 CET - Refined admin grid alignment for URLs, icons, and order columns

- Improved the admin table rendering to better align `Social links` and other compact visual tables.
- Updated:
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
- Changes:
  - plain `url` columns are now treated like other media/link columns, so their headers and cells are centered consistently
  - `order_index` now uses its own compact centered column profile
  - `icon_key` cells now render as compact icon-only previews with hover label instead of mixed icon/text sizing
  - link/PDF icon sizes were increased to match the other compact visual previews
- Result:
  - `Social links` now reads more coherently
  - compact numeric ordering columns no longer float visually with left-aligned content
  - icon and link columns feel uniform across tables
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 18:47 CET - Removed deprecated github_projects.image_url from app/runtime schema

- Removed the legacy `image_url` column from the `github_projects` runtime model and switched the GitHub projects flow to rely only on `github_project_images`.
- Updated:
  - [schema.ts](./lib/db/schema.ts)
  - [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts)
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
  - [app.ts](./src/types/app.ts)
  - [projectTables.ts](./lib/admin/tables/projectTables.ts)
  - [0000_drop_github_projects_image_url.sql](./drizzle/0000_drop_github_projects_image_url.sql)
  - [drizzle meta journal](./drizzle/meta/_journal.json)
- Notes:
  - `github_projects.image_url` was only acting as a legacy placeholder/fallback
  - public GitHub project rendering now uses only `github_project_images`
  - the admin editor for `GitHub projects` no longer exposes `image_url`
  - `image-processing` keeps using the existing title fallback because it has no linked images yet
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed
  - direct runtime check of `fetchProjects('it')` confirmed GitHub projects still resolve `images` correctly from `github_project_images`

## 2026-03-15 18:58 CET - Rewrote README in a more paper-like technical style

- Rewrote [README.md](./README.md) to document the repository as a technical system rather than as a changelog or generic project summary.
- The new README now emphasizes:
  - abstract and problem framing
  - explicit system objectives
  - current factual repository state
  - two-plane architecture (public read plane and admin control plane)
  - schema-driven admin backed by Drizzle
  - current data model and invariants
  - deployment/runtime constraints for Vercel and Supabase
  - limitations and forward-looking work
- Important correction:
  - the document now reflects the current admin architecture accurately and no longer describes the older validated-SQL phase as if it were the present runtime state

## 2026-03-15 19:12 CET - Refined GitHub project media states and added lightbox preview

- Improved the single-page `Projects` section so GitHub project media behaves more explicitly and no longer relies on ambiguous placeholder treatment.
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
  - [Projects.css](./src/components/css/Projects.css)
  - [staticI18n.json](./src/data/staticI18n.json)
  - [app.ts](./src/types/app.ts)
- Changes:
  - introduced clearer media behavior for GitHub projects:
    - no-image state now renders an explicit fallback message
    - media blocks expose a preview CTA instead of behaving like opaque placeholders
  - added a lightbox-style modal for GitHub project media
  - the modal opens from the media block and renders images with `object-fit: contain`, so screenshots are no longer cropped in the enlarged preview
  - added keyboard and backdrop close behavior for the media viewer
- Result:
  - the portfolio remains single-page
  - GitHub project media feels more intentional and less placeholder-driven
  - screenshots can now be inspected at a larger scale without losing content due to cropping
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed
  - live admin table read test returned one `profile` row
  - invalid admin sign-in test failed cleanly with `Invalid login credentials`
- Remaining mentions of `supabaseAdmin` now live only in historical notes/documentation (`SESSION.md`, `todo.md`), not in runtime code.
## 2026-03-15 00:50 CET - Technical README added

- Added [README.md](./README.md) from scratch as the main technical project documentation.
- The README documents:
  - stack and runtime architecture
  - repo structure
  - data model and i18n table pattern
  - environment variables
  - development and quality scripts
  - backend cache / error handling / rate limiting
  - admin auth and CRUD internals
  - API surface and deployment notes
  - database dump usage and roadmap status
- The document was written from the real codebase state plus [SESSION.md](./SESSION.md) and [API_CONTRACT.md](./docs/API_CONTRACT.md), so it reflects the post-Drizzle, post-`supabaseAdmin` architecture rather than the original project shape.
## 2026-03-15 01:05 CET - README rewritten with a more technical/system-oriented tone

- Rewrote [README.md](./README.md) to describe the repository as a current-state software system rather than as a historical refactor narrative.
- The new README now emphasizes:
  - project purpose and operational role of the portfolio as a structured content system
  - logical architecture and layer responsibilities
  - information model and localization pattern
  - authentication, admin CRUD, caching, validation, and deploy model
  - engineering properties and current system limits
- Explicitly removed the previous emphasis on refactor history and replaced it with a more formal, technical, and quasi-scientific description of the repository's present architecture.
## 2026-03-15 01:20 CET - README deepened with code-level and architectural rationale

- Rewrote [README.md](./README.md) again with a stronger technical focus.
- Added:
  - Mermaid diagrams for component, request, authentication, and ER-level views
  - real code snippets from handlers, repositories, schema, admin auth, and admin SQL execution
  - explicit technology-selection rationale with trade-offs versus alternatives such as Next.js, Prisma, Redux/Zustand, `supabase-js`, and Redis
  - a dedicated section explaining why architecture diagrams are more useful than screenshots for this repository at the current stage
- The README now behaves more like a technical system dossier than a generic project introduction.
## 2026-03-15 01:40 CET - Admin SQL path hardened and README made more paper-like

- Reworked [adminTableRepository.ts](./lib/db/repositories/adminTableRepository.ts) again to remove the remaining use of `sqlClient.unsafe(...)` from the admin CRUD path.
- The admin SQL layer now uses:
  - strict identifier validation
  - `postgres` tagged-template queries
  - parameterized values for dynamic payloads and filters
- This keeps the generic admin model while reducing the attack surface and making the security story much easier to defend technically.
- Important clarification captured in the README:
  - `prepare: false` in [client.ts](./lib/db/client.ts) affects prepared statement reuse/caching, not whether scalar values are bound safely as parameters.
- Reworked [README.md](./README.md) one more time to make it more "paper-like":
  - added header logo and repository/deploy/API/CV badges
  - strengthened the formal system description
  - added explicit security discussion for dynamic SQL
  - replaced the previous admin SQL example with the safer tagged-template version
  - clarified why the README links to the deploy target rather than an unverifiable live public URL
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed
  - admin read test on `profile` still returned one row after the SQL hardening
## 2026-03-15 01:50 CET - README header enriched with stack logos

- Updated the initial header of [README.md](./README.md) to include a dedicated stack/logo strip in addition to the repository/deploy badges.
- Added visible badges/logos for the core technologies currently used by the repository:
  - React
  - Vite
  - TypeScript
  - Drizzle ORM
  - PostgreSQL
  - Supabase
  - Vercel
- Purpose: make the initial section communicate both the software identity of the project and its concrete implementation stack without requiring the reader to scroll into the body of the document.
## 2026-03-15 02:00 CET - README expanded with an explicit admin-vs-Drizzle rationale

- Added a dedicated section in [README.md](./README.md) explaining why the admin layer does not yet use Drizzle in the same way as the public repositories.
- The new section documents the core distinction between:
  - schema-stable, compile-time known read paths
  - runtime-generic, table-selected admin CRUD paths
- It also outlines the realistic evolution strategies for a future Drizzle-based admin path:
  - table-specific admin repositories
  - schema-driven admin registry
  - keeping the current generic CRUD model
- Purpose: make the current architectural trade-off explicit and prevent the design from looking inconsistent or accidental in the documentation.
## 2026-03-14 23:54 CET - Diagnosed Vercel 500s on public endpoints as missing DB runtime config

- Investigated the production `500` errors affecting all public endpoints:
  - `/api/about`
  - `/api/profile`
  - `/api/projects`
  - `/api/skills`
  - `/api/experiences`
- Root cause analysis:
  - all public handlers now depend on Drizzle-backed repositories through [publicContentService.ts](./lib/services/publicContentService.ts)
  - all those repositories import [client.ts](./lib/db/client.ts)
  - therefore a missing PostgreSQL DSN at runtime causes all public read endpoints to fail together
- Tightened the configuration contract:
  - updated [client.ts](./lib/db/client.ts) so runtime DB access only accepts `DATABASE_URL` or `SUPABASE_DB_URL`
  - updated [drizzle.config.ts](./drizzle.config.ts) to follow the same rule
  - explicitly removed the misleading fallback to `SUPABASE_URL`, because that value is the Supabase HTTP project endpoint, not a PostgreSQL connection string
- Expected production fix:
  - add the real Supabase/Postgres DSN as `DATABASE_URL` (or `SUPABASE_DB_URL`) in Vercel environment variables
  - redeploy production after saving the environment variable
- Verification during diagnosis:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - local `vite build` failed for a separate path/junction issue and is unrelated to the API `500` investigation
## 2026-03-15 00:10 CET - Refined Vercel DB diagnosis after function logs

- Production runtime logs confirmed that the public API no longer fails because of a missing `DATABASE_URL`.
- The new failure mode is downstream of DB connectivity and query execution:
  - Drizzle reaches the database layer
  - public queries fail intermittently inside repository reads
  - `/api/health` and `/api/admin/session` continue to work, confirming the issue is isolated to DB-backed public endpoints
- The Vercel `DATABASE_URL` currently points to the Supabase shared pooler in session mode (`:5432`).
- Supabase documents that serverless platforms should use the transaction pooler (`:6543`) for transient connections, while session mode is intended for long-lived/persistent servers.
- Applied serverless-oriented client tuning in [client.ts](./lib/db/client.ts):
  - `max: 1`
  - `idle_timeout: 5`
  - `connect_timeout: 15`
  - `prepare: false` retained
- Improved [logger.ts](./lib/logger.ts) to include `error.cause` in server logs, so future production errors expose the underlying Postgres/postgres-js cause instead of only Drizzle's wrapper message.
- Expected external follow-up:
  - replace the Vercel `DATABASE_URL` with the Supabase transaction pooler connection string on port `6543`
  - redeploy production after saving the environment variable
## 2026-03-15 00:25 CET - Reduced public DB fan-out for Vercel serverless stability

- Inspected the production failure pattern after the `DATABASE_URL` fix:
  - errors were no longer deterministic per table
  - different requests failed on different queries within the same repository
  - the failures consistently appeared inside `Promise.all(...)` batches in public read repositories
- Interpreted the pattern as a likely serverless/pooler stability issue rather than a schema mismatch:
  - one page load triggers multiple public endpoints simultaneously
  - each endpoint previously issued 2 to 7 concurrent Drizzle reads
  - this creates a large query burst against Supabase from short-lived Vercel functions
- Added [runDbRead.ts](./lib/db/runDbRead.ts):
  - wraps read operations
  - retries once with a short backoff
  - suitable for idempotent public read paths
- Updated the following repositories to stop batching all reads in `Promise.all(...)` and to execute them via `runDbRead(...)`:
  - [aboutRepository.ts](./lib/db/repositories/aboutRepository.ts)
  - [profileRepository.ts](./lib/db/repositories/profileRepository.ts)
  - [skillsRepository.ts](./lib/db/repositories/skillsRepository.ts)
  - [experiencesRepository.ts](./lib/db/repositories/experiencesRepository.ts)
  - [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts)
- Goal:
  - reduce transient pool contention on Vercel
  - make public content reads less bursty and more tolerant of temporary connection/query instability
## 2026-03-15 00:35 CET - Added explicit Postgres statement timeout for hung Vercel requests

- Observed that `GET /api/profile?lang=it` could remain pending for more than 25 seconds with no response body, while [health.ts](./api/health.ts) continued to return `200`.
- This indicated that some public DB-backed requests were no longer failing fast, but instead hanging inside the DB client / pooler path.
- Updated [client.ts](./lib/db/client.ts) again to make the DB behavior stricter in serverless:
  - `ssl: 'require'`
  - `connection.statement_timeout: 8000`
- Purpose:
  - prevent public functions from hanging indefinitely on a stalled DB query
  - turn indefinite waits into explicit Postgres-side failures that surface in logs
  - improve diagnosability if the pooler or connection string is still not ideal in production
## 2026-03-15 00:45 CET - Removed infinite front-end loading gate on partial profile failure

- Observed that the live site could remain stuck on `Caricamento contenuti...` even when several API endpoints were already returning `200` or `304`.
- Root cause on the client side:
  - [App.tsx](./src/App.tsx) gated the home route on `heroReady`
  - `heroReady` required a non-empty profile payload
  - if `/api/profile` failed, timed out, or returned a non-OK response during bootstrap, the app could stay blocked indefinitely even though the rest of the page was renderable with fallbacks
- Applied the following UI resilience fixes:
  - removed the `heroReady` hard gate from [App.tsx](./src/App.tsx)
  - added `cache: 'no-store'` to initial content/profile fetches to avoid ambiguous browser-side revalidation behavior during bootstrap
  - added an 8-second request timeout to:
    - [ProfileContext.tsx](./src/context/ProfileContext.tsx)
    - [ContentContext.tsx](./src/context/ContentContext.tsx)
- Goal:
  - render the homepage with graceful fallbacks instead of keeping the entire UI behind an infinite loading gate
  - make client bootstrap deterministic even when one API request is slow or temporarily fails
## 2026-03-15 10:20 CET - Removed temporary retry layers after production stabilization

- Reviewed the emergency mitigations added during the Vercel recovery and removed the parts that no longer looked necessary once production stabilized.
- Simplified the public Drizzle repositories:
  - removed [runDbRead.ts](./lib/db/runDbRead.ts)
  - removed the single-retry wrapper around public read queries
  - kept the sequential query execution model introduced for lower DB burstiness
- Simplified [ContentContext.tsx](./src/context/ContentContext.tsx):
  - removed per-request retry counters
  - removed the extra delayed retry pass for `projects` and `skills`
  - kept request timeouts and `cache: 'no-store'` during bootstrap
- Intention:
  - retain the structural fixes that improved stability
  - remove “panic-mode” retry layers that added complexity and made behavior harder to reason about
## 2026-03-15 10:40 CET - Silenced dotenv runtime noise in production logs

- Observed that some successful Vercel requests were visually flagged by noisy runtime messages even when the HTTP status was `200`.
- Confirmed that part of the noise came from `dotenv` itself, which was printing informational tips such as:
  - `injecting env (0) from .env`
  - miscellaneous `dotenvx` tips
- Updated the environment loading calls to use `quiet: true` in:
  - [client.ts](./lib/db/client.ts)
  - [adminAuthRepository.ts](./lib/db/repositories/adminAuthRepository.ts)
  - [drizzle.config.ts](./drizzle.config.ts)
- Outcome:
  - successful requests should no longer be visually polluted by `dotenv`'s informational output
  - the remaining `DEP0169` warning appears unrelated to the application code itself and is likely emitted by a dependency or the hosting/runtime layer rather than by the repository logic
## 2026-03-15 11:59 CET - Began migrating the generic admin CRUD path to a schema-driven Drizzle registry

- Reworked [adminTables.ts](./lib/adminTables.ts) from a metadata-only map into a schema-driven registry backed by the Drizzle table objects from [schema.ts](./lib/db/schema.ts).
- The admin registry now stores, for every allowed table:
  - the Drizzle table object itself
  - the public admin metadata already used by the dashboard (`label`, `primaryKeys`, `defaultRow`)
  - a generated mapping between Drizzle property keys and DB column names
  - a `columnsByDbName` index so the admin layer can keep speaking `snake_case` to the frontend while using Drizzle internally
- Reworked [adminTableRepository.ts](./lib/db/repositories/adminTableRepository.ts) to replace generic raw SQL CRUD with Drizzle operations:
  - `db.select().from(...)`
  - `db.insert(...).values(...).returning()`
  - `db.update(...).set(...).where(...).returning()`
  - `db.delete(...).where(...)`
- The repository now performs a bidirectional mapping:
  - incoming admin payloads remain `snake_case` and are converted to Drizzle property keys before insert/update
  - outgoing rows are converted back to DB-style `snake_case` so [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) can remain unchanged
- Hardened [adminTableService.ts](./lib/services/adminTableService.ts) so admin `row` and `keys` payloads are now validated against the registry's known columns before reaching the repository.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - read-only runtime test against the new admin Drizzle path returned valid `snake_case` rows for:
    - `profile`
    - `profile_i18n`
  - `npm run build` passed when executed from the repository root [repository root](./); the old `mik1810.github.io` path still behaves like the previously noted junction/alias and can trigger a Vite output-path error unrelated to this admin change
## 2026-03-15 12:06 CET - Added per-table payload adapters and validators to the admin Drizzle registry

- Extended [adminTables.ts](./lib/adminTables.ts) again so the admin registry is no longer just table-aware, but also payload-aware.
- Added field-level rules in the registry for each admin table, covering the main input classes used by the dashboard:
  - positive integer IDs and `order_index`
  - locale validation (`it`, `en`)
  - required trimmed text fields
  - nullable text fields normalized from `''` to `null`
  - URL/path validation for media and link columns
  - boolean coercion/validation
  - optional email validation
  - optional hex color validation (e.g. `logo_bg`, `color`)
- Hardened [adminTableService.ts](./lib/services/adminTableService.ts) to consume those registry rules before delegating to the repository:
  - `keys` payloads are now restricted to declared primary keys only
  - `row` payloads are normalized and validated column by column using the per-table rules
  - `PATCH` requests now strip primary key columns from the update payload, so keys are used only in `WHERE` and not accidentally propagated into `SET`
- This keeps the admin UI generic, but moves more semantic knowledge about the data model into the backend registry, which is a better fit for a future fully schema-driven admin layer.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)
  - runtime validation checks confirmed that invalid admin inputs are now rejected before hitting the DB, e.g.:
    - invalid `email`
    - unsupported `locale`
## 2026-03-15 12:12 CET - Split the admin Drizzle registry into domain modules

- Refactored the now-large [adminTables.ts](./lib/adminTables.ts) into a modular structure under [lib/admin/](./lib/admin/).
- New shared modules:
  - [registry.ts](./lib/admin/registry.ts)
    - centralizes the schema-driven `createAdminTableConfig(...)` builder
    - keeps the Drizzle-column discovery / `columnsByDbName` generation in one place
  - [rules.ts](./lib/admin/rules.ts)
    - centralizes reusable admin field rules such as:
      - `positiveIdRule`
      - `orderIndexRule`
      - `localeRule`
      - URL/email/color validators
      - required/optional text normalizers
- Split table definitions by domain:
  - [profileTables.ts](./lib/admin/tables/profileTables.ts)
  - [projectTables.ts](./lib/admin/tables/projectTables.ts)
  - [experienceTables.ts](./lib/admin/tables/experienceTables.ts)
  - [skillTables.ts](./lib/admin/tables/skillTables.ts)
- [adminTables.ts](./lib/adminTables.ts) is now only a thin aggregator that merges the domain registries and exposes `getAdminTableConfig(...)`.
- Effect:
  - no behavior change in the admin API or dashboard
  - the admin schema-driven layer is now much easier to read and extend
  - future improvements can target one domain module at a time instead of editing a single monolithic file
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)
## 2026-03-15 12:19 CET - Grouped the admin sidebar into collapsible macro-sections

- Extended the admin table metadata contract so the backend now exposes grouped table definitions instead of a flat list only.
- Added shared group metadata in [groups.ts](./lib/admin/groups.ts) for the four current admin macro-sections:
  - `profile`
  - `projects`
  - `experiences`
  - `skills`
- Updated the admin registry builder in [registry.ts](./lib/admin/registry.ts) so each domain registry is decorated with its group key via `attachAdminGroup(...)`.
- Updated [adminTableService.ts](./lib/services/adminTableService.ts) so `/api/admin/tables` now returns:
  - `group`
  - `groupLabel`
  in addition to the existing `name`, `label`, `primaryKeys`, and `defaultRow`.
- Updated the frontend admin contract in [app.ts](./src/types/app.ts) to include those new fields.
- Reworked the sidebar in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx):
  - tables are now grouped by backend-provided macro-section
  - each section has a collapsible header with a rotating arrow
  - the section containing the active table auto-expands
  - the flat table list has been replaced by nested table items under each group
- Updated [AdminAuth.css](./src/components/css/AdminAuth.css) to support:
  - group headers
  - counters per group
  - nested table lists
  - arrow rotation / expanded state styling
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)
  - direct runtime check of `getAdminTablesList()` confirmed grouped metadata is returned correctly for the admin UI
## 2026-03-15 12:26 CET - Added a hero skeleton to avoid empty public content during bootstrap

- While checking the local DX flow, noticed that the public page could briefly show an empty-looking hero before the `profile` payload finished loading, especially when the API process was not already warm.
- Updated [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx) to render a dedicated `HeroTypingSkeleton` while `profile` is still loading and no profile data is available yet.
- The skeleton mirrors the real hero layout instead of falling back to a blank role line:
  - greeting placeholder
  - name placeholder
  - role placeholder
  - university badge placeholder
  - CTA button placeholders
  - social icon placeholders
  - circular portrait placeholder
- Added the corresponding shimmer styles in [HeroTyping.css](./src/components/css/HeroTyping.css), including responsive sizing so the skeleton matches both desktop and mobile hero layouts.
- Intent:
  - keep the first paint visually stable
  - avoid the perception that the public hero is “empty” while local/public bootstrap is still fetching `profile`
  - let the typing animation start only once real data is present
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 12:41 CET - Added inline hero placeholders during the typing bootstrap phase

- After the first skeleton pass, noticed a second UX gap: once `profile` arrived, the hero immediately switched to the typing animation, which could still leave the page visually half-empty for a moment because only the greeting rendered first.
- Refined [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx) so the hero now shows inline shimmer placeholders while the typing animation is warming up:
  - name placeholder until the first visible name characters are present
  - role placeholder until the role animation becomes visible
  - university badge placeholder until the hero header is ready
  - CTA and socials placeholders until the name phase completes
- Reused the shimmer system in [HeroTyping.css](./src/components/css/HeroTyping.css) with inline variants sized specifically for the name/role/badge rows, so the page no longer looks empty between fetch completion and the first typed frames.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 12:49 CET - Removed the global home loading gate so hero skeletons render immediately

- Found that the remaining reason the hero skeleton was not visible "right at page load" was not inside the hero component anymore, but in [App.tsx](./src/App.tsx): the home route was still being blocked by a full-screen `Caricamento contenuti...` gate while profile/content providers bootstrapped.
- Removed the global home loading gate and the related boot-delay logic, so the public route mounts immediately and lets section-level placeholders/fallbacks render as soon as the page is painted.
- Kept the reveal observer logic, but scoped it directly to the home route instead of waiting for the old full-screen gate to release.
- Result:
  - the hero skeleton can now appear immediately on refresh
  - the page no longer hides the public UI behind a global blocking loader
  - later section-specific placeholders can now be added incrementally without fighting a route-level gate
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 12:57 CET - Made the hero skeleton depend on actual hero data instead of the loading flag

- After removing the route-level gate, local refreshes still showed a brief `Hi, I'm` frame before the skeleton, which meant the user-visible issue was no longer the global loader but the hero deciding too early to render fallback text.
- Updated [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx) so the hero now renders the skeleton whenever the critical hero payload is not available yet, using `profile.name` as the readiness boundary instead of relying only on `loading`.
- This makes the initial paint deterministic:
  - no fallback greeting-only frame
  - skeleton first
  - then typed hero once the actual profile payload is present
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 13:10 CET - Extended section-level skeletons across the public landing page

- After confirming the hero skeleton behavior, extended the same loading-language to the rest of the public sections so the homepage no longer drops from "real content" to empty boxes while the page bootstrap finishes.
- Added a shared skeleton base stylesheet in [SectionSkeletons.css](./src/components/css/SectionSkeletons.css) and imported it from [App.tsx](./src/App.tsx) to keep shimmer behavior and placeholder primitives consistent across sections.
- Updated public sections with section-appropriate placeholders:
  - [About.tsx](./src/components/jsx/About.tsx): bio paragraph skeleton lines + interest chip skeletons
  - [Projects.tsx](./src/components/jsx/Projects.tsx): project card skeletons + featured GitHub card skeletons with media placeholders
  - [Experience.tsx](./src/components/jsx/Experience.tsx): timeline item skeletons for both work experience and education
  - [Skills.tsx](./src/components/jsx/Skills.tsx): tech stack blocks + skill category card skeletons
  - [Contact.tsx](./src/components/jsx/Contact.tsx): contact info + form field skeletons while profile contact data is still unavailable
- Added the related section-specific layout tweaks in:
  - [About.css](./src/components/css/About.css)
  - [Projects.css](./src/components/css/Projects.css)
  - [Experience.css](./src/components/css/Experience.css)
  - [Skills.css](./src/components/css/Skills.css)
  - [Contact.css](./src/components/css/Contact.css)
- Result:
  - the homepage now mounts immediately
  - hero, content sections and contact block all communicate loading state visually
  - layout shifts are reduced because each section reserves a shape close to the final rendered content
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 13:18 CET - Simplified hero reveal so static hero content appears together

- The previous hero logic still staged the loaded content too aggressively: even after the skeleton ended, the user could see the greeting first and wait for the name/badge/actions/socials to catch up.
- Updated [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx) so the loaded hero now behaves like this:
  - the full name is rendered immediately once profile data is present
  - university badge, CTA buttons and social links appear together with the name
  - only the role line keeps the typing animation
- Also slightly sped up the role typing timings to make the hero feel less sluggish after the skeleton phase.
- Result:
  - `Hi, I'm`
  - `Michael Piccirilli`
  - university badge
  - buttons
  - socials
  are now visible together as soon as the hero leaves skeleton mode
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 13:24 CET - Fixed About section to use a real bio-data boundary instead of a missing i18n fallback key

- While validating the new section-level skeletons, noticed that the About section could briefly render the literal string `about.bio` before the profile query completed.
- Root cause:
  - [About.tsx](./src/components/jsx/About.tsx) still fell back to `t('about.bio')`
  - that translation key does not exist in [staticI18n.json](./src/data/staticI18n.json)
  - so the UI showed the raw key instead of keeping the bio skeleton visible
- Updated the About section to treat `profile.bio` itself as the readiness signal:
  - no more missing-key fallback
  - the bio skeleton stays visible until the real bio text is available
  - once the profile payload arrives, the section swaps directly from skeleton to actual content
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 13:31 CET - Moved all public section skeletons to data-readiness boundaries

- After fixing About, applied the same approach to the rest of the public landing page so skeleton visibility is driven by the actual section payloads instead of by provider loading flags alone.
- Updated the public sections as follows:
  - [About.tsx](./src/components/jsx/About.tsx): interests now stay in skeleton mode until actual interest data exists
  - [Projects.tsx](./src/components/jsx/Projects.tsx): project and featured GitHub skeletons now depend on the presence of loaded project arrays
  - [Experience.tsx](./src/components/jsx/Experience.tsx): experience and education skeletons now depend on real timeline data instead of the shared content loading flag
  - [Skills.tsx](./src/components/jsx/Skills.tsx): tech stack and skill-category skeletons now wait for their own actual data collections
  - [Contact.tsx](./src/components/jsx/Contact.tsx): the contact block remains in skeleton mode until profile email and location are both present, instead of falling back to placeholder copy too early
- Intent:
  - avoid literal fallback text appearing before API data arrives
  - keep section rendering deterministic on refresh
  - make the full public page behave like the hero: skeleton first, real content only when the section is actually ready
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 13:39 CET - Restricted the hero role skeleton to bootstrap only

- The role line in the hero still had one UX bug: when the typing animation deleted back down to zero characters between role cycles, the inline skeleton briefly reappeared, which made the animation look like a loading state even though data was already present.
- Updated [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx) so the role skeleton is now shown only before the role has been rendered for the first time.
- Once at least one real role character has appeared, subsequent delete/retype cycles stay purely textual and never fall back to the skeleton again.
- Result:
  - skeleton only during initial hero bootstrap
  - normal typing/deleting loop afterward
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 14:02 CET - Made the admin editor field-type aware using registry metadata

- Returned to the admin improvements track and connected the schema-driven registry to the dashboard editor, so the UI no longer treats every editable field as a generic textarea.
- Extended the admin registry/type system with explicit editor metadata:
  - [lib/types/admin.ts](./lib/types/admin.ts)
  - [lib/admin/registry.ts](./lib/admin/registry.ts)
  - [lib/admin/rules.ts](./lib/admin/rules.ts)
- Exposed field definitions from the admin tables service:
  - [lib/services/adminTableService.ts](./lib/services/adminTableService.ts)
  - [src/types/app.ts](./src/types/app.ts)
- Updated admin table definitions to mark richer editors where they add actual value:
  - locale fields -> select
  - boolean fields -> checkbox
  - URL/email fields -> typed inputs
  - `bio` / `description` fields -> textarea
  - `logo_bg` / `color` fields -> color-aware editor
  - `icon_key` for socials -> select with the supported icon set
- Refined [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so:
  - table columns prefer registry field order/labels
  - the editor renders typed controls instead of generic textareas
  - the dashboard still preserves the current generic CRUD flow
- Added the required styling in [AdminAuth.css](./src/components/css/AdminAuth.css).
- Result:
  - cleaner editing UX
  - less manual parsing of booleans/numbers/URLs/locales
  - stronger reuse of backend registry knowledge in the frontend admin
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 14:11 CET - Removed the language toggle from the admin navbar

- The admin UI is currently intentionally Italian-only, so keeping the public language toggle visible in the admin navbar created a misleading control that did not provide real value.
- Updated [Navbar.tsx](./src/components/jsx/Navbar.tsx) so the `LanguageSwitcher` is rendered only on non-admin routes.
- Result:
  - the public landing page still supports the language toggle
  - the admin section keeps only the controls that are actually meaningful there
  - the admin navbar is less noisy and better aligned with the current product intent
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 14:18 CET - Added color swatches in admin table cells

- Improved the admin data grid so columns that use the `color` editor metadata now display a small visual swatch next to the stored hex value.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) to render color-aware cells using the field metadata already exposed by the schema-driven admin registry.
- Added the corresponding styles in [AdminAuth.css](./src/components/css/AdminAuth.css), including a fallback "empty" swatch appearance when the current value is not a valid hex color.
- Result:
  - color fields are easier to scan in the admin list view
  - users do not need to mentally parse hex strings to understand the stored color
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 14:24 CET - Hid the redundant row-number column when `id` is already visible

- Some admin tables were showing both the generic `#` row-number column and a visible `id` column, which duplicated essentially the same identifier signal.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so the `#` column is now rendered only when the current table does not already expose `id` among its visible columns.
- Result:
  - tables with a real `id` stay cleaner
  - tables without a visible `id` still keep a convenient positional row marker
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 14:36 CET - Added skeleton states to the admin bootstrap and dashboard

- Extended the admin UI with actual skeleton states so it no longer falls back to plain `Caricamento...` text while session and table data are still bootstrapping.
- Added a reusable full-page admin shell skeleton in [AdminDashboardSkeleton.tsx](./src/components/jsx/AdminDashboardSkeleton.tsx).
- Updated [RequireAdmin.tsx](./src/components/jsx/RequireAdmin.tsx) so the admin route now shows the skeleton shell during the auth/session check instead of a centered text message.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so:
  - the initial admin load uses the full dashboard skeleton while table metadata is still loading
  - row loading inside a selected table renders skeleton rows instead of a single textual loading row
  - stale rows are cleared as soon as a new table load starts, making the loading state visually coherent during table switches
- Extended [AdminAuth.css](./src/components/css/AdminAuth.css) with:
  - shimmer animation primitives
  - sidebar/group skeleton blocks
  - table/header/action skeletons
  - editor-panel skeleton fields
- Result:
  - the admin now mirrors the public-side loading language
  - route bootstrap, sidebar loading and row loading all feel materially more polished
  - admin users see structure first, not abrupt text-only placeholders

## 2026-03-15 14:48 CET - Added relation-aware selects for admin foreign keys

- Extended the schema-driven admin metadata so editable foreign-key fields can carry relation information instead of behaving like plain numeric inputs.
- Added `relation` metadata to the admin field editor contracts in:
  - [lib/types/admin.ts](./lib/types/admin.ts)
  - [src/types/app.ts](./src/types/app.ts)
- Added a reusable helper in [rules.ts](./lib/admin/rules.ts) to decorate existing validation rules as relation-backed selects via `withRelationSelect(...)`.
- Updated the admin table registries so foreign-key fields now declare the target table and label strategy, for example:
  - `project_id -> projects.slug`
  - `github_project_id -> github_projects.slug`
  - `experience_id -> experiences.slug`
  - `education_id -> education.slug`
  - `tech_category_id -> tech_categories.slug`
  - `profile_id -> profile.full_name`
- Reworked [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so:
  - foreign keys are still hidden from the list grid
  - but they are now visible in the editor
  - relation-backed fields automatically fetch options from `/api/admin/table`
  - the editor renders them as real `<select>` controls instead of free numeric text inputs
- Result:
  - editing localized/child rows is less error-prone
  - users no longer need to remember numeric parent ids manually
  - the admin remains generic, but its UX is now meaningfully more schema-aware
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the repository root [repository root](./)

## 2026-03-15 14:55 CET - Vertically centered admin sidebar item labels

- Refined the sidebar table-item styling in [AdminAuth.css](./src/components/css/AdminAuth.css) so item labels are vertically centered inside the left admin menu.
- Updated `.admin-table-item` to use a flex row with `align-items: center`, a stable minimum height, and tighter line-height control.
- Result:
  - sidebar labels now sit visually centered inside each table button
  - the left admin navigation feels more consistent with the rest of the dashboard controls

## 2026-03-15 14:58 CET - Aligned admin group labels with their count badges

- Refined the grouped sidebar toggle layout in [AdminAuth.css](./src/components/css/AdminAuth.css).
- Updated `.admin-group-toggle-main` from a plain flex row with `align-items: flex-start` to a two-column grid with centered cross-axis alignment.
- Result:
  - group labels now align visually with the circular table-count badge
  - multi-line labels like `Esperienze e Formazione` still wrap correctly without pulling the badge upward

## 2026-03-15 15:04 CET - Exposed relation-backed key fields in the admin editor

- While validating the new foreign-key selects, found that the admin editor was still filtering out all primary-key fields.
- This meant relation-backed fields such as `project_id` in `projects_i18n` were correctly described in the registry, but still invisible in the modal because they are also part of a composite primary key.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so:
  - editable key fields now remain visible in the editor
  - primary-key fields become read-only when editing an existing row
  - create flows can still populate the required composite-key values
- Result:
  - relation-backed selects are now actually visible in the admin UI
  - composite-key tables remain safe because key fields cannot be mutated during updates
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 15:11 CET - Split the admin editor into reference and editable-content sections

- Refined the admin row modal in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so the form is no longer a single flat list of fields.
- The editor now separates:
  - `Riferimenti relazionali e chiavi`
  - `Contenuto e proprietà modificabili`
- Added supporting styles in [AdminAuth.css](./src/components/css/AdminAuth.css) for:
  - section headers
  - explanatory helper text
  - a visual divider between references and editable content
- Result:
  - relation/key fields are easier to distinguish from the real editable payload
  - composite-key and foreign-key rows are much clearer to edit

## 2026-03-15 15:22 CET - Added bilingual create mode for `*_i18n` admin tables

- Extended the admin create flow so translation tables with a composite key including `locale` can be inserted in both languages at once.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so create mode for `*_i18n` tables now:
  - keeps shared relation/key fields in the top reference section
  - hides the single-locale selector during creation
  - renders two locale cards for the localized content:
    - `Italiano`
    - `English`
  - submits a single dual payload that creates the `it` and `en` rows together
- Updated [api/admin/table.ts](./api/admin/table.ts), [adminTableService.ts](./lib/services/adminTableService.ts), and [adminTableRepository.ts](./lib/db/repositories/adminTableRepository.ts) so the admin create endpoint now supports `rows: [...]` bulk insert payloads in addition to the legacy single-row payload.
- Refined relation-select fallback labels in the editor so a loading foreign-key field no longer degrades to a bare `1`, but shows a clearer "record collegato" placeholder while options are still loading.
- Added the supporting modal layout styles in [AdminAuth.css](./src/components/css/AdminAuth.css).
- Result:
  - `projects_i18n`, `github_projects_i18n`, `profile_i18n`, `experiences_i18n`, `education_i18n`, and similar translation tables can now be created in both locales in one pass
  - the relation dropdown UX is less ambiguous while option lists are still bootstrapping

## 2026-03-15 15:29 CET - Added icon previews next to admin `icon_key` values

- Extended the admin cell renderer in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so icon fields such as `icon_key` now show a visual preview next to the stored key, in the same spirit as the color swatch previews already present for hex color fields.
- Reused the shared icon map from [icons.tsx](./src/data/icons.tsx) so the admin preview matches the same SVGs used elsewhere in the app.
- Added the related styling in [AdminAuth.css](./src/components/css/AdminAuth.css), including an empty-state fallback when the key does not resolve to a known icon.
- Result:
  - `github` and `linkedin` values are immediately recognizable in the admin grid
  - icon-like fields are easier to scan, just like color fields

## 2026-03-15 15:36 CET - Added PDF and image previews for admin URL fields

- Extended the admin URL rendering in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so URL-like fields now detect common previewable assets:
  - PDF URLs show a compact PDF badge/icon
  - image URLs show a thumbnail preview
- Applied the preview logic both to:
  - admin table cells
  - admin editor URL inputs
- In the editor the input remains textual, but image and PDF previews are now displayed alongside the field so the user can validate the asset without leaving the modal.
- Added the related styles in [AdminAuth.css](./src/components/css/AdminAuth.css), including:
  - thumbnail preview cards for images
  - PDF badges
  - responsive stacking in the editor on narrow screens
- Result:
  - `photo_url`, `logo`, `image_url`, `cv_url`, and similar fields are much easier to inspect
  - media-heavy tables now communicate their content visually instead of only exposing raw URLs

## 2026-03-15 15:42 CET - Compacted admin media cells to preview-only with hover path

- Refined the admin grid media rendering so image and PDF URL cells no longer show the raw path inline when a visual preview is already available.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so image/PDF cells now:
  - render only the thumbnail/document preview in the table
  - expose the full underlying path through the hover `title`
- Also simplified the PDF badge to a pure document icon, removing the explicit `PDF` text.
- Result:
  - `photo_url`, `cv_url`, and `university_logo_url` style fields are more compact in the grid
  - the full path remains inspectable on hover without making the table visually noisy

## 2026-03-15 16:06 CET - Added nested admin submenus and compact icon/media previews

- Completed the admin table metadata refactor so every registry entry now exposes both a top-level `group` and a domain-specific `subgroup`, reusing the existing Drizzle-backed registry while making the sidebar navigation deeper and easier to scan.
- Updated the admin table definitions in:
  - [profileTables.ts](./lib/admin/tables/profileTables.ts)
  - [projectTables.ts](./lib/admin/tables/projectTables.ts)
  - [experienceTables.ts](./lib/admin/tables/experienceTables.ts)
  - [skillTables.ts](./lib/admin/tables/skillTables.ts)
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so the left sidebar now renders a two-step navigation:
  - top-level groups such as `Profilo e About`
  - nested submenus such as `Profile`, `Hero roles`, `About interests`
  - individual tables under each submenu, e.g. `Profile i18n`
- Simplified relation-field fallback labels so unresolved references no longer show the verbose `record collegato ... (caricamento...)` placeholder and instead degrade to a minimal `#id` until the label is resolved.
- Added devicon-aware rendering to the admin grid/editor:
  - `devicon` values now render as the actual icon using the same CDN path convention already used in the public `Skills` section
  - the stored devicon path/name remains inspectable via hover tooltip
- Reduced the visual size of admin previews:
  - image/PDF thumbnails were compacted
  - icon previews were reduced
  - editor preview rows were tightened without removing the textual inputs
- Added the supporting nested-menu and compact-preview styling in [AdminAuth.css](./src/components/css/AdminAuth.css).
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository root `.`

## 2026-03-15 16:18 CET - Reworked admin submenus around root table families

- Refined the nested admin sidebar so submenus are no longer modeled as a generic label plus a duplicate first child such as `Projects -> Projects`.
- The sidebar now treats each submenu as the root entity family inferred from the foreign-key structure:
  - clicking the submenu itself selects the root/base table
  - nested items only render the related child tables, such as `Projects i18n`, `Project tags`, `GitHub project images`, or `Social links`
- Realigned the `Skills e Tech Stack` domain so submenus are now based on real data roots instead of broad topical buckets:
  - `Tech categories`
  - `Skill categories`
- Updated:
  - [skillTables.ts](./lib/admin/tables/skillTables.ts)
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
- Result:
  - the submenu hierarchy now reads like entity family -> related tables
  - duplicated labels such as `Projects -> Projects` are gone
  - the structure is more obviously tied to the actual foreign-key graph
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 16:27 CET - Bound submenu labels to root table families

- Refined the nested admin sidebar so submenu titles are now taken from the actual root table of each family rather than from a parallel subgroup label string.
- This makes the hierarchy more robust and better aligned with the foreign-key graph:
  - the submenu title always matches the selected root table
  - child tables remain the dependent/translation tables under that root
- Updated:
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
- Result:
  - submenu labels no longer risk rendering blank or drifting away from the real root entity
  - the left navigation reads more consistently across all admin groups
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 16:36 CET - Aligned admin submenus with semantic table families

- Refined the submenu grouping logic so it no longer forces every foreign-key descendant under the same root family.
- The admin navigation now prefers semantic table families:
  - a base entity stays paired with its natural extension tables, such as its `*_i18n` rows
  - standalone child collections with their own distinct role stay separate, even if they still reference another table through a foreign key
- Updated:
  - [profileTables.ts](./lib/admin/tables/profileTables.ts)
  - [skillTables.ts](./lib/admin/tables/skillTables.ts)
- Result:
  - `Profile` now pairs only with `Profile i18n`
  - `Social links` is now its own submenu
  - `Tech items` and `Skill items` are also separated into their own families instead of being folded into category roots
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 16:45 CET - Moved leaf-only admin submenus to the bottom of each group

- Refined the nested admin sidebar ordering so submenu roots that do not expose any child tables are now rendered after the submenus that do have nested items.
- This keeps each parent group easier to scan:
  - first the expandable entity families
  - then the standalone/leaf submenu roots
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) to sort subgroup entries by child-table count while preserving the existing order inside each category.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 16:54 CET - Restricted accent highlighting to the actually selected admin entry

- Refined the admin sidebar visual states so expansion and selection are no longer conflated.
- Updated:
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
- Changes:
  - a submenu root now gets the active accent state only when its own root table is the selected table
  - child table buttons keep the accent state only when that exact table is selected
  - expanded but non-selected groups/subgroups now use a neutral visual state instead of the accent color
- Result:
  - the accent color now communicates selection instead of mere openness
  - it is easier to spot the currently selected submenu/table at a glance
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:02 CET - Made top-level admin groups navigate to a real selection

- Refined the admin sidebar group behavior so clicking a top-level group no longer just expands/collapses the section while leaving the previous table selected.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so clicking a top-level group now:
  - opens the group
  - selects the first root table in that group
  - expands the corresponding subgroup
- Result:
  - the active accent/border now move with the user’s navigation intent
  - switching from one domain to another immediately updates the selected admin context
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 17:10 CET - Split admin sidebar navigation from open/close toggling

- Refined the admin sidebar interaction model so expanding/collapsing and navigating are no longer coupled on the same click target.
- Updated [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx):
  - clicking the main body of a parent group or submenu still navigates to its root table
  - clicking the chevron arrow now only expands/collapses that level
- Result:
  - parent groups and submenus can now be closed even when a table inside them is currently selected
  - navigation intent and disclosure intent are easier to control
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:16 CET - Restricted submenu closing to the chevron toggle only

- Refined the submenu root click behavior in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so clicking the submenu body no longer collapses it when its root table is already selected.
- Submenu roots now behave consistently:
  - body click: navigate/select the root table and keep the submenu open
  - chevron click: expand/collapse the submenu
- Result:
  - collapsing is now reserved to the dedicated `v` toggle
  - navigation clicks do not unexpectedly close the current submenu
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:23 CET - Prevented top-level group clicks from auto-selecting child tables

- Refined the top-level admin group behavior in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so clicking a grandparent group no longer auto-selects the first root table of the first submenu.
- The interaction model is now:
  - group body click: open the group only
  - group chevron click: expand/collapse the group
  - submenu body click: select the submenu root table
  - submenu chevron click: expand/collapse the submenu
- Result:
  - opening a top-level domain no longer forces the user into a child table immediately
  - selection remains a submenu/table concern instead of a grandparent concern
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:31 CET - Kept admin parent groups collapsed on first entry

- Refined the initial admin dashboard state in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx) so top-level parent groups and subgroups no longer auto-expand on first load.
- The dashboard now starts with:
  - the default table still loaded in the content panel
  - all grandparent groups collapsed in the sidebar
  - all submenu levels collapsed as well
- Result:
  - entering `/admin` no longer opens the left navigation automatically
  - expansion is now entirely user-driven from the first interaction onward
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:38 CET - Fixed grandparent chevron clicks so groups can collapse without changing content

- Fixed the admin sidebar chevron click detection in [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx).
- Root cause:
  - chevron clicks often originate from SVG nodes (`svg` / `path`)
  - the previous guard only recognized `HTMLElement`, so those clicks were incorrectly treated as body clicks
- The guard now accepts any DOM `Element`, which means clicking the grandparent chevron correctly toggles the group open/closed.
- Result:
  - top-level groups can now be closed again
  - the central content panel keeps showing the previously selected table
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:52 CET - Polished admin table readability, link icons, and navbar identity loading

- Added descriptive metadata to the admin table registry so content-light helper tables can explain their role directly in the admin UI.
- Updated:
  - [lib/types/admin.ts](./lib/types/admin.ts)
  - [lib/admin/registry.ts](./lib/admin/registry.ts)
  - [lib/services/adminTableService.ts](./lib/services/adminTableService.ts)
  - [src/types/app.ts](./src/types/app.ts)
  - [profileTables.ts](./lib/admin/tables/profileTables.ts)
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
  - [Navbar.tsx](./src/components/jsx/Navbar.tsx)
  - [Navbar.css](./src/components/css/Navbar.css)
- Result:
  - `Hero roles` and `About interests` now explain in the header that they only manage ordering while localized text lives in the corresponding `*_i18n` tables
  - `live_url` cells now render as a generic link icon with hover tooltip
  - `github_url` cells now render as a GitHub icon with hover tooltip
  - admin image/PDF previews, color swatches, icons, and action buttons were resized to feel more coherent in the grid
  - table rows are vertically centered more consistently
  - the admin navbar now shows a skeleton placeholder while the identity/email is still loading, instead of the raw `email` placeholder text
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 18:00 CET - Clarified structural skill tables in the admin UI

- Extended the same “structural table” treatment already used for `Hero roles` and `About interests` to the skill scaffolding tables.
- Updated [skillTables.ts](./lib/admin/tables/skillTables.ts) so:
  - `Skill categories` now explains that it only controls ordering, while the visible category names live in `Skill categories i18n`
  - `Skill items` now explains that it controls ordering inside a category, while the visible labels live in `Skill items i18n`
- Result:
  - these tables are less confusing when they mostly expose structural fields such as `order_index`
  - the admin now communicates more clearly which companion table contains the visible content
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 18:09 CET - Rebalanced admin table column widths by content type

- Refined the admin table layout so columns no longer all share the same generic width profile.
- Updated:
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
- The table now assigns width classes by content type:
  - short keys / ids
  - media and link/icon cells
  - swatch/icon columns
  - title/name fields
  - long copy fields such as `description` and `bio`
  - email fields
- Result:
  - wide textual columns have more room
  - compact visual columns no longer waste horizontal space
  - the grid reads more proportionally across different admin tables
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 18:17 CET - Unified visual-cell sizing and moved color codes to hover

- Refined the admin grid rendering so purely visual cells behave consistently:
  - text remains left-aligned
  - visual-only cells are centered
- Updated:
  - [AdminDashboard.tsx](./src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
- Changes:
  - color cells now render only the swatch in the grid
  - the hex color value is available through hover `title`, not inline text
  - devicon previews now use the larger visual size already used by the other compact admin previews
  - large swatches/devicons are centered in their table cells
- Result:
  - color and icon cells feel more coherent with media and action controls
  - visual columns are easier to scan without exposing redundant raw values inline
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 19:18 CET - SESSION append-only correction and README realignment

- Corrected the logging practice for this session:
  - `SESSION.md` should be treated as an append-only log
  - some recent notes had been inserted earlier in the file instead of being appended at the end
  - from this point onward, new notes are appended only in the tail section
- Re-stated at the end of the log the current documentation status:
  - [README.md](./README.md) was rewritten in a more technical and paper-like style
  - the README now describes the current architecture as it actually exists, including:
    - public read plane
    - admin control plane
    - schema-driven admin backed by Drizzle
    - current runtime constraints on Vercel/Supabase
    - current limitations and next-step directions

## 2026-03-15 19:19 CET - Appended recap of GitHub project media lightbox work

- Refined the single-page `Projects` section with a clearer GitHub media model.
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
  - [Projects.css](./src/components/css/Projects.css)
  - [staticI18n.json](./src/data/staticI18n.json)
  - [app.ts](./src/types/app.ts)
- Changes:
  - GitHub project media now distinguishes better between:
    - real screenshot galleries
    - projects with no media available
  - added a lightbox/modal preview for GitHub screenshots
  - enlarged screenshots are rendered with `object-fit: contain`, so the preview avoids cropping the image content
  - the viewer supports close via backdrop, close button, and `Esc`
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 19:28 CET - Restricted GitHub media viewer opening to click only

- Adjusted the GitHub project media interaction model in the single-page `Projects` section.
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
  - [staticI18n.json](./src/data/staticI18n.json)
  - [app.ts](./src/types/app.ts)
- Changes:
  - removed automatic lightbox opening on hover
  - the media viewer now opens only on click (or keyboard activation)
  - added a dedicated hover hint label:
    - `Clicca per espandere`
    - `Click to expand`
- Result:
  - the preview interaction is more predictable
  - the enlarged viewer no longer opens accidentally while simply passing the pointer over a project card
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 19:34 CET - Moved GitHub media expand hint above the carousel controls

- Refined the GitHub project media hover hint placement in the single-page `Projects` section.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - moved the `Click to expand` hint from the bottom-right corner to the top-right corner of the media frame
  - adjusted the reveal motion so the pill now animates downward into place from the top
- Result:
  - the expand hint no longer competes visually with the bottom carousel dots/scroll indicator
  - the media overlay hierarchy is clearer on GitHub project cards

## 2026-03-15 19:38 CET - Removed redundant browser tooltip from GitHub media preview trigger

- Refined the GitHub project media interaction copy in the single-page `Projects` section.
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
- Changes:
  - removed the native browser `title` tooltip from the media trigger
  - kept the custom `Click to expand` / `Clicca per espandere` overlay as the only visible affordance
- Result:
  - avoids duplicate messaging under the cursor
  - keeps the interaction cleaner while preserving the accessible button label

## 2026-03-15 19:45 CET - Reduced GitHub media lightbox size and fixed bottom-edge cropping

- Refined the GitHub project lightbox layout in the single-page `Projects` section.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - reduced the overall lightbox footprint from an almost full-screen presentation to a more balanced viewport usage
  - changed the lightbox layout to a two-row grid (`meta + stage`) instead of relying on manual height subtraction
  - added inner padding to the media stage so screenshots no longer press against the frame edges
  - stopped forcing enlarged screenshots to `width: 100%` and `height: 100%`, leaving them to scale naturally within `object-fit: contain`
- Result:
  - the enlarged media viewer feels less oversized
  - screenshots keep their full proportions more reliably and avoid apparent clipping near the bottom edge

## 2026-03-15 19:49 CET - Hid the global scroll-to-top control while the GitHub media lightbox is open

- Refined cross-component interaction between the single-page GitHub media viewer and the global floating controls.
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
  - [ScrollToTop.css](./src/components/css/ScrollToTop.css)
- Changes:
  - added a temporary `github-project-lightbox-open` class on `document.body` while the portal lightbox is mounted
  - used that global state to hide and disable the `scroll-to-top` floating button during image preview
- Result:
  - the enlarged media viewer no longer competes with the global upward navigation control
  - the overlay feels more focused and modal in practice

## 2026-03-15 20:02 CET - Split Projects.tsx into focused portfolio and GitHub media components

- Refactored the single-page `Projects` section to reduce file size and separate responsibilities without changing behavior.
- Added:
  - [PortfolioProjectsGrid.tsx](./src/components/jsx/PortfolioProjectsGrid.tsx)
  - [GithubProjectsGrid.tsx](./src/components/jsx/GithubProjectsGrid.tsx)
  - [GithubProjectCard.tsx](./src/components/jsx/GithubProjectCard.tsx)
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
- Result:
  - `Projects.tsx` is now an orchestrator for the section instead of a monolithic file
  - portfolio cards, GitHub cards, media carousel, and modal viewer now evolve in smaller and more local components

## 2026-03-15 20:09 CET - Tightened GitHub media lightbox proportions and reduced excess side space

- Refined the GitHub screenshot viewer sizing after the component split.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - reduced the overall modal width and height so the viewer no longer feels overly wide
  - decreased the frame padding and corner radius to keep the screenshot visually closer to the container
  - slightly reduced the effective max size of the image so it sits more comfortably within the stage
- Result:
  - less unused side space around screenshots
  - a more compact modal presentation that should no longer suggest bottom-edge clipping

## 2026-03-15 20:18 CET - Smoothed the tilt interaction on portfolio project cards

- Refined the single-page portfolio project hover motion.
- Updated:
  - [PortfolioProjectsGrid.tsx](./src/components/jsx/PortfolioProjectsGrid.tsx)
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - replaced direct per-event transform updates with a `requestAnimationFrame`-scheduled tilt loop
  - cached the card bounds at hover start instead of re-reading layout on every mouse move
  - disabled the transform transition while the card is actively tilting, then restored the softer reset on mouse leave
- Result:
  - the portfolio card tilt is significantly less jittery and more responsive under pointer movement

## 2026-03-15 20:24 CET - Switched the GitHub lightbox to image-first sizing

- Refined the GitHub screenshot viewer to prioritize complete image visibility over filling a fixed frame.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - replaced the rigid fixed-size lightbox box with a more content-sized modal
  - constrained the screenshot itself directly with viewport-based max width and max height
  - allowed the stage to scroll instead of clipping if an edge case still exceeds the available space
- Result:
  - the enlarged screenshot should now fit in full inside the viewer
  - the modal wastes less width and behaves more like a true image preview than a decorative frame

## 2026-03-15 20:31 CET - Raised the GitHub lightbox above the navbar and moved navigation outside the image

- Refined the GitHub screenshot viewer layering and navigation layout.
- Updated:
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - increased the lightbox backdrop `z-index` above the navbar stack
  - added more outer backdrop padding so the modal no longer feels glued to the top edge
  - moved previous/next controls into a dedicated side-by-side media shell, outside the image itself
- Result:
  - the viewer behaves more like a true fullscreen modal overlay
  - navigation controls no longer cover screenshot content

## 2026-03-15 20:36 CET - Locked the GitHub projects section to a two-column desktop grid

- Refined the single-page GitHub projects layout to match the stronger skeleton presentation.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - replaced the `auto-fit` desktop grid with an explicit two-column layout
  - kept the section responsive by collapsing back to one column on narrower widths
- Result:
  - the live GitHub projects section now keeps the same more structured visual rhythm suggested by its skeleton state

## 2026-03-15 20:41 CET - Stabilized the GitHub lightbox shell size across different screenshots

- Refined the GitHub screenshot viewer so navigation controls no longer shift when switching images with different aspect ratios.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - restored a fixed responsive width/height for the outer lightbox shell
  - kept the screenshot itself in strict `contain` mode inside a flexible stage
  - made the media shell consume the available modal height consistently
- Result:
  - the modal frame should remain stable from image to image
  - previous/next controls should no longer jump as the active screenshot changes

## 2026-03-15 20:46 CET - Normalized no-media GitHub cards to the same media shell as real galleries

- Refined the GitHub project card layout for repositories without screenshots.
- Updated:
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - moved the no-media fallback into the same `.github-project-media` wrapper used by screenshot galleries
  - kept the same aspect ratio and removed extra fallback padding
- Result:
  - cards like `Image Processing` now align with screenshot-backed cards more cleanly
  - the media block ends where it should, matching the visual structure of the rest of the grid

## 2026-03-15 20:53 CET - Constrained the GitHub lightbox image strictly inside the stage

- Tightened the GitHub screenshot viewer after observing oversized screenshots escaping the fixed modal shell.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - switched the stage back to a centered grid container
  - removed stage scrolling and restored hard clipping at the frame boundary
  - made the enlarged screenshot fill the available stage box with `width: 100%`, `height: 100%`, and `object-fit: contain`
- Result:
  - the active screenshot should now always remain fully inside the visible stage
  - the fixed-size lightbox shell keeps stable controls without letting large screenshots spill outside

## 2026-03-15 20:58 CET - Switched the GitHub lightbox image back to intrinsic scaling inside the fixed stage

- Refined the GitHub screenshot viewer after noticing that the stricter `100% x 100%` image sizing still hid part of some tall screenshots.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - kept the modal shell and stage dimensions stable
  - restored intrinsic image sizing with `width: auto`, `height: auto`, plus `max-width: 100%` and `max-height: 100%`
  - kept `object-fit: contain` and centered alignment inside the stage
- Result:
  - the lightbox should preserve the stable modal layout while still fitting the full screenshot into view

## 2026-03-15 21:04 CET - Rebuilt the GitHub lightbox stage as a fixed grid row for true full-image containment

- Refined the GitHub screenshot viewer after confirming that some larger screenshots were still visually clipped.
- Updated:
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - switched the lightbox shell back to a two-row grid with an explicit media row
  - converted the media shell into a three-column grid (`nav / stage / nav`) so the center stage has a predictable size
  - constrained the enlarged screenshot with `max-width` and `max-height` that account for the stage padding itself
- Result:
  - the fixed modal shell remains stable
  - the central screenshot now has a better-defined box to scale into fully, instead of spilling or appearing clipped

## 2026-03-15 21:11 CET - Added aspect-ratio-aware lightbox variants for GitHub screenshots

- Refined the GitHub screenshot viewer after comparing `unify` and `webmarket` image dimensions.
- Updated:
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - the lightbox now probes the active screenshot dimensions and classifies it as `wide` or `tall`
  - `wide` screenshots keep the broader shell
  - taller screenshots switch to a narrower, higher modal shell to preserve full-image visibility
- Result:
  - `webmarket`-like wide screenshots and `unify`-like taller screenshots no longer need to share exactly the same viewer proportions
  - controls remain stable while the shell adapts more intelligently to the active image family

## 2026-03-15 21:18 CET - Split the monolithic Projects.css file along the extracted component boundaries

- Refactored the stylesheet structure of the single-page `Projects` section after the earlier component split.
- Added:
  - [ProjectsSection.css](./src/components/css/ProjectsSection.css)
  - [PortfolioProjectsGrid.css](./src/components/css/PortfolioProjectsGrid.css)
  - [GithubProjectsGrid.css](./src/components/css/GithubProjectsGrid.css)
  - [GithubProjectMedia.css](./src/components/css/GithubProjectMedia.css)
  - [GithubProjectLightbox.css](./src/components/css/GithubProjectLightbox.css)
- Updated:
  - [Projects.tsx](./src/components/jsx/Projects.tsx)
  - [PortfolioProjectsGrid.tsx](./src/components/jsx/PortfolioProjectsGrid.tsx)
  - [GithubProjectsGrid.tsx](./src/components/jsx/GithubProjectsGrid.tsx)
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
- Result:
  - the stylesheet layout now mirrors the React component architecture much more closely
  - future tweaks to portfolio cards, GitHub cards, media, and lightbox can be made in more local files

## 2026-03-15 21:29 CET - Added single-page SEO metadata, JSON-LD, robots, sitemap, and manifest

- Extended the static SEO surface of the portfolio after the projects/media refactor stabilized.
- Updated:
  - [index.html](./index.html)
- Added:
  - [robots.txt](./public/robots.txt)
  - [sitemap.xml](./public/sitemap.xml)
  - [site.webmanifest](./public/site.webmanifest)
- Changes:
  - switched canonical and social metadata to the live Vercel deployment URL
  - enriched Open Graph and Twitter card metadata
  - added static JSON-LD for `Person`, `WebSite`, and `WebPage`
  - added robots and sitemap files for crawler discovery
  - added a basic web manifest for application identity metadata
- Result:
  - the single-page portfolio now exposes a much more complete static metadata surface for crawlers, previews, and search engines

## 2026-03-15 21:16 CET - Froze the GitHub lightbox layout for the whole viewing session

- Refined the GitHub screenshot viewer after noticing that some galleries still resized while browsing between images.
- Updated:
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
- Changes:
  - the lightbox now decides its `wide` vs `tall` layout only from the image active at open time
  - once opened, the shell no longer recalculates its proportions when navigating inside the same gallery
- Result:
  - controls remain stable while browsing screenshots of the same project
  - mixed galleries no longer cause the modal itself to expand or contract from image to image

## 2026-03-15 20:27 CET - Restored a smooth tilt reset on portfolio cards

- Refined the hover exit motion for the single-page portfolio project cards.
- Updated:
  - [PortfolioProjectsGrid.tsx](./src/components/jsx/PortfolioProjectsGrid.tsx)
  - [Projects.css](./src/components/css/Projects.css)
- Changes:
  - kept transform transitions disabled during active tilt tracking
  - reintroduced a dedicated reset transition when the pointer leaves the card
- Result:
  - portfolio cards no longer snap back instantly after hover
  - the return to the resting state feels smoother and more intentional

## 2026-03-15 22:06 CET - Improved public accessibility and motion behavior

- Added a reusable `usePrefersReducedMotion` hook and applied it to:
  - GitHub project carousel autoplay
  - portfolio card tilt behavior
  - scroll-to-top smooth scrolling
- Upgraded the GitHub project lightbox with:
  - focus trapping
  - focus restoration on close
  - explicit `aria-labelledby` and `aria-describedby`
  - focus-visible styles for close and navigation controls
- Added stronger keyboard and focus affordances for public interactive UI:
  - project links
  - GitHub media controls
  - scroll-to-top button
  - portfolio cards via `:focus-within`
- Reduced motion-heavy effects under `prefers-reduced-motion` in the projects area and scroll-to-top behavior.
- Added `decoding=\"async\"` and related loading hints to public images in Hero, Skills, Experience, GitHub media, and the lightbox.

## 2026-03-15 22:28 CET - Applied a first visual polish pass to the public single-page UI

- Refined the hero presentation with:
  - a more layered atmospheric background
  - stronger greeting and university badge treatments
  - more sculpted social and portrait framing
- Turned the About section into a clearer narrative card with improved reading measure and more polished interest chips.
- Tightened visual hierarchy in Projects with:
  - more generous title/subtitle rhythm
  - more refined project chips and links
  - stronger portfolio and GitHub card framing
- Upgraded Skills and Experience with more consistent card depth, spacing, and section rhythm, keeping the existing information architecture intact.
- Verified the pass with `npm run build`.

## 2026-03-15 22:39 CET - Reduced the visual polish pass after targeted design feedback

- Removed the new pill treatment behind the hero greeting and dropped the framed square container behind the portrait.
- Kept the hero closer to the original layout while enlarging the circular portrait and preserving a stronger shadow.
- Restored the About section to its earlier simpler presentation, including the previous tag style.
- Simplified project tags again to remove the distracting highlight line effect.
- Rolled back the heavy boxed treatment from the upper technologies area in Skills while keeping the rest of the section intact.
- Re-verified the adjusted pass with `npm run build`.

## 2026-03-15 22:52 CET - Applied a focused mobile polish pass across the public single-page UI

- Improved the mobile navbar with:
  - a cleaner dropdown panel
  - better tap targets for icon buttons and toggle
  - stronger spacing and full-width CTA handling in the open menu
- Refined the hero on smaller screens by:
  - reducing visual density
  - improving portrait sizing
  - stacking CTAs more cleanly on very small viewports
- Tightened mobile layouts for Projects, GitHub projects, Skills, Experience, and Contact with reduced padding, cleaner gaps, and more comfortable content rhythm.
- Made the contact form submit button full width on mobile and improved list spacing/readability in contact and timeline sections.
- Verified the pass with `npm run build`.

## 2026-03-15 22:59 CET - Moved the navbar mobile breakpoint earlier

- Shifted the public navbar collapse breakpoint from `768px` to `900px`.
- This prevents the overlap seen around `769px`, where the desktop navigation links and right-side controls no longer fit cleanly on the same row.

## 2026-03-15 23:06 CET - Warmed GitHub project screenshots before and during lightbox viewing

- Investigated the perceived slowness of GitHub project screenshots on narrow/mobile viewport emulation and found that the viewer was still loading many images too close to interaction time.
- Updated:
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
- Changes:
  - start warming the first screenshots once the project media block enters the viewport
  - give the currently visible carousel slide eager/high-priority loading
  - preload the active lightbox image plus adjacent screenshots when opening the viewer
  - continue warming the rest of the gallery shortly after opening the lightbox
- Result:
  - screenshot opening should feel noticeably less delayed, especially in mobile-width testing where the previous behavior was too just-in-time.

## 2026-03-15 23:12 CET - Reworked the GitHub lightbox mobile layout

- Adjusted the mobile lightbox composition to be more vertical and thumb-friendly.
- Updated:
  - [GithubProjectLightbox.css](./src/components/css/GithubProjectLightbox.css)
- Changes:
  - kept the image stage above
  - moved the previous/next controls below the image on mobile
  - widened the controls into a bottom navigation row
  - slightly relaxed the modal width/height balance for narrow screens
- Result:
  - the mobile lightbox should feel less cramped laterally and more natural to navigate on touch devices.

## 2026-03-15 23:17 CET - Tightened mobile lightbox height and added stronger control highlighting

- Reduced the amount of fixed vertical space reserved by the GitHub lightbox on narrow screens.
- Updated:
  - [GithubProjectLightbox.css](./src/components/css/GithubProjectLightbox.css)
- Changes:
  - switched the mobile lightbox from a forced fixed height to an auto-height shell capped by viewport max-height
  - constrained the stage directly instead of letting the whole modal hold extra empty space
  - added a more visible highlighted treatment to the close and navigation buttons across desktop and mobile
- Result:
  - less wasted space below the mobile controls
  - controls feel more clearly actionable in both layouts.

## 2026-03-15 23:21 CET - Fixed mobile lightbox height override precedence

- Identified that the mobile lightbox still reserved large empty space because the desktop `wide`/`tall` height rules had higher selector specificity than the generic mobile override.
- Updated:
  - [GithubProjectLightbox.css](./src/components/css/GithubProjectLightbox.css)
- Changes:
  - extended the mobile override to target both `.github-project-lightbox-wide` and `.github-project-lightbox-tall`
  - kept mobile height on `auto` with viewport capping, regardless of the desktop layout mode class
- Result:
  - the unused vertical space in the mobile lightbox should now collapse correctly instead of inheriting desktop fixed heights.

## 2026-03-15 23:29 CET - Reworked screenshot warming to improve gallery navigation speed

- Replaced the ad-hoc screenshot priming with a shared warmup utility that caches, preloads, and decodes project images more systematically.
- Updated:
  - [imageWarmup.ts](./src/utils/imageWarmup.ts)
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
- Changes:
  - warm the first gallery images as soon as a project card enters the viewport
  - schedule the rest of the gallery warming during idle time
  - preload the active and adjacent screenshots more aggressively when opening the lightbox
  - warm the full gallery while navigating so image-to-image skipping is less dependent on last-second network fetches
- Verified with `npm run typecheck` and `npm run build`.

## 2026-03-15 23:54 CET - Added a repeatable WebP optimization pass for GitHub project screenshots

- Introduced a repeatable asset-optimization step for local GitHub project screenshots without forcing an immediate database migration.
- Updated:
  - [package.json](./package.json)
  - [optimizeProjectImages.mjs](./scripts/optimizeProjectImages.mjs)
  - [projectImageUrl.ts](./lib/utils/projectImageUrl.ts)
  - [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts)
- Changes:
  - added `npm run assets:projects:webp`, implemented via `ffmpeg` in WSL, to convert local `/public/imgs/projects/*.png` screenshots into `.webp`
  - capped the generated screenshots to a maximum width of `1600px` with Lanczos scaling and WebP picture compression
  - added a server-side helper that rewrites local `/imgs/projects/*.png` URLs to `.webp` before returning public project payloads
  - kept the original PNG files in place so the optimization pass is low-risk and reversible
- Result:
  - converted `28` screenshots from about `2.73 MB` total to about `1.10 MB`
  - the public GitHub project gallery should now load and skip more quickly because the API serves lighter local image assets by default.

## 2026-03-16 00:08 CET - Extended the WebP pass to all local public images under /imgs

- Generalized the image-optimization path so the same approach can cover local profile, logo, and event imagery under `/public/imgs`, not only project screenshots.
- Updated:
  - [package.json](./package.json)
  - [optimizeProjectImages.mjs](./scripts/optimizeProjectImages.mjs)
  - [optimizedImageUrl.ts](./lib/utils/optimizedImageUrl.ts)
  - [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts)
  - [profileRepository.ts](./lib/db/repositories/profileRepository.ts)
  - [experiencesRepository.ts](./lib/db/repositories/experiencesRepository.ts)
  - [index.html](./index.html)
- Changes:
  - expanded the optimizer to recurse through all raster images under `/public/imgs`
  - added a generic server-side URL rewriter that swaps to `.webp` only when an optimized counterpart actually exists on disk
  - kept original formats for assets where `.webp` was not beneficial, avoiding regressions on already-small icons, the profile photo, and the university logo
- Result:
  - the project screenshot gains remain intact
  - `Street_Science.png` also benefits from the same optimization path
  - all other local public images keep their original formats unless the generated `.webp` is genuinely smaller.

## 2026-03-16 00:16 CET - Prepared the database-side WebP reference update

- Added a dedicated SQL patch to move database references onto the optimized local `.webp` assets where those assets are now canonical.
- Updated:
  - [updateImageUrlsToWebp.sql](./scripts/updateImageUrlsToWebp.sql)
  - [index.html](./index.html)
- Changes:
  - prepared an explicit `UPDATE` for `public.github_project_images` so project screenshot URLs move from `.png` to `.webp`
  - prepared an explicit `UPDATE` for `public.experiences.logo` so `Street_Science` points to its optimized `.webp`
  - restored the social/SEO metadata image to `/imgs/michael.jpg`, because the generated `.webp` for the profile photo was not an improvement worth keeping
- Result:
  - the codebase and the pending DB patch now agree on which local assets should truly become `.webp`
  - profile and other small/local images that do not benefit remain in their original formats.

## 2026-03-16 00:24 CET - Removed temporary migration helpers and dropped dead raster assets

- Finalized the image optimization pass by removing the temporary runtime rewrite layer and deleting raster files that are no longer referenced.
- Updated:
  - [package.json](./package.json)
  - [projectsRepository.ts](./lib/db/repositories/projectsRepository.ts)
  - [profileRepository.ts](./lib/db/repositories/profileRepository.ts)
  - [experiencesRepository.ts](./lib/db/repositories/experiencesRepository.ts)
- Changes:
  - removed the temporary optimization scripts and the server-side URL rewrite helper now that the database references are already aligned
  - deleted the old project PNG screenshots and `Street_Science.png`
  - kept the new `.webp` assets as the canonical local sources
  - left unrelated dirty files outside this cleanup block untouched
- Verified with `npm run typecheck` and `npm run build`.

## 2026-03-16 00:33 CET - Replaced Vercel runtime query getters with WHATWG URL parsing

- Investigated the `DEP0169` warning seen on Vercel under Node `24.x` and confirmed from the traced stack that it was triggered by the runtime getter behind `req.query`, not by the business logic inside the handlers.
- Updated:
  - [apiUtils.ts](./lib/http/apiUtils.ts)
  - [about.ts](./api/about.ts)
  - [profile.ts](./api/profile.ts)
  - [skills.ts](./api/skills.ts)
  - [projects.ts](./api/projects.ts)
  - [experiences.ts](./api/experiences.ts)
  - [table.ts](./api/admin/table.ts)
- Changes:
  - added a shared `getQueryParam(req, key)` helper based on the WHATWG `URL` API
  - removed direct reads of `req.query` from the public content endpoints and the admin table endpoint
  - kept the request semantics unchanged while avoiding the Vercel runtime code path that internally calls `url.parse()`
- Verified with `npm run typecheck` and `npm run build`.

## 2026-03-16 00:43 CET - Reduced the hero portrait to match its actual rendering size

- Ran a first targeted asset optimization pass on the above-the-fold hero portrait, which was still oversized relative to its rendered dimensions.
- Updated:
  - [michael.jpg](./public/imgs/michael.jpg)
- Changes:
  - resized the portrait from `951x1280` down to `720x969`
  - kept the same file format and general quality profile to avoid unnecessary format churn for the hero image
- Result:
  - file size dropped from about `280 KB` to about `143 KB`
  - the largest always-visible image on the home page is now much closer to its actual rendering footprint.

## 2026-03-16 00:52 CET - Split the admin UI out of the public entry bundle

- Continued the performance pass by targeting the highest-value code-splitting opportunity: the admin UI was still imported eagerly by the top-level application shell, which meant `/admin` code could leak into the main public bundle.
- Updated:
  - [App.tsx](./src/App.tsx)
- Changes:
  - replaced eager imports of `AdminLogin`, `RequireAdmin`, and `AdminDashboard` with `React.lazy(...)`
  - wrapped the `/login` and `/admin` routes in route-local `Suspense` boundaries
  - added a lightweight admin-only fallback so the public home route keeps rendering immediately while the admin chunk loads on demand
- Expected result:
  - the main client bundle for `/` should shrink
  - the admin experience should move into a separate async chunk that only loads when visiting `/login` or `/admin`.

## 2026-03-16 01:06 CET - Added responsive hero and project gallery image variants

- Continued the performance pass by moving from monolithic image assets to viewport-specific variants on the highest-impact public surfaces.
- Updated:
  - [michael-360w.jpg](./public/imgs/michael-360w.jpg)
  - [public/imgs/projects](./public/imgs/projects)
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
  - [responsiveImages.ts](./src/utils/responsiveImages.ts)
- Changes:
  - generated a `360w` portrait variant for the hero image
  - generated `640w` and `1200w` variants for each GitHub project screenshot under `public/imgs/projects`
  - switched the hero portrait to a compact-first `src/srcSet` pair
  - switched GitHub project cards to card-sized variants and the lightbox to a larger dedicated variant, with the original file reserved for high-density displays
  - updated image warmup logic so preview and lightbox states prefetch the same variant family that the UI actually renders
- Expected result:
  - lower image transfer cost for the initial home view
  - materially faster GitHub project card rendering on small screens
  - less jarring image swaps when opening the viewer or moving between screenshots.

## 2026-03-16 01:18 CET - Reverted the responsive image variant experiment

- Rolled back the responsive-image experiment after reviewing the tradeoff and deciding not to increase asset fan-out and prefetch complexity on the public site.
- Updated:
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [GithubProjectLightbox.tsx](./src/components/jsx/GithubProjectLightbox.tsx)
- Changes:
  - removed the `srcSet` wiring for the hero portrait and GitHub project screenshots
  - restored the simpler warmup logic that preloads the canonical image paths already stored in the data layer
  - discarded the generated `-360w`, `-640w`, and `-1200w` image variants instead of introducing them into the runtime
- Result:
  - the site returns to the previous single-asset-per-image strategy
  - the earlier improvements to WebP conversion, admin code splitting, and viewer behavior stay intact.

## 2026-03-16 01:29 CET - Smoothed the hero portrait reveal to avoid partial JPEG painting

- Investigated the odd top-half-then-bottom hero portrait rendering during initial load and confirmed the image itself was already a baseline JPEG, so the cleaner fix was to control reveal timing in the UI.
- Updated:
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
  - [HeroTyping.css](./src/components/css/HeroTyping.css)
- Changes:
  - added a small load state for the hero portrait
  - kept the circular image shell visible as a soft placeholder while the file is loading
  - fade the portrait in only once the browser has fully loaded the image instead of showing partial scanline painting
- Result:
  - the hero photo should appear as a clean single reveal
  - the layout and shadow footprint stay stable while the image is still loading.

## 2026-03-16 01:36 CET - Preloaded the hero portrait from the document head

- The hero placeholder still felt longer than necessary because the portrait request could only start after the client app booted and the profile-driven hero mounted.
- Updated:
  - [index.html](./index.html)
- Changes:
  - added a document-level preload for `/imgs/michael.jpg` with high priority
- Expected result:
  - the browser can start fetching the hero portrait during HTML parsing
  - the circular hero placeholder should clear faster without reintroducing partial-image painting.

## 2026-03-16 01:48 CET - Fixed cached hero image refreshes that could leave the portrait hidden

- Investigated the case where Chrome could refresh the page, keep the hero image in cache, and still leave the circular hero placeholder visible instead of revealing the portrait.
- Updated:
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
- Changes:
  - added a direct image ref check for `complete` and `naturalWidth` after mount
  - kept the `onLoad` path for cold loads
  - added an `onError` escape hatch so the placeholder does not stay indefinitely if the image fails
- Result:
  - the hero portrait should reveal correctly both on first load and on refreshes that hit the browser cache path.

## 2026-03-16 02:03 CET - Reordered public bootstrap so sections unlock progressively

- Investigated reports of `hero`, `about`, `skills`, and `contact` staying in skeleton state too long on Vercel even when the APIs were healthy.
- Updated:
  - [ContentContext.tsx](./src/context/ContentContext.tsx)
- Changes:
  - made the content bootstrap wait until the profile provider finishes its initial load attempt
  - replaced the all-at-once `Promise.allSettled(...)` strategy with ordered fetches: `about -> projects -> experiences -> skills`
  - applied state updates incrementally after each response instead of waiting for the whole content batch to settle
- Expected result:
  - the hero and profile-dependent sections get priority over the rest of the page
  - `about`, `projects`, `experience`, and `skills` should unlock one after another instead of all waiting behind the slowest request.

## 2026-03-16 02:14 CET - Let the hero portrait appear independently from profile payload timing

- The hero image could still feel late because the portrait was effectively gated by the profile payload even though the image itself is a static local asset.
- Updated:
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
- Changes:
  - introduced a shared `HeroPortrait` renderer with a `useLayoutEffect` cache-path check
  - made the hero skeleton use the real portrait asset instead of a pure circular placeholder
  - promoted `/imgs/michael.jpg` to the default hero photo so the image can reveal before profile data finishes
- Expected result:
  - the hero portrait can show up immediately when the browser already has the asset
  - the visual gap between hero text and portrait should shrink noticeably on refresh and warm loads.

## 2026-03-16 02:21 CET - Removed StrictMode to stop dev-only canceled bootstrap fetches

- The dev network panel still showed an extra batch of canceled content/profile requests because React `StrictMode` intentionally double-mounted the app tree in development.
- Updated:
  - [main.tsx](./src/main.tsx)
- Changes:
  - removed the top-level `StrictMode` wrapper from the client root
- Result:
  - the local network panel should stop showing the dev-only aborted fetch cycle
  - bootstrap debugging is cleaner without changing the production runtime behavior.

## 2026-03-16 02:33 CET - Kept the hero portrait mounted while swapping only the text content

- The hero portrait could still look like it was rendering twice because the component switched from a full skeleton tree to a full content tree, remounting the portrait in the process.
- Updated:
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
- Changes:
  - refactored the hero so the portrait is mounted exactly once
  - limited the loading/content swap to the text column only
  - preserved the portrait cache-path logic and the role typing animation while removing the redundant portrait remount
- Expected result:
  - the hero image should feel visually steadier
  - the transition from skeleton to loaded hero should no longer redraw the portrait as a separate second pass.

## 2026-03-16 02:39 CET - Delayed the hero portrait reveal until the text column is ready

- After keeping the portrait mounted once, the remaining issue was that the image could still appear slightly before the hero text finished leaving the skeleton state.
- Updated:
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
  - [HeroTyping.css](./src/components/css/HeroTyping.css)
- Changes:
  - passed an explicit `contentReady` flag into the portrait renderer
  - made the portrait fade in only when both conditions are true:
    - the image has loaded
    - the hero text/content is ready
- Expected result:
  - the portrait and the text column should now appear as one coordinated reveal instead of two slightly offset moments.

## 2026-03-16 02:42 CET - Kept the portrait skeleton visible until the hero text is ready

- The previous tweak coordinated the real image reveal with the text, but the circular portrait placeholder itself could still disappear a little too early.
- Updated:
  - [HeroTyping.css](./src/components/css/HeroTyping.css)
- Changes:
  - kept the portrait skeleton overlay visible until both conditions are true:
    - the image has loaded
    - the text column is ready to leave the skeleton state
- Expected result:
  - while the hero text is still skeletonized, the portrait area should remain skeletonized too
  - the whole hero should now transition as one coherent block.

## 2026-03-16 20:39 CET - Added a minimal GitHub Actions CI workflow

- The repository did not yet have a verification workflow for routine pushes and pull requests; only deployment cleanup automation was present.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - added a dedicated `CI` workflow triggered on:
    - pushes to `main`
    - all pull requests
  - configured the workflow to run on `ubuntu-latest` with Node `24`
  - added the minimal verification sequence:
    - `npm ci`
    - `npm run typecheck`
    - `npm run build`
- Expected result:
  - GitHub now verifies that the project installs, typechecks, and builds successfully before or alongside deployment
  - routine regressions should be caught earlier, without depending solely on Vercel deploy feedback.

## 2026-03-16 20:41 CET - Extended the GitHub CI workflow with lint and archived logs

- The initial CI workflow only verified install, typecheck, and build. A lint pass and downloadable run logs were still missing.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - added a dedicated `Lint` step to the existing GitHub Actions workflow
  - introduced a `logs/` directory inside the job to capture:
    - dependency installation
    - lint
    - typecheck
    - build
  - routed command output through `tee` so each run now emits a persistent log file while still failing the step correctly via `pipefail`
  - added an `Upload CI logs` artifact step with `if: always()` so logs remain available even when the workflow fails
- Expected result:
  - each CI run now enforces lint in addition to typecheck and build
  - GitHub Actions retains a downloadable `ci-logs` artifact that can be inspected after both successful and failed runs.

## 2026-03-16 20:45 CET - Fixed lint blockers reported by the new GitHub CI workflow

- The first CI run surfaced two real frontend issues:
  - an unused `warmImageBatch` import and unstable `images` dependencies in `GithubProjectMedia`
  - `setState` calls inside effects in `HeroTyping`, flagged by `react-hooks/set-state-in-effect`
- Updated:
  - [GithubProjectMedia.tsx](./src/components/jsx/GithubProjectMedia.tsx)
  - [HeroTyping.tsx](./src/components/jsx/HeroTyping.tsx)
- Changes:
  - removed the unused `warmImageBatch` import
  - memoized `images` and `loopedImages` so the related effects have stable dependencies
  - replaced the portrait loading effects with a callback-ref based cache-path check plus load/error handlers
  - preserved the existing hero reveal behavior while removing the lint-flagged synchronous state updates from effect bodies
- Expected result:
  - local lint should now pass for the two affected components
  - the GitHub CI workflow should stop failing on these reported frontend issues.

## 2026-03-16 20:49 CET - Documented the CI workflow directly inside ci.yml

- The workflow was working, but the file itself did not explain why each trigger and step existed.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - added short YAML comments above each trigger and step
  - documented the purpose of:
    - push and pull request triggers
    - checkout and Node setup
    - log directory creation
    - install, lint, typecheck, and build
    - artifact upload
- Expected result:
  - the CI file should now be easier to read and remember without opening external documentation.

## 2026-03-16 20:53 CET - Added an inline GitHub Actions summary for CI logs

- The uploaded CI artifact is useful for backup, but GitHub downloads artifacts as zip files, which makes quick inspection less convenient than reading directly from the run page.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - added a `Publish CI log summary` step with `if: always()`
  - mirrored a readable digest of each generated log file into `$GITHUB_STEP_SUMMARY`
  - documented in the summary itself that:
    - full logs remain visible in each step output
    - the artifact is only a downloadable backup and will still be zipped by GitHub
- Expected result:
  - future CI runs should expose a readable summary directly in the GitHub Actions UI without requiring an artifact download first.

## 2026-03-16 20:57 CET - Unified the GitHub CI logs into a single ci.log file

- The CI workflow was still producing one log file per step, which made the artifact more fragmented than necessary.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - changed the logging strategy from multiple files (`install.log`, `lint.log`, `typecheck.log`, `build.log`) to one shared file: `logs/ci.log`
  - initialized the file once in the `Prepare CI logs directory` step
  - added clear section headers for:
    - install dependencies
    - lint
    - typecheck
    - build
  - updated the Actions summary step to render the tail of `ci.log` instead of iterating over separate files
- Expected result:
  - the artifact and the run summary should now read as one chronological CI transcript, while still keeping the logs available both in the step output and as a downloadable backup.

## 2026-03-16 21:05 CET - Made the GitHub CI summary render the full plain-text log

- The previous CI summary only showed the tail of `ci.log`, and color escape codes from tool output were still leaking into the log text.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - disabled colorized output for the workflow job via:
    - `FORCE_COLOR=0`
    - `NO_COLOR=1`
    - `npm_config_color=false`
  - changed the summary step to render the full `ci.log` with `cat` instead of truncating it with `tail`
- Expected result:
  - future GitHub Actions summaries should show the entire CI transcript in readable plain text, without the ANSI escape artifacts that were visible before.

## 2026-03-16 21:10 CET - Upgraded GitHub workflow actions to Node 24-native majors

- GitHub Actions began warning that several workflow actions were still running on the deprecated Node 20 runtime:
  - `actions/checkout@v4`
  - `actions/setup-node@v4`
  - `actions/upload-artifact@v4`
  - `actions/github-script@v7`
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
  - [cleanup-deployments.yml](./.github/workflows/cleanup-deployments.yml)
- Changes:
  - upgraded:
    - `actions/checkout` from `v4` to `v6`
    - `actions/setup-node` from `v4` to `v6`
    - `actions/upload-artifact` from `v4` to `v6`
    - `actions/github-script` from `v7` to `v8`
- Expected result:
  - the workflow warning about Node 20 deprecation on GitHub-hosted runners should disappear
  - the workflows should remain aligned with the GitHub Actions move toward Node 24 by default.

## 2026-03-16 21:24 CET - Reformatted the CI run summary into markdown sections

- The Actions summary was still showing the entire `ci.log` as one large code block, which made it harder to scan quickly.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - kept `ci.log` as the underlying unified transcript
  - replaced the monolithic summary output with markdown-oriented sections:
    - a short checklist of executed commands
    - one collapsible section each for install, lint, typecheck, and build
  - parsed `ci.log` by its existing section headers so the summary remains synchronized with the underlying artifact
- Expected result:
  - the GitHub Actions summary should now be much easier to read directly from the run page, without giving up the single `ci.log` artifact.

## 2026-03-16 21:29 CET - Switched the CI summary output to markdown-only formatting

- The previous summary formatting still relied on HTML `<details>` blocks, while the desired output was markdown-only.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - replaced the collapsible HTML sections with plain markdown headings
  - kept each CI section rendered inside fenced code blocks
  - preserved the same parsing of `ci.log`, but now the summary consists only of markdown elements
- Expected result:
  - the GitHub Actions run summary should now render entirely from markdown content, without mixing in HTML tags.

## 2026-03-16 21:33 CET - Tightened the spacing around fenced code blocks in the CI summary

- The markdown-only summary still left unnecessary blank lines around the fenced log sections, which made the run output look looser than intended.
- Updated:
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - removed the extra blank line between each section heading and its opening code fence
  - kept only the trailing separator newline after each fenced block
- Expected result:
  - the GitHub Actions summary should now render each log section more compactly, without extra empty rows above or below the fenced blocks.

## 2026-03-16 21:18 CET - Consolidated the admin route code behind a single lazy entry point

- The public build was still emitting several small admin JavaScript chunks because `/login` and `/admin` each had their own `lazy()` entry, plus the admin guard and skeleton split points.
- Updated:
  - [AdminApp.tsx](./src/components/jsx/AdminApp.tsx)
  - [App.tsx](./src/App.tsx)
- Changes:
  - introduced a single `AdminApp` module that imports:
    - `AdminLogin`
    - `RequireAdmin`
    - `AdminDashboard`
  - replaced the three independent admin lazy imports in `App.tsx` with one shared lazy entry point
  - kept the public/home route unchanged while making the admin area load as a single lazy-loaded subtree
- Expected result:
  - Vite should stop emitting multiple admin route entry chunks
  - the admin JavaScript should now be grouped much more coherently as one lazily loaded admin asset family, while remaining excluded from the public bundle.

## 2026-03-16 21:37 CET - Simplified the admin build artifact names to `admin-*`

- After consolidating the admin into one lazy subtree, the generated asset names were still tied to component names such as `AdminApp-*`, which made the build output noisier than necessary.
- Updated:
  - [vite.config.js](./vite.config.js)
- Changes:
  - added a small naming helper in the Vite config to detect admin-related asset names
  - configured Rollup output naming so that:
    - admin JavaScript chunks become `assets/admin-[hash].js`
    - admin CSS assets become `assets/admin-[hash].css`
  - left the public bundle naming unchanged for non-admin assets
- Expected result:
  - the `dist/assets` output should now label the lazy admin payload more cleanly, while preserving the public/admin split already introduced earlier.

## 2026-03-16 21:46 CET - Reduced CI install noise and patched the transitive `flatted` vulnerability

- The GitHub CI install step was still printing low-signal npm notices (`funding`, `audit fix`) and the dependency tree still contained `flatted@3.3.4`, which was the only readily patchable vulnerability from the previous audit output.
- Updated:
  - [package.json](./package.json)
  - [ci.yml](./.github/workflows/ci.yml)
- Changes:
  - added an `overrides` entry to force `flatted` to `^3.4.1`
  - updated the CI install step to use:
    - `npm ci --no-fund --no-audit`
  - updated the markdown summary checklist so it reflects the exact install command now used in CI
- Expected result:
  - the install section of the GitHub Actions log should be cleaner
  - the previous high-severity `flatted` advisory should disappear once the lockfile is refreshed and the workflow reruns.

## 2026-03-16 21:17 CET - Renamed the npm package metadata to match the repository identity

- The package metadata still used the old repository-era name `mik1810.github.io` and a placeholder version `0.0.0`, which no longer matched the project identity.
- Updated:
  - [package.json](./package.json)
  - [package-lock.json](./package-lock.json)
- Changes:
  - renamed the npm package from `mik1810.github.io` to `piccirilli_michael_portfolio`
  - bumped the package version from `0.0.0` to `1.0.0`
  - mirrored the same metadata changes into the lockfile root entry
- Notes:
  - the package name was normalized to lowercase to stay compatible with npm package naming rules
  - the version was set to `1.0.0` rather than raw `1` because npm expects semantic versioning
- Expected result:
  - local scripts, CI logs, and package metadata should now identify the project with a name closer to the repository name and a real initial release version.

## 2026-03-16 21:58 CET - Pruned the roadmap file to only the remaining open work

- The roadmap file still mixed together completed work, skipped-by-choice items, and truly open items, which made it less useful as a live planning document.
- Updated:
  - [todo.md](./todo.md)
- Changes:
  - removed sections that are already completed
  - removed sections explicitly skipped by project choice
  - rewrote the file as a shorter roadmap containing only:
    - backend hardening
    - database/schema hardening
    - contact flow
    - final performance pass
    - minimal automated tests
    - cross-device QA
- Expected result:
  - the improvements document should now reflect only the remaining realistic work, instead of acting as a historical wishlist.

## 2026-03-16 22:00 CET - Added explicit DB-backed endpoint coverage to the remaining roadmap

- One remaining testing goal was still implicit: adding automated coverage specifically for the public endpoints that actually execute database queries.
- Updated:
  - [todo.md](./todo.md)
- Changes:
  - expanded the `Test automatici minimi` section
  - added an explicit follow-up item for a dedicated test suite covering DB-backed endpoints, starting from:
    - `/api/profile`
    - `/api/about`
    - `/api/projects`
    - `/api/experiences`
    - `/api/skills`
- Expected result:
  - the roadmap should now make it explicit that endpoint-level verification of database-backed APIs is still planned work, not just a generic testing note.

## 2026-03-16 22:06 CET - Merged the remaining TODO items into the roadmap file

- The repository still had a separate `todo.md` file with open ideas that were not yet reflected in the trimmed roadmap.
- Updated:
  - [todo.md](./todo.md)
- Changes:
  - merged the still-relevant TODO items into the main roadmap, especially around:
    - linking skills to related projects
    - adding a `Cloud & Infra` section
    - devicon fallback behavior
    - skill ordering UX in admin
    - deferred upload/media workflow in admin
    - a targeted `Experience` UI polish item
  - kept the roadmap filtered so already completed items were not reintroduced
- Expected result:
  - `todo.md` should now act as the single current roadmap, without requiring a second planning file for still-open ideas.

## 2026-03-16 22:11 CET - Added operational roadmap items after the TODO merge

- Some useful follow-up ideas were still outside the roadmap even after merging `todo.md`, especially on the operational side.
- Updated:
  - [todo.md](./todo.md)
- Changes:
  - added environment validation to backend hardening
  - introduced a dedicated `Tooling e manutenzione operativa` section containing:
    - `Dependabot` / `Renovate`
    - a minimal health/dashboard view
    - lightweight release discipline
  - renumbered the remaining sections and refreshed the suggested order
- Expected result:
  - the roadmap should now cover the most useful operational improvements too, not only product-facing and backend-facing work.




## 2026-03-16 21:33 CET - Began backend hardening with shared env validation and Zod request parsing

- Added a centralized runtime env module in [env.ts](./lib/config/env.ts) to load .env.local once and validate:
  - database DSN expectations
  - Supabase auth configuration
  - session secret behavior
  - optional API port parsing
- Added shared request schemas in [requestSchemas.ts](./lib/http/requestSchemas.ts) using zod for:
  - public locale queries
  - admin login body
  - admin table query/body payloads
- Extended [apiUtils.ts](./lib/http/apiUtils.ts) with:
  - nforceMethods(...)
  - parseQueryWithSchema(...)
  - parseBodyWithSchema(...)
- Reworked env consumers to use the centralized config instead of ad hoc process.env / dotenv calls:
  - [drizzle.config.ts](./drizzle.config.ts)
  - [client.ts](./lib/db/client.ts)
  - [adminAuthRepository.ts](./lib/db/repositories/adminAuthRepository.ts)
  - [authSession.ts](./lib/authSession.ts)
  - [devApiServer.ts](./lib/devApiServer.ts)
- Hardened public read handlers so invalid lang values now fail at the HTTP boundary instead of being silently normalized:
  - [profile.ts](./api/profile.ts)
  - [about.ts](./api/about.ts)
  - [projects.ts](./api/projects.ts)
  - [skills.ts](./api/skills.ts)
  - [experiences.ts](./api/experiences.ts)
- Hardened admin handlers with schema-backed request parsing:
  - [login.ts](./api/admin/login.ts)
  - [table.ts](./api/admin/table.ts)
- Verification:
  - 
pm run lint passed
  - 
pm run typecheck passed
  - 
pm run build passed
- Expected result:
  - runtime configuration now fails faster and more explicitly
  - malformed public/admin input is rejected earlier and more consistently
  - the backend hardening track now has a reusable validation foundation instead of endpoint-local checks

## 2026-03-16 22:01 CET - Extended backend hardening with explicit rate limiting on public and admin paths

- Reworked [rateLimit.ts](./lib/http/rateLimit.ts) so rate limiting now:
  - sets X-RateLimit-Limit
  - sets X-RateLimit-Remaining
  - sets X-RateLimit-Reset
  - sets Retry-After on 429
- Updated admin handlers to pass the response object into the limiter:
  - [login.ts](./api/admin/login.ts)
  - [table.ts](./api/admin/table.ts)
- Added conservative public read-path limits to:
  - [profile.ts](./api/profile.ts)
  - [about.ts](./api/about.ts)
  - [projects.ts](./api/projects.ts)
  - [skills.ts](./api/skills.ts)
  - [experiences.ts](./api/experiences.ts)
  - [health.ts](./api/health.ts)
- Chosen thresholds are intentionally permissive for normal browsing, with the goal of hardening the HTTP boundary rather than throttling ordinary use.
- Verification:
  - 
pm run lint passed
  - 
pm run typecheck passed
  - 
pm run build passed
- Expected result:
  - both public and admin endpoints now expose clearer limit semantics at the HTTP layer
  - abusive bursts should fail more predictably and observably with proper response headers

## 2026-03-16 22:09 CET - Added explicit status markers to TODO.md

- Updated [TODO.md](./TODO.md) so the roadmap now carries explicit progress markers:
  - ✔ Fatto
  - ◐ Partial
  - ✘ Non fatto
- Marked the backend hardening track as partially completed after:
  - shared env validation
  - Zod request parsing
  - initial public/admin rate limiting
- Left the remaining sections as not started where work has not yet begun.
- Expected result:
  - the roadmap should now be easier to scan as a live status board rather than as a flat list of open items.

## 2026-03-16 22:15 CET - Closed the backend hardening block and normalized error payload semantics

- Updated the shared HTTP error layer in [apiUtils.ts](./lib/http/apiUtils.ts) so structured failures now expose a stable code alongside rror for the hardened paths.
- Updated [requireAdminSession.ts](./lib/requireAdminSession.ts) to use the shared unauthorized response path instead of a hand-written 401 payload.
- Refined hardened admin handlers to use semantic error codes for common failures such as:
  - unauthorized access
  - invalid query/body
  - table not allowed
  - missing primary keys
  - database error
  - auth failure
- Marked the Hardening backend section in [TODO.md](./TODO.md) as completed after closing:
  - env validation
  - shared Zod parsing
  - initial public/admin rate limiting
  - primary HTTP error normalization
- Verification:
  - 
pm run lint passed
  - 
pm run typecheck passed
  - 
pm run build passed
- Expected result:
  - the backend hardening track is now considered closed at the current project scope
  - future work can move to schema/database hardening or automated tests without leaving the HTTP boundary half-finished

## 2026-03-16 20:47 CET - Added first DB-backed endpoint test suite

- Added a minimal Node test runner setup with `npm run test:db`.
- Added handler-level integration tests for public DB-backed endpoints:
  - `/api/profile`
  - `/api/about`
  - `/api/projects`
  - `/api/skills`
  - `/api/experiences`
- Covered both success payload shape and invalid locale rejection with structured `invalid_query` errors.
- Marked the DB-backed endpoint test suite in [TODO.md](./TODO.md) as `🟡 Partial`.

## 2026-03-16 20:56 CET - Migrated DB-backed endpoint tests to Vitest

- Replaced the initial `node:test` setup with Vitest for the DB-backed endpoint suite.
- Added [vitest.config.ts](./vitest.config.ts) with a minimal Node-focused configuration.
- Updated scripts in [package.json](./package.json):
  - `npm run test:db`
  - `npm run test:db:watch`
- Kept the same handler-level coverage for public DB-backed endpoints while switching assertions and spies to Vitest.

## 2026-03-16 22:31 CET - Wired DB-backed Vitest suite into GitHub CI

- Updated [.github/workflows/ci.yml](./.github/workflows/ci.yml) to run `npm run test:db` between `typecheck` and `build`.
- Added CI environment wiring for DB-backed tests:
  - `NODE_ENV=test`
  - `AUTH_SESSION_SECRET=ci-test-secret`
  - `DATABASE_URL` from GitHub secret `DATABASE_URL` or fallback `SUPABASE_DB_URL`
- Added an explicit preflight failure in CI when the DB secret is missing, so the run fails with a clear message instead of an opaque Vitest error.
- Marked the DB-backed endpoint suite in [TODO.md](./TODO.md) as `🟡 Partial` rather than `❌ Non fatto`.

## 2026-03-16 22:39 CET - Split DB-backed Vitest cases to avoid CI timeout coupling

- Reworked [publicEndpoints.test.ts](./tests/api/publicEndpoints.test.ts) so each DB-backed public endpoint has its own Vitest case instead of one aggregated test.
- Raised the Vitest timeout in [vitest.config.ts](./vitest.config.ts) to `15000` for this DB-backed suite, because CI latency is higher than local runs.
- The goal is better CI diagnostics and less chance of one slow endpoint making the whole integration block fail ambiguously.

## 2026-03-16 22:49 CET - Scoped CI test env away from production build

- Reproduced the large-chunk warning locally by running `npm run build` with `NODE_ENV=test`.
- Confirmed that the CI job-level `NODE_ENV=test` was inflating the production bundle size even though Vite was building in production mode.
- Updated [.github/workflows/ci.yml](./.github/workflows/ci.yml) so DB-backed tests keep their dedicated env, while the build step runs with `NODE_ENV=production`.
- Expected result: the GitHub Actions build output should return to the normal ~283 kB public bundle and stop warning about chunks above 500 kB.

## 2026-03-16 23:03 CET - Added first schema hardening pass for read-heavy tables

- Updated [schema.ts](./lib/db/schema.ts) to declare explicit Drizzle indexes for the most common public read patterns.
- Added locale indexes for all `*_i18n` tables queried primarily by locale.
- Added `github_projects_featured_order_index_idx` for the featured GitHub project listing path.
- Added a ready-to-apply SQL migration in [0001_public_read_indexes.sql](./drizzle/0001_public_read_indexes.sql).
- Updated [TODO.md](./TODO.md):
  - marked the `_i18n` uniqueness item as `✅ Fatto` because composite primary keys already enforce it
  - marked the indexing task as `🟡 Partial` after this first pass

## 2026-03-16 23:16 CET - Aligned Drizzle schema with existing public foreign keys

- Updated [schema.ts](./lib/db/schema.ts) so Drizzle now declares the foreign-key relationships that were already present in the actual PostgreSQL schema.
- Added `.references(..., { onDelete: 'cascade' })` across the public content graph, including:
  - `profile_i18n` / `social_links`
  - `hero_roles_i18n`
  - `about_interests_i18n`
  - `projects_i18n` / `project_tags`
  - `github_projects_i18n` / `github_project_tags` / `github_project_images`
  - `experiences_i18n` / `education_i18n`
  - `tech_categories_i18n` / `tech_items`
  - `skill_categories_i18n` / `skill_items` / `skill_items_i18n`
- This pass does not change the live DB shape; it makes the ORM schema stricter and closer to the real dump.

## 2026-03-16 23:29 CET - Closed schema and database hardening block for current scope

- Reviewed the public content model after the index migration and Drizzle FK alignment.
- Confirmed that `_i18n` uniqueness is already enforced by composite primary keys in both the live DB and [schema.ts](./lib/db/schema.ts).
- Confirmed that order-sensitive public tables already rely on explicit unique constraints, for example:
  - base entities by `order_index`
  - child collections by `(parent_id, order_index)`
  - slugs where needed
- Marked the `Hardening schema e database` block in [TODO.md](./TODO.md) as completed for the current project scope.

## 2026-03-16 23:37 CET - Removed committed SQL migration artifact and README dump references

- Deleted [0001_public_read_indexes.sql](./drizzle/0001_public_read_indexes.sql) from the repository after the index migration had already been applied to the live database and reflected in dumps.
- Removed direct dump references from [README.md](./README.md) to avoid documenting operational DB artifacts as part of the public project narrative.

## 2026-03-16 23:47 CET - Added Dependabot for npm and workflow maintenance

- Added [.github/dependabot.yml](./.github/dependabot.yml).
- Enabled weekly updates for:
  - npm dependencies in the repository root
  - GitHub Actions workflow dependencies
- Added conservative PR limits and simple labels so automated maintenance stays readable.
- Marked the Dependabot item in [TODO.md](./TODO.md) as `✅ Fatto`.

## 2026-03-16 23:58 CET - Upgraded health endpoint into an operational app snapshot

- Added [appMetadata.ts](./lib/appMetadata.ts) for app name/version, uptime tracking, and minimal deployment metadata.
- Extended [health.ts](./api/health.ts) so `/api/health` now returns:
  - app name and version
  - environment
  - uptime
  - deploy metadata when available
  - DB health and latency
- The endpoint now responds with `503` when the database check fails and `200` when it succeeds.
- Marked the health/dashboard item in [TODO.md](./TODO.md) as `✅ Fatto`.

## 2026-03-16 23:18 CET - Hardened Dependabot config against incompatible ESLint major bumps

- Updated [dependabot.yml](./.github/dependabot.yml) to ignore semver-major updates for @eslint/js and slint.
- This prevents automatic PRs that move the lint stack to ESLint 10 while the rest of the repository is still aligned to ESLint 9.
- Kept the previously removed custom labels out of the config so Dependabot no longer fails on missing repository labels.

## 2026-03-16 23:28 CET - Extended Dependabot guardrails to the Vite toolchain

- Updated [dependabot.yml](./.github/dependabot.yml) to ignore semver-major updates for `vite` and @vitejs/plugin-react.
- This avoids automatic PRs that upgrade only one side of the Vite toolchain and break installation or preview deploys.

## 2026-03-16 23:42 CET - Added coordinated tooling-upgrade tracking to the roadmap

- Updated [todo.md](./todo.md) to explicitly track coordinated upgrades for major tooling stacks such as ESLint and Vite.
- The new roadmap item highlights the need to verify dependency compatibility before merging major toolchain updates.

## 2026-03-16 23:46 CET - Added explicit coordinated-tooling-upgrade item to the roadmap

- Refined [todo.md](./todo.md) so coordinated upgrades for major tooling stacks are now a standalone roadmap item, not just an implied maintenance practice.

## 2026-03-16 23:54 CET - Introduced a lightweight release discipline

- Added [CHANGELOG.md](./CHANGELOG.md) with an Unreleased section and the initial 1.0.0 baseline entry.
- Updated [README.md](./README.md) to document the lightweight release convention based on semantic version alignment and `vX.Y.Z` Git tags.
- Marked the release-discipline item in [todo.md](./todo.md) as ✅ Fatto.


## 2026-03-17 00:30 CET - Added a first server-side contact flow with Resend test sender

- Added [contact.ts](./api/contact.ts) with Zod validation, rate limiting, and JSON success/error responses.
- Added [contactService.ts](./lib/services/contactService.ts) backed by Resend, including 
eplyTo and a safe contact_unavailable fallback when email config is missing.
- Extended [env.ts](./lib/config/env.ts) with RESEND_API_KEY, CONTACT_FROM_EMAIL, and CONTACT_TO_EMAIL getters.
- Upgraded [Contact.tsx](./src/components/jsx/Contact.tsx) from mailto: navigation to a real POST flow with sending, success, and rror UI states plus a honeypot field.
- Added [contact.test.ts](./tests/api/contact.test.ts) and widened the API test runner/CI path to 
pm run test:api.
- Updated [README.md](./README.md) and [todo.md](./todo.md) to reflect the initial Resend test-mode setup and the partially completed contact-flow roadmap item.

## 2026-03-17 01:10 CET - Polished the contact flow UX and inbox rendering

- Refined [Contact.tsx](./src/components/jsx/Contact.tsx) so API error codes now map to clearer user-facing messages and status feedback uses `aria-live` / `aria-busy`.
- Upgraded [contactService.ts](./lib/services/contactService.ts) to send a styled HTML email alongside the plain-text fallback, making inbox rendering much easier to scan.
- Extended [staticI18n.json](./src/data/staticI18n.json) with validation and service-unavailable contact messages, and corrected the Italian timeout copy.
- Tweaked [Contact.css](./src/components/css/Contact.css) so status feedback remains more readable under the submit button.

## 2026-03-17 01:18 CET - Realigned roadmap and changelog to the current contact-flow state

- Updated [todo.md](./todo.md) so the contact-flow block now marks the server-side Resend path as completed and leaves only the production sender/domain upgrade as `🟡 Partial`.
- Updated [CHANGELOG.md](./CHANGELOG.md) to record the new contact endpoint, Resend integration, API coverage, and contact-form UX changes under `Unreleased`.

## 2026-03-17 01:32 CET - Added email-template extraction follow-up to the roadmap

- Extended the contact-flow section in [TODO.md](./TODO.md) with a dedicated follow-up item for extracting the email template into its own file, replacing dynamic fields explicitly, and refining the rendered layout further.

## 2026-03-20 00:01 CET - Extracted the contact email template into a dedicated module

- Added [contactEmailTemplate.ts](./lib/templates/contactEmailTemplate.ts) as the dedicated contact-email renderer.
- Moved the HTML email markup out of [contactService.ts](./lib/services/contactService.ts) into a build-time-loaded template module with:
  - explicit `{{token}}` placeholder replacement
  - localized copy selection
  - HTML escaping for all dynamic user-controlled fields
- Refined the inbox layout a bit while keeping the same delivery flow through Resend.
- Added [contactTemplate.test.ts](./tests/api/contactTemplate.test.ts) to verify:
  - placeholders are fully resolved
  - dynamic values are escaped before injection
- Updated [TODO.md](./TODO.md) to mark the email-template extraction task as completed.
- Updated [CHANGELOG.md](./CHANGELOG.md) so the `Unreleased` section reflects the extracted template and its new coverage.

## 2026-03-20 00:08 CET - Added the first lightweight smoke suite and closed TODO point 7

- Added [smoke.test.ts](./tests/api/smoke.test.ts) with lightweight checks for:
  - homepage shell integrity from [index.html](./index.html)
  - `/api/profile`
  - `/api/projects`
  - `/api/skills`
  - anonymous and authenticated admin session state via [session.ts](./api/admin/session.ts)
- Fixed [index.html](./index.html) so the module entry now points to [main.tsx](./src/main.tsx) instead of the stale `main.jsx` path.
- Updated [TODO.md](./TODO.md) so the `Test automatici minimi` block now marks as completed:
  - smoke coverage for homepage + key public endpoints
  - minimal admin/session coverage
- Updated [CHANGELOG.md](./CHANGELOG.md) to record the new smoke suite and the corrected frontend entry path.
- Verification:
  - `npx vitest run tests/api/smoke.test.ts`
  - `npm run typecheck`
  - `npm run lint`

## 2026-03-20 00:13 CET - Extended the smoke suite to every current API endpoint

- Expanded [smoke.test.ts](./tests/api/smoke.test.ts) so the smoke layer now covers:
  - all public read endpoints
  - `/api/health`
  - `/api/contact`
  - all current admin endpoints (`session`, `login`, `logout`, `tables`, `table`)
- Kept the suite lightweight by:
  - using the real handlers and DB-backed paths for the main public read endpoints
  - mocking side-effecting or operational dependencies only where useful, such as:
    - contact delivery
    - admin login
    - health DB ping
    - generic admin table row listing
- Updated [TODO.md](./TODO.md) so the smoke-test bullet now explicitly lists the full API surface covered.
- Updated [CHANGELOG.md](./CHANGELOG.md) to reflect that the smoke suite now spans the full current endpoint set.
- Verification:
  - `npx vitest run tests/api/smoke.test.ts`

## 2026-03-20 00:21 CET - Added the first real admin CRUD integration test against the DB

- Added [adminTableCrud.test.ts](./tests/api/adminTableCrud.test.ts) as the first DB-backed CRUD integration suite for the admin path.
- Chosen scope:
  - endpoint: [table.ts](./api/admin/table.ts)
  - table: `social_links`
- Covered operations:
  - `POST` create
  - `GET` read/list visibility
  - `PATCH` update
  - `DELETE` remove
- The test uses:
  - a real signed admin session cookie
  - the real database through Drizzle
  - explicit cleanup before and after the run so no residual row remains
- Updated [TODO.md](./TODO.md) to mark the CRUD/database block as `🟡 Partial` rather than untouched.
- Updated [CHANGELOG.md](./CHANGELOG.md) so `Unreleased` includes the first DB-backed admin CRUD integration test.
- Verification:
  - `npx vitest run tests/api/adminTableCrud.test.ts`
  - `npm run typecheck`
  - `npm run lint`

## 2026-03-20 00:31 CET - Expanded admin CRUD coverage to the whole current admin table set

- Reworked [adminTableCrud.test.ts](./tests/api/adminTableCrud.test.ts) from a single-table check into a parameterized DB-backed integration suite.
- The suite now performs real `create -> read -> update -> delete` flows through [table.ts](./api/admin/table.ts) for all admin tables that can safely use artificial records, including:
  - `social_links`
  - `hero_roles`, `hero_roles_i18n`
  - `about_interests`, `about_interests_i18n`
  - `projects`, `projects_i18n`, `project_tags`
  - `github_projects`, `github_projects_i18n`, `github_project_tags`, `github_project_images`
  - `experiences`, `experiences_i18n`
  - `education`, `education_i18n`
  - `tech_categories`, `tech_categories_i18n`, `tech_items`
  - `skill_categories`, `skill_categories_i18n`, `skill_items`, `skill_items_i18n`
- Added safe singleton handling for:
  - `profile`
  - `profile_i18n`
  These do not support a normal artificial-record CRUD cycle because the live schema/data model already occupies the only safe key space, so the suite performs update/restore checks instead of destructive singleton recreation.
- The test harness now:
  - generates unique payloads and order indexes per test
  - creates fixture parents through the same admin API when child rows need FK dependencies
  - keeps an explicit cleanup stack and falls back to direct DB cleanup after each test
- Updated [TODO.md](./TODO.md) so the CRUD/database block now reflects broad API-side coverage, while leaving repository-level CRUD coverage open.
- Updated [CHANGELOG.md](./CHANGELOG.md) to reflect the expanded admin CRUD integration suite.
- Verification:
  - `npx vitest run tests/api/adminTableCrud.test.ts`
  - `npm run typecheck`
  - `npm run lint`

## 2026-03-20 00:46 CET - Added failure-path coverage for admin, health, and auth-session utilities

- Added [adminFailures.test.ts](./tests/api/adminFailures.test.ts) covering:
  - invalid admin session cookie
  - login failure mapping
  - unauthorized access to `logout`, `tables`, and `table`
  - invalid admin table requests such as:
    - disallowed table
    - invalid limit
    - missing primary keys
    - no mutable fields
    - unknown columns
    - empty create payload
- Added [health.test.ts](./tests/api/health.test.ts) for:
  - healthy DB response (`200`)
  - unhealthy DB response (`503`)
- Added [authSession.test.ts](./tests/api/authSession.test.ts) for:
  - cookie parsing
  - token create/verify
  - request session extraction
  - tampered token rejection
  - expired token rejection
- Renamed the contact/email test file to [email.test.ts](./tests/api/email.test.ts) and kept the template assertions in the same suite.
- Verification performed for this tranche:
  - `npx vitest run tests/api/adminFailures.test.ts tests/api/health.test.ts tests/api/authSession.test.ts`
  - `npx vitest run tests/api/adminFailures.test.ts`
  - `npm run typecheck`
  - `npm run lint`

## 2026-03-20 01:00 CET - Extended repository-level coverage to public project read models

- Added [profileRepository.test.ts](./tests/repositories/profileRepository.test.ts) to cover:
  - locale normalization
  - stable payload shape for Italian and English profile reads
  - DB-aligned ordering for social links
  - localized role extraction by locale
- Added [projectsRepository.test.ts](./tests/repositories/projectsRepository.test.ts) to cover:
  - locale normalization
  - stable payload shape for Italian and English project reads
  - DB-aligned ordering and localization for local projects
  - featured GitHub project filtering, ordered tags, and ordered images
- Kept [adminTableRepository.test.ts](./tests/repositories/adminTableRepository.test.ts) as the repository-side CRUD/failure suite for the admin data layer.
- Updated [TODO.md](./TODO.md) so the CRUD/database block now reflects that repository-level coverage has started on multiple repositories, not only `adminTableRepository`.
- Updated [CHANGELOG.md](./CHANGELOG.md) so `Unreleased` mentions the expanded repository-level DB-backed coverage.
- Verification for the new project repository suite:
  - `npx vitest run tests/repositories/projectsRepository.test.ts`

## 2026-03-20 01:03 CET - Extended repository-level coverage to the skills read model

- Added [skillsRepository.test.ts](./tests/repositories/skillsRepository.test.ts) to cover:
  - stable payload shape for Italian and English skill reads
  - DB-aligned tech stack category ordering and localized labels
  - DB-aligned tech item ordering with fallback handling for `devicon` and `color`
  - DB-aligned skill category ordering and localized skill labels
- Updated [TODO.md](./TODO.md) so the CRUD/database block now mentions `skillsRepository` alongside the previously covered repositories.
- Updated [CHANGELOG.md](./CHANGELOG.md) so `Unreleased` reflects the additional repository-level coverage.
- Verification for this suite:
  - `npx vitest run tests/repositories/skillsRepository.test.ts`

## 2026-03-20 01:06 CET - Closed the CRUD and database coverage block with the remaining repositories

- Added [aboutRepository.test.ts](./tests/repositories/aboutRepository.test.ts) to cover:
  - stable payload shape for Italian and English about reads
  - DB-aligned interest ordering for both locales
- Added [experiencesRepository.test.ts](./tests/repositories/experiencesRepository.test.ts) to cover:
  - stable payload shape for Italian and English experience reads
  - DB-aligned ordering and localization for both `experiences` and `education`
- Added [adminAuthRepository.test.ts](./tests/repositories/adminAuthRepository.test.ts) to cover:
  - successful admin sign-in mapping
  - provider auth error mapping
  - generic fallback error handling
  - invalid successful payload rejection
- Updated [TODO.md](./TODO.md) so the `Test CRUD e copertura database` block is now marked as completed for the current repository/API scope.
- Updated [CHANGELOG.md](./CHANGELOG.md) so `Unreleased` reflects repository-level coverage across all current repositories.
- Verification for this closing pass:
  - `npx vitest run tests/repositories/aboutRepository.test.ts tests/repositories/experiencesRepository.test.ts`
  - `npx vitest run tests/repositories/adminAuthRepository.test.ts`

## 2026-03-20 01:24 CET - Split backend tests out of the main CI workflow

- Updated [package.json](./package.json) so `npm run test:api` now runs:
  - `tests/api`
  - then `tests/repositories`
- Restored default Vitest file parallelism in [vitest.config.ts](./vitest.config.ts) and moved cross-folder ordering to the npm script layer.
- Updated [tests/TEST.md](./tests/TEST.md) to document the new execution order and the new dedicated test commands.
- Simplified [ci.yml](./.github/workflows/ci.yml) so the main CI workflow now runs only:
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- Added [backend-tests.yml](./.github/workflows/backend-tests.yml) as a dedicated workflow for:
  - `npm ci`
  - `npm run test:api`
  - markdown summary publication
  - backend test log artifact upload
- Verification:
  - `npm run test:api`

## 2026-03-20 01:35 CET - Hardened the health boundary by splitting public and admin visibility

- Added [healthService.ts](./lib/services/healthService.ts) to centralize:
  - DB health probing
  - public health payload creation
  - admin health payload creation
- Updated [appMetadata.ts](./lib/appMetadata.ts) so uptime now uses real process uptime semantics, with a fallback only when needed.
- Simplified [health.ts](./api/health.ts) into a public minimal snapshot that exposes only:
  - service identity
  - timestamp
  - app name/version
  - DB check state and latency
- Added [api/admin/health.ts](./api/admin/health.ts) as a protected endpoint that returns the richer operational payload, including:
  - environment
  - uptimeSeconds
  - startedAt
  - deployment metadata
- Updated tests to reflect the new split:
  - [health.test.ts](./tests/api/health.test.ts)
  - [smoke.test.ts](./tests/api/smoke.test.ts)
  - [adminFailures.test.ts](./tests/api/adminFailures.test.ts)
- Updated [todo.md](./todo.md) so the health/privacy block is now marked as completed for the current scope.

## 2026-03-20 01:48 CET - Turned `/admin` into an operational home and moved CRUD tables to `/admin/tables`

- Added [AdminHome.tsx](./src/components/jsx/AdminHome.tsx) as the new admin landing page.
- Updated [App.tsx](./src/App.tsx) routes so:
  - `/admin` now renders the operational home
  - `/admin/tables` now renders the existing CRUD console
- Updated [AdminApp.tsx](./src/components/jsx/AdminApp.tsx) to support:
  - `login`
  - `home`
  - `tables`
- Updated [Navbar.tsx](./src/components/jsx/Navbar.tsx) so the admin shell logo now routes back to `/admin` instead of exiting the admin area.
- Extended [AdminAuth.css](./src/components/css/AdminAuth.css) with the new admin-home layout:
  - hero summary
  - health/runtime/release/workspace cards
  - CTA to `/admin/tables`
  - refresh action
- Added [AdminHealthResponse](./src/types/app.ts) to type the richer admin health payload in the frontend.
- Verification:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`

## 2026-03-20 04:30 CET - Consolidated admin serverless routing and aligned docs

- Solved Vercel Hobby deploy blocking issue (`No more than 12 Serverless Functions`) by consolidating admin API files into a single entrypoint:
  - [api/admin.ts](./api/admin.ts)
- Kept route behavior unchanged at HTTP level (`/api/admin/session`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/tables`, `/api/admin/table`, `/api/admin/health`, `/api/admin/environment`), while moving logic to dedicated modules:
  - [lib/services/admin-routes/sessionRoute.ts](./lib/services/admin-routes/sessionRoute.ts)
  - [lib/services/admin-routes/loginRoute.ts](./lib/services/admin-routes/loginRoute.ts)
  - [lib/services/admin-routes/logoutRoute.ts](./lib/services/admin-routes/logoutRoute.ts)
  - [lib/services/admin-routes/tablesRoute.ts](./lib/services/admin-routes/tablesRoute.ts)
  - [lib/services/admin-routes/tableRoute.ts](./lib/services/admin-routes/tableRoute.ts)
  - [lib/services/admin-routes/healthRoute.ts](./lib/services/admin-routes/healthRoute.ts)
  - [lib/services/admin-routes/environmentRoute.ts](./lib/services/admin-routes/environmentRoute.ts)
- Updated local API resolver in [devApiServer.ts](./lib/devApiServer.ts) to resolve dynamic route files (`[route]`/`[...route]`) in addition to direct file matches.
- Updated API test suites to import the unified admin entrypoint while preserving existing request paths and assertions.
- Documentation alignment completed:
  - [README.md](./README.md): clarified single-entrypoint admin API architecture
  - [TEST.md](./tests/TEST.md): clarified admin routing model and payload naming
  - [TODO.md](./TODO.md): normalized filename casing and added completed item about admin route consolidation
- Verification:
  - `npm run typecheck` passed
  - `npm run test:api:handlers` passed

## 2026-03-22 21:50 CET - Stabilized `/home` public routing, unified public API dispatch, and admin login loading UX

- Consolidated public API routing behind a dedicated entrypoint:
  - added [home.ts](./api/home.ts)
  - moved public endpoint logic under [lib/services/public-routes/](./lib/services/public-routes)
  - removed legacy per-endpoint API files in `api/` for public paths
- Kept external HTTP contracts unchanged (`/api/profile`, `/api/about`, `/api/projects`, `/api/skills`, `/api/experiences`, `/api/health`, `/api/contact`) via rewrites in [vercel.json](./vercel.json).
- Hardened admin/public route separation:
  - admin remains dispatched via [admin.ts](./api/admin.ts)
  - removed stale dynamic `[route]`/`[...route]` fallback candidates from [devApiServer.ts](./lib/devApiServer.ts)
  - local resolver now prioritizes explicit `admin.ts` and `home.ts` to avoid cross-dispatch collisions.
- Updated SPA routing to canonical public path `/home`:
  - redirect `/` -> `/home`
  - wildcard fallback to `/home`
  - updated SEO metadata (`canonical`, `og:url`, JSON-LD web page URL) in [index.html](./index.html)
- Added an admin-specific not-found route fallback for `/admin/*` in [App.tsx](./src/App.tsx), so admin typos no longer fall back to public home.
- Added explicit admin login loading skeleton and stabilized fallback shell:
  - [AdminLogin.tsx](./src/components/jsx/AdminLogin.tsx)
  - [AdminAuth.css](./src/components/css/AdminAuth.css)
  - [SectionSkeletons.css](./src/components/css/SectionSkeletons.css)

### Manual validation notes (local browser)

- Route and auth flows validated manually:
  - `/` redirects to `/home`
  - `/home` renders correctly
  - unknown paths return to `/home`
  - `/login` -> `/admin` login flow works
  - `/admin/tables` works
  - logout returns to `/home`
- HAR analysis:
  - `localhost.har` captured the pre-fix period with intermittent `404 API route not found` and slow waterfall requests
  - `localhost2.har` confirmed post-fix stability for routing (`ALL_200` on relevant API calls), with only occasional cold-start latency spikes still visible on some public endpoints.

### Verification executed during this tranche

- `npm run typecheck` passed
- `npm run lint` passed
- `npx vitest run tests/api/publicEndpoints.test.ts tests/api/health.test.ts tests/api/email.test.ts tests/api/smoke.test.ts` passed

## 2026-03-23 - Stabilizzazione caricamento homepage (punto 15)

### Contesto operativo

- durante i test locali la homepage pubblica mostrava intermittentemente richieste `canceled` e sezioni bloccate in skeleton
- analisi HAR e tracing hanno mostrato pattern misti: abort client a 15s e richieste "zombie" con connessione chiusa lato client ma lavoro backend ancora in esecuzione

### Interventi applicati

- introdotta telemetria tempi su route pubbliche e repository DB (`logTiming`) per distinguere latenza handler vs latenza query
- aggiunto tracing dettagliato nel dev API server (`request.start`, `handler.end`, `response.finish/close`, `requestId`)
- identificato collo di bottiglia principale nel dynamic import per-request di `api/home.ts` al cold start locale
- rimosso il dynamic import per-request nel dev server, passando a dispatch statico `admin/home`
- aggiunta cancellazione cooperativa su abort request (`AbortSignal` in `ApiRequest` + helper `lib/http/abort.ts` + guard nelle route pubbliche)
- aggiunto warmup automatico dev degli endpoint pubblici all'avvio, con timeout per endpoint e messaggio finale esplicito `dev-api.warmup.ready`
- evitata chiamata `/api/admin/session` sulla superficie pubblica (`/home`), mantenendola su `/login` e `/admin*`
- ridotte doppie fetch iniziali su `/home` (refresh esplicito solo quando si rientra dall'area admin)
- aggiunto retry breve lato client per abort rapidi/transitori in `ContentContext` e `ProfileContext`
- aggiunta redirect immediata in `index.html` da `/` a `/home` per eliminare il bianco iniziale pre-mount React

### Evidenze test

- ultimi HAR locali: nessun `canceled` sulle API pubbliche principali (`about/projects/profile/experiences/skills`), tutte `200`
- tempi API stabilizzati nell'ordine ~0.8s-3s nei run osservati post-fix
- lentezza residua prevalentemente su asset immagine (atteso per il volume media dei progetti)

### Stato

- punto 15: sostanzialmente stabilizzato lato locale; restano rifiniture opzionali su endpoint bootstrap unico e uniformazione error-state UI
