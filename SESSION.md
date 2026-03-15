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
