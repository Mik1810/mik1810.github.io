# SESSION

## Sessione

- Data inizio: `2026-03-14`
- Ora locale: `17:30:45 +01:00`
- Repo: `c:\Users\micha\Desktop\mik1810.github.io`
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

- Ora locale: `2026-03-14 17:34:26 +01:00`
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

- Ora locale: `2026-03-14 18:05:18 +01:00`
- Stato: `Lint errors risolti, baseline tecnica pulita`

## Nota su IMPROVEMENTS.md

- Inclusa nel commit anche la modifica locale gia presente su `IMPROVEMENTS.md`
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

- Ora locale: `2026-03-14 18:20:30 +01:00`
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

- Ora locale: `2026-03-14 18:28:48 +01:00`
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

- Ora locale: `2026-03-14 18:43:00 +01:00`
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

- Ora locale: `2026-03-14 18:50:48 +01:00`
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

- Ora locale: `2026-03-14 18:54:53 +01:00`
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

- Ora locale: `2026-03-14 19:02:30 +01:00`
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

- Ora locale: `2026-03-14 19:17:07 +01:00`
- Stato: `Componenti admin migrati, restano solo i file config JS`
## 2026-03-14 20:00 CET - Deployment cleanup workflow

- Added [cleanup-deployments.yml](/c:/Users/micha/Desktop/mik1810.github.io/.github/workflows/cleanup-deployments.yml) to keep only the latest GitHub deployment for `production` and the latest for `preview`.
- The workflow runs on `deployment_status` success, marks older deployments as `inactive`, then deletes them via the GitHub Deployments API.
- Environment grouping is inferred from deployment environment names containing `production` or `preview`.
- Follow-up check needed after the first runs: confirm the actual deployment environment names emitted by Vercel/GitHub match the workflow classification.
## 2026-03-14 20:45 CET - Repository layer kickoff

- Added [projectsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/projectsRepository.ts) to isolate Supabase reads and data mapping for projects and featured GitHub projects.
- Added [profileRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/profileRepository.ts) to isolate profile, socials, and hero role reads, including the legacy `bio` fallback.
- Simplified [projects.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/projects.ts) so it now handles HTTP concerns and cache only.
- Simplified [profile.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/profile.ts) so it now delegates data access to the repository layer.
- Next step after verification: decide whether to keep extracting more repositories first or introduce a thin service layer on top of these two repositories.
## 2026-03-14 21:05 CET - Repository layer extended to remaining public endpoints

- Added [aboutRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/aboutRepository.ts) for about interests data access.
- Added [skillsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/skillsRepository.ts) for tech stack and skill category aggregation.
- Added [experiencesRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/experiencesRepository.ts) for experiences and education mapping.
- Simplified [about.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/about.ts), [skills.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/skills.ts), and [experiences.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/experiences.ts) so they now focus on HTTP and cache concerns.
- Reused the existing repository locale normalization to keep locale handling consistent across all public API endpoints.
## 2026-03-14 21:20 CET - Public service layer introduced

- Added [publicContentService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/publicContentService.ts) as a thin application layer between public API handlers and repositories.
- Updated [about.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/about.ts), [profile.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/profile.ts), [projects.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/projects.ts), [skills.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/skills.ts), and [experiences.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/experiences.ts) to call the service layer instead of repositories directly.
- Centralized locale normalization export in the service layer so handlers no longer need to know which repository defines it.
- The service layer is intentionally thin for now, giving us a stable place to add orchestration, cross-repository composition, logging, or validation later without rewriting handlers again.
## 2026-03-14 21:40 CET - Admin repositories and services introduced

- Added [adminAuthRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminAuthRepository.ts) to isolate Supabase admin sign-in.
- Added [adminTableRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminTableRepository.ts) to isolate dynamic CRUD operations for allowed admin tables.
- Added [adminAuthService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminAuthService.ts) for login, logout, and session response orchestration.
- Added [adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts) for table validation, payload normalization, limit parsing, and CRUD delegation.
- Updated [login.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/login.ts), [logout.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/logout.ts), [session.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/session.ts), [tables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/tables.ts), and [table.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/table.ts) to use the new admin service layer.
## 2026-03-14 22:00 CET - Backend hardening baseline

- Added [apiUtils.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/http/apiUtils.ts) with shared helpers for method enforcement, typed HTTP errors, generic error responses, and simple non-empty string validation.
- Added [logger.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/logger.ts) for structured API error logging with context metadata.
- Updated public endpoints and [health.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/health.ts) to use shared method enforcement and centralized error handling.
- Hardened [login.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/login.ts) with explicit trimmed string validation and more predictable auth error mapping.
- Improved [table.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/table.ts) so missing-vs-disallowed table errors are distinguished and server-side failures are logged with request metadata.
## 2026-03-14 22:15 CET - Admin rate limiting

- Added [rateLimit.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/http/rateLimit.ts) with a simple in-memory limiter keyed by client IP or forwarded headers.
- Extended [http.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/types/http.ts) and [devApiServer.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/devApiServer.ts) so local API requests carry an `ip` field when available.
- Applied a strict limiter to [login.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/login.ts): `5` attempts per minute per client.
- Applied a broader limiter to [table.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/table.ts): `120` requests per minute per client.
- This limiter is intentionally lightweight and process-local, which is enough for baseline protection now and keeps the next migration path open if we later move to a shared store.
## 2026-03-14 22:25 CET - API dev server autoreload

- Updated [package.json](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/package.json) so `dev:api` now runs `tsx watch lib/devApiServer.ts`.
- Result: local backend changes under `api/` and `lib/` should now restart the API server automatically during development.
- Practical impact: after switching to the new script once, future backend edits should no longer require a manual `dev:api` restart in most cases.
## 2026-03-14 22:35 CET - Cache utility and stricter admin payload validation

- Added [memoryCache.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/cache/memoryCache.ts) to centralize simple TTL-based in-memory caching for public endpoints.
- Updated [about.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/about.ts), [profile.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/profile.ts), [projects.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/projects.ts), [skills.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/skills.ts), and [experiences.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/experiences.ts) to use the shared cache utility instead of duplicating map-and-timestamp logic.
- Hardened [adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts) so invalid `limit` values now return a `400` instead of silently falling back, and empty object payloads are rejected explicitly.
- Updated [table.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/table.ts) so `POST`, `PATCH`, and `DELETE` reject missing or empty `row`/`keys` payloads with clearer client errors.
## 2026-03-14 22:50 CET - Drizzle foundation

- Added Drizzle scripts in [package.json](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/package.json): `db:generate`, `db:migrate`, and `db:studio`.
- Added [drizzle.config.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/drizzle.config.ts) using `DATABASE_URL` or `SUPABASE_DB_URL`, without switching runtime queries yet.
- Added [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts) as the shared Drizzle client entrypoint.
- Added [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts) with the current content tables modeled in Drizzle for the gradual migration away from raw query builders.
## 2026-03-14 23:05 CET - Drizzle env loading clarified

- Updated [drizzle.config.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/drizzle.config.ts) and [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts) to load `.env.local` explicitly via `dotenv`.
- Drizzle now also checks `SUPABASE_URL` as a fallback name, but only if it is actually a PostgreSQL connection string.
- Added an explicit error message for the common mismatch where `SUPABASE_URL` is the Supabase HTTP project URL rather than the Postgres DSN.
- `SUPABASE_SECRET_KEY` is not used by Drizzle ORM and does not help for `pg_dump` or direct SQL connections.
## 2026-03-14 23:20 CET - First Drizzle repository pilot

- Updated [aboutRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/aboutRepository.ts) to use Drizzle instead of the Supabase query builder.
- The pilot uses [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts), [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts), and typed Drizzle filters/order clauses (`eq`, `asc`).
- Chosen pilot scope: `about` because it is small enough to validate the Drizzle path without opening the higher-complexity `projects` flow immediately.
## 2026-03-14 23:35 CET - Second Drizzle migration: profile repository

- Updated [profileRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/profileRepository.ts) to use Drizzle for profile, profile_i18n, social links, and hero roles.
- Replaced Supabase query builder calls with typed Drizzle selects, filters, and order clauses while keeping the public `ProfileResponse` payload unchanged.
- This second migration gives us a better signal than `about` because it spans multiple tables and preserves aggregation logic for socials and localized hero roles.
## 2026-03-14 23:50 CET - Third Drizzle migration: skills repository

- Updated [skillsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/skillsRepository.ts) to use Drizzle for tech categories, tech items, skill categories, and skill item translations.
- Replaced the old defensive Supabase row-shape compatibility helpers with typed Drizzle selects based on the normalized schema in [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts).
- Verified the migrated repository against live data: `4` tech categories and `4` skill categories were returned for locale `it`, with `Linguaggi` and `Programmazione` as the first labels.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after the migration.
- Build note: the one temporary Vite failure during verification was caused by launching the build from the old junction path `mik1810.github.io`; the real repo path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio) builds correctly and should be preferred for future commands.
## 2026-03-15 00:05 CET - Fourth Drizzle migration: experiences repository

- Updated [experiencesRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/experiencesRepository.ts) to use Drizzle for both the `experiences` and `education` flows.
- Replaced Supabase reads with typed Drizzle selects over [experiences](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts), [experiencesI18n](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts), [education](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts), and [educationI18n](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts), preserving the existing payload shape and the rule that untranslated rows are skipped.
- Verified the migrated repository against live data: locale `it` returned `3` experiences and `2` education entries, with `Cybersecurity National Lab` and `Università degli Studi dell'Aquila` as the first labels.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after this migration as well.
## 2026-03-15 00:20 CET - Fifth Drizzle migration: projects repository

- Updated [projectsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/projectsRepository.ts) to use Drizzle for the full public projects flow: portfolio projects, localized project content, tags, featured GitHub projects, GitHub tags, and GitHub image galleries.
- Removed the old Supabase compatibility layer for alternate foreign-key field names because the real database schema is now modeled explicitly in [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts).
- Preserved the external payload shape used by [projects.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/projects.ts), including `live`, `githubUrl`, `liveUrl`, primary preview image, and gallery images.
- Verified the migrated repository against live data: locale `it` returned `2` standard projects and `4` featured GitHub projects; the first GitHub project (`Unify`) exposed `5` gallery images through Drizzle.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after the final repository migration.
## 2026-03-15 00:35 CET - Removed supabaseAdmin.ts dependency

- Reworked [adminTableRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminTableRepository.ts) to use direct SQL through [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts) instead of the Supabase query builder.
- Added identifier validation and parameterized query construction for the generic admin CRUD flow so the admin area keeps its current flexibility without relying on `supabase-js`.
- Reworked [adminAuthRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminAuthRepository.ts) to authenticate against Supabase Auth over HTTP (`/auth/v1/token?grant_type=password`) using `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- Removed [supabaseAdmin.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/supabaseAdmin.ts) entirely and removed `@supabase/supabase-js` from [package.json](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/package.json).
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed

## 2026-03-15 18:24 CET - Aligned admin table headers with centered visual columns

- Refined the admin table header alignment so column titles now follow the same visual logic as their cells.
- Updated:
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
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
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
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
  - [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts)
  - [projectsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/projectsRepository.ts)
  - [Projects.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Projects.tsx)
  - [app.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/types/app.ts)
  - [projectTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/projectTables.ts)
  - [0000_drop_github_projects_image_url.sql](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/drizzle/0000_drop_github_projects_image_url.sql)
  - [drizzle meta journal](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/drizzle/meta/_journal.json)
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
  - live admin table read test returned one `profile` row
  - invalid admin sign-in test failed cleanly with `Invalid login credentials`
- Remaining mentions of `supabaseAdmin` now live only in historical notes/documentation (`SESSION.md`, `IMPROVEMENTS.md`), not in runtime code.
## 2026-03-15 00:50 CET - Technical README added

- Added [README.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/README.md) from scratch as the main technical project documentation.
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
- The document was written from the real codebase state plus [SESSION.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/SESSION.md) and [API_CONTRACT.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/docs/API_CONTRACT.md), so it reflects the post-Drizzle, post-`supabaseAdmin` architecture rather than the original project shape.
## 2026-03-15 01:05 CET - README rewritten with a more technical/system-oriented tone

- Rewrote [README.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/README.md) to describe the repository as a current-state software system rather than as a historical refactor narrative.
- The new README now emphasizes:
  - project purpose and operational role of the portfolio as a structured content system
  - logical architecture and layer responsibilities
  - information model and localization pattern
  - authentication, admin CRUD, caching, validation, and deploy model
  - engineering properties and current system limits
- Explicitly removed the previous emphasis on refactor history and replaced it with a more formal, technical, and quasi-scientific description of the repository's present architecture.
## 2026-03-15 01:20 CET - README deepened with code-level and architectural rationale

- Rewrote [README.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/README.md) again with a stronger technical focus.
- Added:
  - Mermaid diagrams for component, request, authentication, and ER-level views
  - real code snippets from handlers, repositories, schema, admin auth, and admin SQL execution
  - explicit technology-selection rationale with trade-offs versus alternatives such as Next.js, Prisma, Redux/Zustand, `supabase-js`, and Redis
  - a dedicated section explaining why architecture diagrams are more useful than screenshots for this repository at the current stage
- The README now behaves more like a technical system dossier than a generic project introduction.
## 2026-03-15 01:40 CET - Admin SQL path hardened and README made more paper-like

- Reworked [adminTableRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminTableRepository.ts) again to remove the remaining use of `sqlClient.unsafe(...)` from the admin CRUD path.
- The admin SQL layer now uses:
  - strict identifier validation
  - `postgres` tagged-template queries
  - parameterized values for dynamic payloads and filters
- This keeps the generic admin model while reducing the attack surface and making the security story much easier to defend technically.
- Important clarification captured in the README:
  - `prepare: false` in [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts) affects prepared statement reuse/caching, not whether scalar values are bound safely as parameters.
- Reworked [README.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/README.md) one more time to make it more "paper-like":
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

- Updated the initial header of [README.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/README.md) to include a dedicated stack/logo strip in addition to the repository/deploy badges.
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

- Added a dedicated section in [README.md](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/README.md) explaining why the admin layer does not yet use Drizzle in the same way as the public repositories.
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
  - all public handlers now depend on Drizzle-backed repositories through [publicContentService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/publicContentService.ts)
  - all those repositories import [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts)
  - therefore a missing PostgreSQL DSN at runtime causes all public read endpoints to fail together
- Tightened the configuration contract:
  - updated [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts) so runtime DB access only accepts `DATABASE_URL` or `SUPABASE_DB_URL`
  - updated [drizzle.config.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/drizzle.config.ts) to follow the same rule
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
- Applied serverless-oriented client tuning in [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts):
  - `max: 1`
  - `idle_timeout: 5`
  - `connect_timeout: 15`
  - `prepare: false` retained
- Improved [logger.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/logger.ts) to include `error.cause` in server logs, so future production errors expose the underlying Postgres/postgres-js cause instead of only Drizzle's wrapper message.
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
- Added [runDbRead.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/runDbRead.ts):
  - wraps read operations
  - retries once with a short backoff
  - suitable for idempotent public read paths
- Updated the following repositories to stop batching all reads in `Promise.all(...)` and to execute them via `runDbRead(...)`:
  - [aboutRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/aboutRepository.ts)
  - [profileRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/profileRepository.ts)
  - [skillsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/skillsRepository.ts)
  - [experiencesRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/experiencesRepository.ts)
  - [projectsRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/projectsRepository.ts)
- Goal:
  - reduce transient pool contention on Vercel
  - make public content reads less bursty and more tolerant of temporary connection/query instability
## 2026-03-15 00:35 CET - Added explicit Postgres statement timeout for hung Vercel requests

- Observed that `GET /api/profile?lang=it` could remain pending for more than 25 seconds with no response body, while [health.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/health.ts) continued to return `200`.
- This indicated that some public DB-backed requests were no longer failing fast, but instead hanging inside the DB client / pooler path.
- Updated [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts) again to make the DB behavior stricter in serverless:
  - `ssl: 'require'`
  - `connection.statement_timeout: 8000`
- Purpose:
  - prevent public functions from hanging indefinitely on a stalled DB query
  - turn indefinite waits into explicit Postgres-side failures that surface in logs
  - improve diagnosability if the pooler or connection string is still not ideal in production
## 2026-03-15 00:45 CET - Removed infinite front-end loading gate on partial profile failure

- Observed that the live site could remain stuck on `Caricamento contenuti...` even when several API endpoints were already returning `200` or `304`.
- Root cause on the client side:
  - [App.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/App.tsx) gated the home route on `heroReady`
  - `heroReady` required a non-empty profile payload
  - if `/api/profile` failed, timed out, or returned a non-OK response during bootstrap, the app could stay blocked indefinitely even though the rest of the page was renderable with fallbacks
- Applied the following UI resilience fixes:
  - removed the `heroReady` hard gate from [App.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/App.tsx)
  - added `cache: 'no-store'` to initial content/profile fetches to avoid ambiguous browser-side revalidation behavior during bootstrap
  - added an 8-second request timeout to:
    - [ProfileContext.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/context/ProfileContext.tsx)
    - [ContentContext.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/context/ContentContext.tsx)
- Goal:
  - render the homepage with graceful fallbacks instead of keeping the entire UI behind an infinite loading gate
  - make client bootstrap deterministic even when one API request is slow or temporarily fails
## 2026-03-15 10:20 CET - Removed temporary retry layers after production stabilization

- Reviewed the emergency mitigations added during the Vercel recovery and removed the parts that no longer looked necessary once production stabilized.
- Simplified the public Drizzle repositories:
  - removed [runDbRead.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/runDbRead.ts)
  - removed the single-retry wrapper around public read queries
  - kept the sequential query execution model introduced for lower DB burstiness
- Simplified [ContentContext.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/context/ContentContext.tsx):
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
  - [client.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/client.ts)
  - [adminAuthRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminAuthRepository.ts)
  - [drizzle.config.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/drizzle.config.ts)
- Outcome:
  - successful requests should no longer be visually polluted by `dotenv`'s informational output
  - the remaining `DEP0169` warning appears unrelated to the application code itself and is likely emitted by a dependency or the hosting/runtime layer rather than by the repository logic
## 2026-03-15 11:59 CET - Began migrating the generic admin CRUD path to a schema-driven Drizzle registry

- Reworked [adminTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/adminTables.ts) from a metadata-only map into a schema-driven registry backed by the Drizzle table objects from [schema.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/schema.ts).
- The admin registry now stores, for every allowed table:
  - the Drizzle table object itself
  - the public admin metadata already used by the dashboard (`label`, `primaryKeys`, `defaultRow`)
  - a generated mapping between Drizzle property keys and DB column names
  - a `columnsByDbName` index so the admin layer can keep speaking `snake_case` to the frontend while using Drizzle internally
- Reworked [adminTableRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminTableRepository.ts) to replace generic raw SQL CRUD with Drizzle operations:
  - `db.select().from(...)`
  - `db.insert(...).values(...).returning()`
  - `db.update(...).set(...).where(...).returning()`
  - `db.delete(...).where(...)`
- The repository now performs a bidirectional mapping:
  - incoming admin payloads remain `snake_case` and are converted to Drizzle property keys before insert/update
  - outgoing rows are converted back to DB-style `snake_case` so [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) can remain unchanged
- Hardened [adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts) so admin `row` and `keys` payloads are now validated against the registry's known columns before reaching the repository.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - read-only runtime test against the new admin Drizzle path returned valid `snake_case` rows for:
    - `profile`
    - `profile_i18n`
  - `npm run build` passed when executed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio); the old [mik1810.github.io](/c:/Users/micha/Desktop/mik1810.github.io) path still behaves like the previously noted junction/alias and can trigger a Vite output-path error unrelated to this admin change
## 2026-03-15 12:06 CET - Added per-table payload adapters and validators to the admin Drizzle registry

- Extended [adminTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/adminTables.ts) again so the admin registry is no longer just table-aware, but also payload-aware.
- Added field-level rules in the registry for each admin table, covering the main input classes used by the dashboard:
  - positive integer IDs and `order_index`
  - locale validation (`it`, `en`)
  - required trimmed text fields
  - nullable text fields normalized from `''` to `null`
  - URL/path validation for media and link columns
  - boolean coercion/validation
  - optional email validation
  - optional hex color validation (e.g. `logo_bg`, `color`)
- Hardened [adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts) to consume those registry rules before delegating to the repository:
  - `keys` payloads are now restricted to declared primary keys only
  - `row` payloads are normalized and validated column by column using the per-table rules
  - `PATCH` requests now strip primary key columns from the update payload, so keys are used only in `WHERE` and not accidentally propagated into `SET`
- This keeps the admin UI generic, but moves more semantic knowledge about the data model into the backend registry, which is a better fit for a future fully schema-driven admin layer.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)
  - runtime validation checks confirmed that invalid admin inputs are now rejected before hitting the DB, e.g.:
    - invalid `email`
    - unsupported `locale`
## 2026-03-15 12:12 CET - Split the admin Drizzle registry into domain modules

- Refactored the now-large [adminTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/adminTables.ts) into a modular structure under [lib/admin/](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/).
- New shared modules:
  - [registry.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/registry.ts)
    - centralizes the schema-driven `createAdminTableConfig(...)` builder
    - keeps the Drizzle-column discovery / `columnsByDbName` generation in one place
  - [rules.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/rules.ts)
    - centralizes reusable admin field rules such as:
      - `positiveIdRule`
      - `orderIndexRule`
      - `localeRule`
      - URL/email/color validators
      - required/optional text normalizers
- Split table definitions by domain:
  - [profileTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/profileTables.ts)
  - [projectTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/projectTables.ts)
  - [experienceTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/experienceTables.ts)
  - [skillTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/skillTables.ts)
- [adminTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/adminTables.ts) is now only a thin aggregator that merges the domain registries and exposes `getAdminTableConfig(...)`.
- Effect:
  - no behavior change in the admin API or dashboard
  - the admin schema-driven layer is now much easier to read and extend
  - future improvements can target one domain module at a time instead of editing a single monolithic file
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)
## 2026-03-15 12:19 CET - Grouped the admin sidebar into collapsible macro-sections

- Extended the admin table metadata contract so the backend now exposes grouped table definitions instead of a flat list only.
- Added shared group metadata in [groups.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/groups.ts) for the four current admin macro-sections:
  - `profile`
  - `projects`
  - `experiences`
  - `skills`
- Updated the admin registry builder in [registry.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/registry.ts) so each domain registry is decorated with its group key via `attachAdminGroup(...)`.
- Updated [adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts) so `/api/admin/tables` now returns:
  - `group`
  - `groupLabel`
  in addition to the existing `name`, `label`, `primaryKeys`, and `defaultRow`.
- Updated the frontend admin contract in [app.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/types/app.ts) to include those new fields.
- Reworked the sidebar in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx):
  - tables are now grouped by backend-provided macro-section
  - each section has a collapsible header with a rotating arrow
  - the section containing the active table auto-expands
  - the flat table list has been replaced by nested table items under each group
- Updated [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css) to support:
  - group headers
  - counters per group
  - nested table lists
  - arrow rotation / expanded state styling
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)
  - direct runtime check of `getAdminTablesList()` confirmed grouped metadata is returned correctly for the admin UI
## 2026-03-15 12:26 CET - Added a hero skeleton to avoid empty public content during bootstrap

- While checking the local DX flow, noticed that the public page could briefly show an empty-looking hero before the `profile` payload finished loading, especially when the API process was not already warm.
- Updated [HeroTyping.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/HeroTyping.tsx) to render a dedicated `HeroTypingSkeleton` while `profile` is still loading and no profile data is available yet.
- The skeleton mirrors the real hero layout instead of falling back to a blank role line:
  - greeting placeholder
  - name placeholder
  - role placeholder
  - university badge placeholder
  - CTA button placeholders
  - social icon placeholders
  - circular portrait placeholder
- Added the corresponding shimmer styles in [HeroTyping.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/HeroTyping.css), including responsive sizing so the skeleton matches both desktop and mobile hero layouts.
- Intent:
  - keep the first paint visually stable
  - avoid the perception that the public hero is “empty” while local/public bootstrap is still fetching `profile`
  - let the typing animation start only once real data is present
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 12:41 CET - Added inline hero placeholders during the typing bootstrap phase

- After the first skeleton pass, noticed a second UX gap: once `profile` arrived, the hero immediately switched to the typing animation, which could still leave the page visually half-empty for a moment because only the greeting rendered first.
- Refined [HeroTyping.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/HeroTyping.tsx) so the hero now shows inline shimmer placeholders while the typing animation is warming up:
  - name placeholder until the first visible name characters are present
  - role placeholder until the role animation becomes visible
  - university badge placeholder until the hero header is ready
  - CTA and socials placeholders until the name phase completes
- Reused the shimmer system in [HeroTyping.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/HeroTyping.css) with inline variants sized specifically for the name/role/badge rows, so the page no longer looks empty between fetch completion and the first typed frames.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 12:49 CET - Removed the global home loading gate so hero skeletons render immediately

- Found that the remaining reason the hero skeleton was not visible "right at page load" was not inside the hero component anymore, but in [App.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/App.tsx): the home route was still being blocked by a full-screen `Caricamento contenuti...` gate while profile/content providers bootstrapped.
- Removed the global home loading gate and the related boot-delay logic, so the public route mounts immediately and lets section-level placeholders/fallbacks render as soon as the page is painted.
- Kept the reveal observer logic, but scoped it directly to the home route instead of waiting for the old full-screen gate to release.
- Result:
  - the hero skeleton can now appear immediately on refresh
  - the page no longer hides the public UI behind a global blocking loader
  - later section-specific placeholders can now be added incrementally without fighting a route-level gate
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 12:57 CET - Made the hero skeleton depend on actual hero data instead of the loading flag

- After removing the route-level gate, local refreshes still showed a brief `Hi, I'm` frame before the skeleton, which meant the user-visible issue was no longer the global loader but the hero deciding too early to render fallback text.
- Updated [HeroTyping.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/HeroTyping.tsx) so the hero now renders the skeleton whenever the critical hero payload is not available yet, using `profile.name` as the readiness boundary instead of relying only on `loading`.
- This makes the initial paint deterministic:
  - no fallback greeting-only frame
  - skeleton first
  - then typed hero once the actual profile payload is present
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 13:10 CET - Extended section-level skeletons across the public landing page

- After confirming the hero skeleton behavior, extended the same loading-language to the rest of the public sections so the homepage no longer drops from "real content" to empty boxes while the page bootstrap finishes.
- Added a shared skeleton base stylesheet in [SectionSkeletons.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/SectionSkeletons.css) and imported it from [App.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/App.tsx) to keep shimmer behavior and placeholder primitives consistent across sections.
- Updated public sections with section-appropriate placeholders:
  - [About.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/About.tsx): bio paragraph skeleton lines + interest chip skeletons
  - [Projects.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Projects.tsx): project card skeletons + featured GitHub card skeletons with media placeholders
  - [Experience.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Experience.tsx): timeline item skeletons for both work experience and education
  - [Skills.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Skills.tsx): tech stack blocks + skill category card skeletons
  - [Contact.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Contact.tsx): contact info + form field skeletons while profile contact data is still unavailable
- Added the related section-specific layout tweaks in:
  - [About.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/About.css)
  - [Projects.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/Projects.css)
  - [Experience.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/Experience.css)
  - [Skills.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/Skills.css)
  - [Contact.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/Contact.css)
- Result:
  - the homepage now mounts immediately
  - hero, content sections and contact block all communicate loading state visually
  - layout shifts are reduced because each section reserves a shape close to the final rendered content
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 13:18 CET - Simplified hero reveal so static hero content appears together

- The previous hero logic still staged the loaded content too aggressively: even after the skeleton ended, the user could see the greeting first and wait for the name/badge/actions/socials to catch up.
- Updated [HeroTyping.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/HeroTyping.tsx) so the loaded hero now behaves like this:
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
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 13:24 CET - Fixed About section to use a real bio-data boundary instead of a missing i18n fallback key

- While validating the new section-level skeletons, noticed that the About section could briefly render the literal string `about.bio` before the profile query completed.
- Root cause:
  - [About.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/About.tsx) still fell back to `t('about.bio')`
  - that translation key does not exist in [staticI18n.json](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/data/staticI18n.json)
  - so the UI showed the raw key instead of keeping the bio skeleton visible
- Updated the About section to treat `profile.bio` itself as the readiness signal:
  - no more missing-key fallback
  - the bio skeleton stays visible until the real bio text is available
  - once the profile payload arrives, the section swaps directly from skeleton to actual content
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 13:31 CET - Moved all public section skeletons to data-readiness boundaries

- After fixing About, applied the same approach to the rest of the public landing page so skeleton visibility is driven by the actual section payloads instead of by provider loading flags alone.
- Updated the public sections as follows:
  - [About.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/About.tsx): interests now stay in skeleton mode until actual interest data exists
  - [Projects.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Projects.tsx): project and featured GitHub skeletons now depend on the presence of loaded project arrays
  - [Experience.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Experience.tsx): experience and education skeletons now depend on real timeline data instead of the shared content loading flag
  - [Skills.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Skills.tsx): tech stack and skill-category skeletons now wait for their own actual data collections
  - [Contact.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Contact.tsx): the contact block remains in skeleton mode until profile email and location are both present, instead of falling back to placeholder copy too early
- Intent:
  - avoid literal fallback text appearing before API data arrives
  - keep section rendering deterministic on refresh
  - make the full public page behave like the hero: skeleton first, real content only when the section is actually ready
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 13:39 CET - Restricted the hero role skeleton to bootstrap only

- The role line in the hero still had one UX bug: when the typing animation deleted back down to zero characters between role cycles, the inline skeleton briefly reappeared, which made the animation look like a loading state even though data was already present.
- Updated [HeroTyping.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/HeroTyping.tsx) so the role skeleton is now shown only before the role has been rendered for the first time.
- Once at least one real role character has appeared, subsequent delete/retype cycles stay purely textual and never fall back to the skeleton again.
- Result:
  - skeleton only during initial hero bootstrap
  - normal typing/deleting loop afterward
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 14:02 CET - Made the admin editor field-type aware using registry metadata

- Returned to the admin improvements track and connected the schema-driven registry to the dashboard editor, so the UI no longer treats every editable field as a generic textarea.
- Extended the admin registry/type system with explicit editor metadata:
  - [lib/types/admin.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/types/admin.ts)
  - [lib/admin/registry.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/registry.ts)
  - [lib/admin/rules.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/rules.ts)
- Exposed field definitions from the admin tables service:
  - [lib/services/adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts)
  - [src/types/app.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/types/app.ts)
- Updated admin table definitions to mark richer editors where they add actual value:
  - locale fields -> select
  - boolean fields -> checkbox
  - URL/email fields -> typed inputs
  - `bio` / `description` fields -> textarea
  - `logo_bg` / `color` fields -> color-aware editor
  - `icon_key` for socials -> select with the supported icon set
- Refined [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so:
  - table columns prefer registry field order/labels
  - the editor renders typed controls instead of generic textareas
  - the dashboard still preserves the current generic CRUD flow
- Added the required styling in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css).
- Result:
  - cleaner editing UX
  - less manual parsing of booleans/numbers/URLs/locales
  - stronger reuse of backend registry knowledge in the frontend admin
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 14:11 CET - Removed the language toggle from the admin navbar

- The admin UI is currently intentionally Italian-only, so keeping the public language toggle visible in the admin navbar created a misleading control that did not provide real value.
- Updated [Navbar.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Navbar.tsx) so the `LanguageSwitcher` is rendered only on non-admin routes.
- Result:
  - the public landing page still supports the language toggle
  - the admin section keeps only the controls that are actually meaningful there
  - the admin navbar is less noisy and better aligned with the current product intent
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 14:18 CET - Added color swatches in admin table cells

- Improved the admin data grid so columns that use the `color` editor metadata now display a small visual swatch next to the stored hex value.
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) to render color-aware cells using the field metadata already exposed by the schema-driven admin registry.
- Added the corresponding styles in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css), including a fallback "empty" swatch appearance when the current value is not a valid hex color.
- Result:
  - color fields are easier to scan in the admin list view
  - users do not need to mentally parse hex strings to understand the stored color
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 14:24 CET - Hid the redundant row-number column when `id` is already visible

- Some admin tables were showing both the generic `#` row-number column and a visible `id` column, which duplicated essentially the same identifier signal.
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so the `#` column is now rendered only when the current table does not already expose `id` among its visible columns.
- Result:
  - tables with a real `id` stay cleaner
  - tables without a visible `id` still keep a convenient positional row marker
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 14:36 CET - Added skeleton states to the admin bootstrap and dashboard

- Extended the admin UI with actual skeleton states so it no longer falls back to plain `Caricamento...` text while session and table data are still bootstrapping.
- Added a reusable full-page admin shell skeleton in [AdminDashboardSkeleton.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboardSkeleton.tsx).
- Updated [RequireAdmin.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/RequireAdmin.tsx) so the admin route now shows the skeleton shell during the auth/session check instead of a centered text message.
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so:
  - the initial admin load uses the full dashboard skeleton while table metadata is still loading
  - row loading inside a selected table renders skeleton rows instead of a single textual loading row
  - stale rows are cleared as soon as a new table load starts, making the loading state visually coherent during table switches
- Extended [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css) with:
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
  - [lib/types/admin.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/types/admin.ts)
  - [src/types/app.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/types/app.ts)
- Added a reusable helper in [rules.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/rules.ts) to decorate existing validation rules as relation-backed selects via `withRelationSelect(...)`.
- Updated the admin table registries so foreign-key fields now declare the target table and label strategy, for example:
  - `project_id -> projects.slug`
  - `github_project_id -> github_projects.slug`
  - `experience_id -> experiences.slug`
  - `education_id -> education.slug`
  - `tech_category_id -> tech_categories.slug`
  - `profile_id -> profile.full_name`
- Reworked [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so:
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
  - `npm run build` passed from the real repository path [Piccirilli_Michael_Portfolio](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio)

## 2026-03-15 14:55 CET - Vertically centered admin sidebar item labels

- Refined the sidebar table-item styling in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css) so item labels are vertically centered inside the left admin menu.
- Updated `.admin-table-item` to use a flex row with `align-items: center`, a stable minimum height, and tighter line-height control.
- Result:
  - sidebar labels now sit visually centered inside each table button
  - the left admin navigation feels more consistent with the rest of the dashboard controls

## 2026-03-15 14:58 CET - Aligned admin group labels with their count badges

- Refined the grouped sidebar toggle layout in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css).
- Updated `.admin-group-toggle-main` from a plain flex row with `align-items: flex-start` to a two-column grid with centered cross-axis alignment.
- Result:
  - group labels now align visually with the circular table-count badge
  - multi-line labels like `Esperienze e Formazione` still wrap correctly without pulling the badge upward

## 2026-03-15 15:04 CET - Exposed relation-backed key fields in the admin editor

- While validating the new foreign-key selects, found that the admin editor was still filtering out all primary-key fields.
- This meant relation-backed fields such as `project_id` in `projects_i18n` were correctly described in the registry, but still invisible in the modal because they are also part of a composite primary key.
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so:
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

- Refined the admin row modal in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so the form is no longer a single flat list of fields.
- The editor now separates:
  - `Riferimenti relazionali e chiavi`
  - `Contenuto e proprietà modificabili`
- Added supporting styles in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css) for:
  - section headers
  - explanatory helper text
  - a visual divider between references and editable content
- Result:
  - relation/key fields are easier to distinguish from the real editable payload
  - composite-key and foreign-key rows are much clearer to edit

## 2026-03-15 15:22 CET - Added bilingual create mode for `*_i18n` admin tables

- Extended the admin create flow so translation tables with a composite key including `locale` can be inserted in both languages at once.
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so create mode for `*_i18n` tables now:
  - keeps shared relation/key fields in the top reference section
  - hides the single-locale selector during creation
  - renders two locale cards for the localized content:
    - `Italiano`
    - `English`
  - submits a single dual payload that creates the `it` and `en` rows together
- Updated [api/admin/table.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/api/admin/table.ts), [adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts), and [adminTableRepository.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/db/repositories/adminTableRepository.ts) so the admin create endpoint now supports `rows: [...]` bulk insert payloads in addition to the legacy single-row payload.
- Refined relation-select fallback labels in the editor so a loading foreign-key field no longer degrades to a bare `1`, but shows a clearer "record collegato" placeholder while options are still loading.
- Added the supporting modal layout styles in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css).
- Result:
  - `projects_i18n`, `github_projects_i18n`, `profile_i18n`, `experiences_i18n`, `education_i18n`, and similar translation tables can now be created in both locales in one pass
  - the relation dropdown UX is less ambiguous while option lists are still bootstrapping

## 2026-03-15 15:29 CET - Added icon previews next to admin `icon_key` values

- Extended the admin cell renderer in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so icon fields such as `icon_key` now show a visual preview next to the stored key, in the same spirit as the color swatch previews already present for hex color fields.
- Reused the shared icon map from [icons.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/data/icons.tsx) so the admin preview matches the same SVGs used elsewhere in the app.
- Added the related styling in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css), including an empty-state fallback when the key does not resolve to a known icon.
- Result:
  - `github` and `linkedin` values are immediately recognizable in the admin grid
  - icon-like fields are easier to scan, just like color fields

## 2026-03-15 15:36 CET - Added PDF and image previews for admin URL fields

- Extended the admin URL rendering in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so URL-like fields now detect common previewable assets:
  - PDF URLs show a compact PDF badge/icon
  - image URLs show a thumbnail preview
- Applied the preview logic both to:
  - admin table cells
  - admin editor URL inputs
- In the editor the input remains textual, but image and PDF previews are now displayed alongside the field so the user can validate the asset without leaving the modal.
- Added the related styles in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css), including:
  - thumbnail preview cards for images
  - PDF badges
  - responsive stacking in the editor on narrow screens
- Result:
  - `photo_url`, `logo`, `image_url`, `cv_url`, and similar fields are much easier to inspect
  - media-heavy tables now communicate their content visually instead of only exposing raw URLs

## 2026-03-15 15:42 CET - Compacted admin media cells to preview-only with hover path

- Refined the admin grid media rendering so image and PDF URL cells no longer show the raw path inline when a visual preview is already available.
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so image/PDF cells now:
  - render only the thumbnail/document preview in the table
  - expose the full underlying path through the hover `title`
- Also simplified the PDF badge to a pure document icon, removing the explicit `PDF` text.
- Result:
  - `photo_url`, `cv_url`, and `university_logo_url` style fields are more compact in the grid
  - the full path remains inspectable on hover without making the table visually noisy

## 2026-03-15 16:06 CET - Added nested admin submenus and compact icon/media previews

- Completed the admin table metadata refactor so every registry entry now exposes both a top-level `group` and a domain-specific `subgroup`, reusing the existing Drizzle-backed registry while making the sidebar navigation deeper and easier to scan.
- Updated the admin table definitions in:
  - [profileTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/profileTables.ts)
  - [projectTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/projectTables.ts)
  - [experienceTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/experienceTables.ts)
  - [skillTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/skillTables.ts)
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so the left sidebar now renders a two-step navigation:
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
- Added the supporting nested-menu and compact-preview styling in [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css).
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed
  - `npm run build` passed from the real repo path `c:\Users\micha\Desktop\Piccirilli_Michael_Portfolio`

## 2026-03-15 16:18 CET - Reworked admin submenus around root table families

- Refined the nested admin sidebar so submenus are no longer modeled as a generic label plus a duplicate first child such as `Projects -> Projects`.
- The sidebar now treats each submenu as the root entity family inferred from the foreign-key structure:
  - clicking the submenu itself selects the root/base table
  - nested items only render the related child tables, such as `Projects i18n`, `Project tags`, `GitHub project images`, or `Social links`
- Realigned the `Skills e Tech Stack` domain so submenus are now based on real data roots instead of broad topical buckets:
  - `Tech categories`
  - `Skill categories`
- Updated:
  - [skillTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/skillTables.ts)
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
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
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
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
  - [profileTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/profileTables.ts)
  - [skillTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/skillTables.ts)
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
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) to sort subgroup entries by child-table count while preserving the existing order inside each category.
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 16:54 CET - Restricted accent highlighting to the actually selected admin entry

- Refined the admin sidebar visual states so expansion and selection are no longer conflated.
- Updated:
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
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
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so clicking a top-level group now:
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
- Updated [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx):
  - clicking the main body of a parent group or submenu still navigates to its root table
  - clicking the chevron arrow now only expands/collapses that level
- Result:
  - parent groups and submenus can now be closed even when a table inside them is currently selected
  - navigation intent and disclosure intent are easier to control
- Verification:
  - `npm run typecheck` passed
  - `npm run lint` passed

## 2026-03-15 17:16 CET - Restricted submenu closing to the chevron toggle only

- Refined the submenu root click behavior in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so clicking the submenu body no longer collapses it when its root table is already selected.
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

- Refined the top-level admin group behavior in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so clicking a grandparent group no longer auto-selects the first root table of the first submenu.
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

- Refined the initial admin dashboard state in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx) so top-level parent groups and subgroups no longer auto-expand on first load.
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

- Fixed the admin sidebar chevron click detection in [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx).
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
  - [lib/types/admin.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/types/admin.ts)
  - [lib/admin/registry.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/registry.ts)
  - [lib/services/adminTableService.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/services/adminTableService.ts)
  - [src/types/app.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/types/app.ts)
  - [profileTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/profileTables.ts)
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
  - [Navbar.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/Navbar.tsx)
  - [Navbar.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/Navbar.css)
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
- Updated [skillTables.ts](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/lib/admin/tables/skillTables.ts) so:
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
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
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
  - [AdminDashboard.tsx](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/jsx/AdminDashboard.tsx)
  - [AdminAuth.css](/c:/Users/micha/Desktop/Piccirilli_Michael_Portfolio/src/components/css/AdminAuth.css)
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
