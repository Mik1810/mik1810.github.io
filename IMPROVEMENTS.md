# IMPROVEMENT.md

## Obiettivo del documento

Questo file raccoglie in forma operativa le migliorie già discusse per il branch `dev` della repo, aggiungendo:

- priorità
- effort stimato
- ordine consigliato di implementazione
- struttura ideale completa della repo

L’idea è trasformare il progetto da portfolio avanzato con backend a base solida, manutenibile e pronta a crescere.

---

# 1. Contesto attuale

Il branch `dev` mostra già una struttura più evoluta di un semplice sito statico:

- frontend React + Vite
- backend serverless in `api/` su Vercel
- Supabase per database e autenticazione admin
- contenuti multilingua con tabelle `_i18n`
- caching server-side
- separazione tra progetti manuali e GitHub projects

Questo significa che il focus non dovrebbe essere solo aggiungere feature, ma consolidare il progetto su quattro assi:

1. architettura
2. affidabilità del backend
3. qualità dell’esperienza utente
4. facilità di evoluzione futura

---

# 2. I 3 pilastri architetturali da fare prima

## 2.1 Repository layer

### Cosa significa
Spostare le query DB fuori dagli endpoint e centralizzarle in file dedicati.

### Problema attuale
Le query sono sparse negli endpoint e la logica dati è troppo vicina alla logica HTTP.

### Obiettivo
Creare un livello unico che si occupa solo di accesso ai dati.

### Benefici
- endpoint più puliti
- query riusabili
- meno duplicazione
- più facilità nel cambiare schema o ORM
- migliore testabilità

### Esempio di responsabilità
- `projectsRepo.ts`: legge progetti e traduzioni
- `githubProjectsRepo.ts`: legge progetti GitHub e immagini
- `contactsRepo.ts`: gestisce eventuali messaggi contatto

### Priorità
Alta

### Effort stimato
Medio

### Quando farlo
Subito dopo la base TypeScript lato backend.

---

## 2.2 Service layer

### Cosa significa
Introdurre un livello sopra i repository che compone i dati e implementa la logica applicativa.

### Problema attuale
Gli endpoint fanno troppo: leggono dal DB, uniscono i dati, applicano filtri, costruiscono il payload finale.

### Obiettivo
Lasciare agli endpoint solo il compito di gestire HTTP e spostare la logica applicativa in servizi dedicati.

### Benefici
- separazione chiara delle responsabilità
- codice più leggibile
- logica riusabile anche in più endpoint o pagine
- backend più professionale

### Esempio di responsabilità
- `projectsService.ts`: restituisce il payload finale di portfolio projects + GitHub projects
- `adminProjectsService.ts`: crea, aggiorna, ordina e valida dati admin

### Priorità
Alta

### Effort stimato
Medio

### Quando farlo
Insieme o subito dopo il repository layer.

---

## 2.3 Migrazione graduale a TypeScript

### Cosa significa
Tipizzare progressivamente backend, helper e frontend invece di fare un rewrite totale.

### Problema attuale
Molti mapping e strutture dati sono vulnerabili a errori di chiavi, shape dei payload e campi opzionali.

### Obiettivo
Ridurre errori silenziosi e avere tipi chiari su:

- request/response API
- payload dal DB
- dati passati al frontend
- schema ORM

### Benefici
- meno bug
- migliore manutenzione
- integrazione naturale con Drizzle
- maggiore chiarezza del codice

### Ordine ideale
1. `lib/`
2. `api/`
3. `src/`
4. schema ORM e repository completi

### Priorità
Alta

### Effort stimato
Medio-Alto

### Quando farlo
Prima di introdurre seriamente l’ORM in tutta la codebase.

---

# 3. Roadmap operativa con priorità, effort e ordine di implementazione

## Fase 0 — Setup di qualità minimo

### Interventi
- aggiungere `typescript`
- aggiungere `@types/node`
- creare `tsconfig.json`
- aggiungere script `typecheck`
- introdurre ESLint e Prettier

### Priorità
Alta

### Effort
Basso

### Impatto
Alto

### Ordine
Prima di tutto

### Deliverable
- progetto pronto a migrare gradualmente in TS
- standard minimi di qualità attivi

---

## Fase 1 — Migrazione backend core a TypeScript

### Interventi
- migrare `lib/supabaseAdmin.js` → `lib/supabaseAdmin.ts`
- migrare `requireAdminSession.js` e helper auth
- tipizzare request/response base per Vercel functions
- migrare `api/projects.js` a `api/projects.ts`

### Priorità
Alta

### Effort
Medio

### Impatto
Molto alto

### Ordine
Subito dopo la Fase 0

### Deliverable
- backend più robusto
- tipi chiari per endpoint e servizi

---

## Fase 2 — Repository layer + service layer

### Interventi
- creare `lib/db/repositories/`
- spostare le query dagli endpoint ai repository
- creare `lib/services/`
- ridurre gli endpoint a logica HTTP + chiamata service

### Priorità
Alta

### Effort
Medio

### Impatto
Molto alto

### Ordine
Dopo la Fase 1

### Deliverable
- backend pulito
- query e logica applicativa separate
- base ideale per ORM e test

---

## Fase 3 — Introduzione di Drizzle ORM

### Interventi
- installare `drizzle-orm`, `drizzle-kit`, `postgres`
- creare `lib/db/client.ts`
- creare `lib/db/schema.ts`
- introdurre gradualmente repository basati su Drizzle
- lasciare Supabase per auth/sessione

### Priorità
Alta

### Effort
Medio

### Impatto
Alto

### Ordine
Dopo che backend e architettura sono già ordinati

### Deliverable
- schema centralizzato
- query tipizzate
- migliore manutenibilità

---

## Fase 4 — Hardening backend

### Interventi
- validazione input con Zod
- rate limiting su endpoint pubblici
- migliore gestione errori
- logging strutturato minimo
- controllo più esplicito admin/ruoli

### Priorità
Alta

### Effort
Medio

### Impatto
Alto

### Ordine
Subito dopo l’assestamento del layer dati

### Deliverable
- backend più sicuro e prevedibile
- riduzione bug e spam

---

## Fase 5 — Migliorie database

### Interventi
- unique `(project_id, locale)` e simili per tabelle `_i18n`
- indici su `locale`, `project_id`, `order_index`, `featured`
- eventuale revisione tag se servono filtri avanzati
- valutare `contact_messages`

### Priorità
Media-Alta

### Effort
Basso-Medio

### Impatto
Alto

### Ordine
In parallelo o subito dopo l’introduzione dell’ORM

### Deliverable
- schema più robusto
- query più veloci
- meno incoerenze dati

---

## Fase 6 — UI/UX ad alto impatto

### Interventi
- filtri nella sezione Projects
- ricerca progetti
- skeleton loading
- animazioni leggere più curate
- miglior form contatti
- dark mode rifinita

### Priorità
Media-Alta

### Effort
Medio

### Impatto
Molto alto lato percezione utente

### Ordine
Dopo che il backend è abbastanza stabile

### Deliverable
- portfolio più navigabile
- UX più moderna
- qualità percepita molto più alta

---

## Fase 7 — Pagina singola progetto

### Interventi
- creare route `/projects/[slug]`
- mostrare gallery, stack, descrizione lunga, link, screenshot
- riusare contenuti esistenti e preparare campi extra dove necessario

### Priorità
Alta

### Effort
Medio-Alto

### Impatto
Molto alto su UX e SEO

### Ordine
Tra le prime feature strutturali dopo il consolidamento del backend

### Deliverable
- portfolio più professionale
- storytelling tecnico reale
- maggiore valore dei progetti

---

## Fase 8 — SEO e performance

### Interventi
- metadati migliori
- Open Graph dinamico
- sitemap.xml
- structured data JSON-LD
- ottimizzazione immagini WebP/AVIF
- lazy loading
- monitoraggio Lighthouse / Web Vitals

### Priorità
Media

### Effort
Medio

### Impatto
Alto

### Ordine
Dopo la pagina progetto singolo o in parallelo

### Deliverable
- migliore indicizzazione
- caricamento più rapido
- sito più competitivo

---

## Fase 9 — Dashboard admin

### Interventi
- creare `/admin`
- CRUD progetti
- gestione featured/order
- gestione traduzioni
- gestione messaggi contatto se presenti

### Priorità
Media

### Effort
Alto

### Impatto
Molto alto nel lungo periodo

### Ordine
Dopo che dati, auth e validazione sono stabili

### Deliverable
- gestione contenuti molto più efficiente
- meno interventi manuali nel DB

---

## Fase 10 — Sync GitHub automatica

### Interventi
- endpoint cron tipo `/api/cron/github-sync`
- sincronizzazione metadata tecnici dei repo
- mantenere in DB i contenuti editoriali e i18n

### Priorità
Media

### Effort
Medio

### Impatto
Medio-Alto

### Ordine
Dopo il consolidamento del layer dati

### Deliverable
- portfolio più vivo
- manutenzione ridotta

---

# 4. Matrice sintetica priorità / effort / impatto

| Intervento | Priorità | Effort | Impatto |
|---|---|---:|---:|
| Setup TypeScript + lint/format | Alta | Basso | Alto |
| Migrazione `lib/` e `api/` a TypeScript | Alta | Medio | Molto alto |
| Repository layer | Alta | Medio | Molto alto |
| Service layer | Alta | Medio | Molto alto |
| Introduzione Drizzle | Alta | Medio | Alto |
| Zod + rate limit + logging | Alta | Medio | Alto |
| Constraint e indici DB | Media-Alta | Basso-Medio | Alto |
| Filtri + ricerca progetti | Media-Alta | Medio | Alto |
| Pagina singola progetto | Alta | Medio-Alto | Molto alto |
| SEO + performance | Media | Medio | Alto |
| Dashboard admin | Media | Alto | Molto alto |
| Sync GitHub automatica | Media | Medio | Medio-Alto |

---

# 5. Ordine di implementazione consigliato

## Step 1
Setup qualità minimo:
- TypeScript
- ESLint
- Prettier
- script `typecheck`

## Step 2
Migrazione di `lib/` e degli endpoint più critici a TypeScript.

## Step 3
Introduzione di repository layer e service layer.

## Step 4
Introduzione di Drizzle come query layer, mantenendo Supabase per auth.

## Step 5
Hardening backend: Zod, rate limit, logging, controlli admin.

## Step 6
Migliorie DB: constraint, indici, pulizia schema.

## Step 7
Feature UX ad alto valore: filtri, ricerca, skeleton.

## Step 8
Pagina singola progetto.

## Step 9
SEO e performance.

## Step 10
Dashboard admin e sync GitHub.

---

# 6. Struttura ideale completa della repo

Questa è una struttura proposta per la crescita del progetto, mantenendo Vite + React + Vercel Functions e separando chiaramente frontend, backend, servizi e dati.

```txt
.
├─ api/
│  ├─ projects.ts
│  ├─ contact.ts
│  ├─ session.ts
│  ├─ login.ts
│  ├─ logout.ts
│  ├─ cron/
│  │  └─ github-sync.ts
│  └─ admin/
│     ├─ projects/
│     │  ├─ index.ts        # GET list / POST create
│     │  ├─ [id].ts         # GET one / PATCH / DELETE
│     │  ├─ reorder.ts
│     │  └─ translate.ts
│     ├─ github-projects/
│     │  ├─ index.ts
│     │  ├─ [id].ts
│     │  └─ reorder.ts
│     ├─ contacts/
│     │  ├─ index.ts
│     │  └─ [id].ts
│     └─ health.ts
│
├─ lib/
│  ├─ auth/
│  │  ├─ authSession.ts
│  │  ├─ requireAdminSession.ts
│  │  └─ roles.ts
│  ├─ db/
│  │  ├─ client.ts
│  │  ├─ schema.ts
│  │  ├─ migrations/
│  │  ├─ seeds/
│  │  └─ repositories/
│  │     ├─ projectsRepo.ts
│  │     ├─ githubProjectsRepo.ts
│  │     ├─ experiencesRepo.ts
│  │     ├─ educationRepo.ts
│  │     └─ contactsRepo.ts
│  ├─ services/
│  │  ├─ projectsService.ts
│  │  ├─ githubProjectsService.ts
│  │  ├─ contactService.ts
│  │  └─ adminProjectsService.ts
│  ├─ validation/
│  │  ├─ projectSchemas.ts
│  │  ├─ contactSchemas.ts
│  │  └─ commonSchemas.ts
│  ├─ cache/
│  │  ├─ memoryCache.ts
│  │  └─ cacheKeys.ts
│  ├─ github/
│  │  ├─ githubClient.ts
│  │  └─ githubSync.ts
│  ├─ utils/
│  │  ├─ errors.ts
│  │  ├─ logger.ts
│  │  ├─ http.ts
│  │  ├─ locale.ts
│  │  └─ env.ts
│  ├─ types/
│  │  ├─ api.ts
│  │  ├─ projects.ts
│  │  ├─ githubProjects.ts
│  │  └─ shared.ts
│  └─ supabase/
│     └─ supabaseAdmin.ts
│
├─ src/
│  ├─ app/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  └─ routes/
│  │     ├─ HomePage.tsx
│  │     ├─ ProjectsPage.tsx
│  │     ├─ ProjectDetailPage.tsx
│  │     ├─ AdminPage.tsx
│  │     └─ NotFoundPage.tsx
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ Header.tsx
│  │  │  ├─ Footer.tsx
│  │  │  └─ Section.tsx
│  │  ├─ home/
│  │  │  ├─ Hero.tsx
│  │  │  ├─ About.tsx
│  │  │  ├─ Skills.tsx
│  │  │  ├─ ProjectsPreview.tsx
│  │  │  └─ Contact.tsx
│  │  ├─ projects/
│  │  │  ├─ ProjectCard.tsx
│  │  │  ├─ ProjectFilters.tsx
│  │  │  ├─ ProjectSearch.tsx
│  │  │  ├─ ProjectGrid.tsx
│  │  │  ├─ ProjectGallery.tsx
│  │  │  └─ ProjectDetail.tsx
│  │  ├─ admin/
│  │  │  ├─ AdminLogin.tsx
│  │  │  ├─ AdminProjectForm.tsx
│  │  │  ├─ AdminProjectTable.tsx
│  │  │  └─ AdminTranslationForm.tsx
│  │  ├─ common/
│  │  │  ├─ Button.tsx
│  │  │  ├─ Input.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Loader.tsx
│  │  │  └─ EmptyState.tsx
│  │  └─ feedback/
│  │     ├─ Skeleton.tsx
│  │     ├─ ErrorMessage.tsx
│  │     └─ Toast.tsx
│  ├─ hooks/
│  │  ├─ useProjects.ts
│  │  ├─ useProjectDetail.ts
│  │  ├─ useAdminSession.ts
│  │  ├─ useTheme.ts
│  │  └─ useDebounce.ts
│  ├─ services/
│  │  ├─ apiClient.ts
│  │  ├─ projectsApi.ts
│  │  ├─ contactApi.ts
│  │  └─ adminApi.ts
│  ├─ state/
│  │  ├─ themeStore.ts
│  │  └─ uiStore.ts
│  ├─ data/
│  │  └─ static/
│  │     ├─ personal.json
│  │     ├─ skills.json
│  │     └─ social.json
│  ├─ i18n/
│  │  ├─ config.ts
│  │  ├─ messages/
│  │  │  ├─ it.json
│  │  │  └─ en.json
│  │  └─ locale.ts
│  ├─ styles/
│  │  ├─ globals.css
│  │  ├─ theme.css
│  │  └─ animations.css
│  ├─ types/
│  │  ├─ project.ts
│  │  ├─ api.ts
│  │  └─ ui.ts
│  └─ utils/
│     ├─ formatDate.ts
│     ├─ formatTags.ts
│     ├─ slug.ts
│     └─ cn.ts
│
├─ public/
│  ├─ images/
│  │  ├─ projects/
│  │  ├─ profile/
│  │  └─ og/
│  ├─ favicon/
│  └─ robots.txt
│
├─ drizzle/
│  ├─ meta/
│  └─ *.sql
│
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ API.md
│  ├─ DB_SCHEMA.md
│  └─ ROADMAP.md
│
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
│
├─ .env.example
├─ drizzle.config.ts
├─ tsconfig.json
├─ vite.config.ts
├─ vercel.json
├─ package.json
└─ IMPROVEMENT.md
```

---

# 7. Come leggere la struttura proposta

## `api/`
Contiene esclusivamente gli endpoint HTTP. Non dovrebbe contenere logica complessa di query o composizione dati.

## `lib/db/repositories/`
Contiene accesso ai dati: query pure, nessuna logica HTTP.

## `lib/services/`
Contiene logica applicativa: aggregazione dati, orchestrazione, regole del dominio.

## `lib/validation/`
Contiene gli schemi Zod.

## `src/services/`
Contiene il client frontend per chiamare le API.

## `src/components/`
Componenti UI organizzati per area funzionale, non per tipo generico.

## `docs/`
Documentazione tecnica utile quando il progetto cresce.

---

# 8. Scelta pratica: cosa lascerei statico e cosa renderei dinamico

## Statico
- dati personali base
- social links
- skill list, se cambiano poco
- parte di contenuti puramente presentazionali

## Dinamico
- projects
- github projects
- eventuali esperienze/education se vuoi gestirle da admin
- contact messages
- traduzioni DB-driven dei contenuti principali

Questa divisione evita overengineering e mantiene semplice ciò che non richiede DB.

---

# 9. Le 5 azioni concrete che farei subito

## 1. Attivare TypeScript, ESLint e Prettier
Per creare una base stabile.

## 2. Migrare `lib/` e `api/projects` a TypeScript
Per ridurre i problemi nel backend più critico.

## 3. Creare repository e services
Per pulire l’architettura.

## 4. Introdurre Drizzle
Per dare al layer dati una struttura forte e tipizzata.

## 5. Implementare filtri, ricerca e pagina singola progetto
Per aumentare subito il valore percepito del portfolio.

---

# 10. Conclusione

La direzione migliore per questa repo non è aggiungere casualmente nuove feature, ma fare un’evoluzione ordinata:

1. consolidare la base tecnica
2. separare bene i livelli dell’architettura
3. tipizzare il backend
4. migliorare il layer dati
5. poi investire su UX, SEO e admin

Seguendo quest’ordine, il progetto resta leggero ma smette di essere fragile, e diventa una base seria per crescere senza accumulare debito tecnico.

