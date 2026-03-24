# TODO.md

## Scopo

Questo file ormai funziona come roadmap corta + status board dei blocchi principali del progetto.

Sono state rimosse:

- le attività già completate
- le attività escluse per scelta progettuale

L'obiettivo è tenere una roadmap corta, reale e utile, senza perdere visibilità su ciò che è già stato chiuso di recente.

### Legenda stato

- `✅ Fatto`: chiuso
- `🟡 Partial`: avviato o completato solo in parte
- `❌ Non fatto`: ancora da affrontare

---

## Stato di partenza

La base del progetto oggi è già solida:

- TypeScript, ESLint, Prettier e CI minima sono attivi
- backend pubblico e admin sono separati in layer `api -> service -> repository`
- Drizzle è introdotto e operativo
- admin schema-driven e UI admin sono già a buon livello
- SEO, performance base e deploy Vercel sono già stati messi in ordine

Quello che segue è quindi soprattutto lavoro residuo, con alcuni blocchi già chiusi lasciati visibili come riferimento di stato.

---

## 1. Hardening backend

### Obiettivo

Rendere il backend più rigoroso lato validazione, sicurezza e comportamento sotto errori.

### Interventi residui

- `✅ Fatto` introdurre validazione input strutturata con Zod come base condivisa per query/body sui principali endpoint pubblici e admin sensibili
- `✅ Fatto` introdurre validazione esplicita delle variabili ambiente all’avvio, con errori chiari su configurazioni mancanti o invalide
- `✅ Fatto` aggiungere rate limiting sui path pubblici più sensibili e su login/admin
- `✅ Fatto` rifinire gestione errori e risposta uniforme delle API sui path principali già hardenizzati
- `✅ Fatto` rafforzare ulteriormente i controlli sul path admin dove serviva di più (`login` e `table`)

### Priorità

Alta

### Effort

Medio

---

## 2. Tooling e manutenzione operativa

### Obiettivo

Ridurre il lavoro manuale di manutenzione e aumentare la visibilità operativa del progetto.

### Interventi residui

- `✅ Fatto` introdotto `Dependabot` per aggiornamenti automatici di dipendenze npm e GitHub Actions con pianificazione settimanale
- `✅ Fatto` aggiungere una health/dashboard minima per stato applicativo e operativo, tramite `/api/health`, `/api/admin/health` e home admin, con:
  - stato DB
  - versione app
  - informazioni minime di integrità pubblica
  - environment, uptime e metadati minimi di deploy lato admin
- `✅ Fatto` consolidare le route admin in un entrypoint serverless unico (`/api/admin` con rewrite da `/api/admin/*`) con handler modulari in `lib/services/admin-routes`, per rientrare nel limite Vercel Hobby sulle function
- `✅ Fatto` rivedere la logica di routing API in ottica limite Vercel Hobby (max 12 Serverless Functions), definendo una strategia stabile di consolidamento/dispatch con dispatcher unificati (`/api/admin` e `api/home`) per evitare nuovi blocchi deploy
- `✅ Fatto` introdurre una disciplina di release leggera, tramite `CHANGELOG.md` e convenzione di tag semver, per esempio:
  - changelog minimo
  - tag coerenti con le versioni
- `✅ Fatto` applicato lo stesso pattern di router unico anche agli endpoint pubblici tramite `api/home`, mantenendo invariati i path HTTP esistenti (`/api/profile`, `/api/about`, ecc.)
- `❌ Non fatto` pianificare upgrade coordinati dei principali stack di tooling (per esempio ESLint e Vite), verificando la compatibilità tra dipendenze prima del merge
- `❌ Non fatto` valutare una tabella di logging accessi/connessioni al sito (solo dati minimi), con verifica preventiva legale/privacy e compliance GDPR prima di qualsiasi implementazione
- `❌ Non fatto` valutare un refactor della struttura cartelle componenti/CSS per migliorare coesione e manutenibilità
- `❌ Non fatto` valutare refactor dei componenti troppo grandi, estraendo sottocomponenti dove utile
- `❌ Non fatto` valutare l'estrazione degli hook locali dei componenti in una cartella condivisa `hooks` dove ha senso

### Priorità

Media

### Effort

Basso-Medio

---

## 3. Hardening schema e database

### Obiettivo

Rendere lo schema più robusto contro inconsistenze e query inefficienti.

### Interventi residui

- `✅ Fatto` confermato che le tabelle `*_i18n` sono gia` protette da chiavi composte `PRIMARY KEY (entity_id, locale)`, quindi l’unicita` locale-base e` gia` garantita
- `✅ Fatto` aggiunti e applicati indici mirati per i path di lettura pubblici piu` usati:
  - `locale` sulle tabelle `*_i18n`
  - `featured + order_index` su `github_projects`
  - dump riallineati dopo la migration
- `✅ Fatto` completato l’audit del modello pubblico: ordine, slug, chiavi composte `*_i18n` e child tables ordinati sono gia` coperti da constraint o unique coerenti con le query attuali

### Priorità

Media-Alta

### Effort

Basso-Medio

---

## 4. Contact flow

### Obiettivo

Rendere la sezione contatti più completa e più resistente, senza complicarla inutilmente.

### Interventi residui

- `✅ Fatto` migliorare stati di successo/errore lato UX
- `✅ Fatto` introdurre un flusso di invio strutturato lato server con Resend, con endpoint dedicato, validazione, test API e fallback UI coerente
- `✅ Fatto` aggiungere protezione minima anti-spam tramite rate limit e honeypot
- `🟡 Partial` sostituire il sender di test `onboarding@resend.dev` con un sender verificato su dominio proprio, se in futuro si vorrà passare a una configurazione pienamente production-grade
- `✅ Fatto` estrarre il template email in un file dedicato, caricarlo a build-time, sostituire i campi dinamici in modo esplicito e rifinirne ulteriormente il layout

### Priorità

Media

### Effort

Medio

---

## 5. Skills, contenuti e discoverability

### Obiettivo

Rendere le sezioni pubbliche più espressive e più collegate tra loro, senza cambiare la filosofia single-page.

### Interventi residui

- `❌ Non fatto` collegare skill e progetti, per esempio:
  - click su una skill
  - evidenza dei progetti correlati
- `❌ Non fatto` aggiungere una sezione `Cloud & Infra` con tecnologie come:
  - AWS / GCP / Azure
  - Supabase
  - Vercel
  - database e strumenti infrastrutturali
- `❌ Non fatto` aggiungere un fallback per le icone devicon mancanti o non risolvibili

### Priorità

Media

### Effort

Medio

---

## 6. Performance finale

### Obiettivo

Fare un ultimo pass mirato sui colli di bottiglia rimasti, senza overengineering.

### Interventi residui

- `❌ Non fatto` ridurre dipendenze esterne chatty dove ha senso
- `❌ Non fatto` fare un audit Lighthouse/Web Vitals finale
- `❌ Non fatto [Priorità bassa]` valutare un endpoint bootstrap unico (`/api/bootstrap`) per ridurre ulteriormente i round-trip iniziali della homepage

### Priorità

Bassa

### Effort

Medio

---

## 7. Test automatici minimi

### Obiettivo

Aggiungere una rete di sicurezza leggera sopra la CI già presente.

### Interventi residui

- `✅ Fatto` smoke test per homepage e tutti gli endpoint API attuali:
  - homepage
  - `/api/about`
  - `/api/profile`
  - `/api/projects`
  - `/api/skills`
  - `/api/experiences`
  - `/api/health`
  - `/api/contact`
  - `/api/admin/session`
  - `/api/admin/health`
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/admin/tables`
  - `/api/admin/table`
  - `/api/admin/environment`
- `✅ Fatto` aggiungere una verifica minima di sessione admin anonima e autenticata
- `✅ Fatto` aggiungere test handler dedicati per `/api/admin/environment` (auth, payload e fallback), oltre allo smoke endpoint
- `✅ Fatto` creare una suite di test dedicata agli endpoint che eseguono query sul database, con focus iniziale su:
  - `/api/profile`
  - `/api/about`
  - `/api/projects`
  - `/api/experiences`
  - `/api/skills`
- `❌ Non fatto` valutare in una fase successiva test frontend/component-level o browser-level, se il progetto avrà bisogno di coprire anche il comportamento UI oltre ai boundary backend
- `❌ Non fatto` introdurre una GitHub Action separata dalle altre pipeline per eseguire i test UI/component-level (frontend) in modo dedicato
- `❌ Non fatto` valutare test di performance UX basati su elapsed time di riempimento contenuti (from skeleton/loading to content ready) per le sezioni alimentate dal DB, con soglie stabili e non troppo fragili
  - target metriche da valutare:
    - `heroReadyMs`: tempo da mount pagina `/home` a hero pronto (no skeleton)
    - `sectionReadyMs`: tempo di sblocco per singola sezione pubblica (`about`, `projects`, `experiences`, `skills`, `profile`)
    - `allSectionsReadyMs`: tempo da mount a tutte le sezioni pubbliche sbloccate (contenuto o errore esplicito, mai skeleton infinito)
    - guardrail: nessuna sezione in skeleton oltre una soglia massima (es. 20s)
  - strategia rollout consigliata:
    - fase 1: raccolta metrica in CI come warning/non-bloccante
    - fase 2: soglie hard pass/fail dopo stabilizzazione dei valori baseline

### Priorità

Media

### Effort

Medio

---

## 8. Admin UX e media workflow

### Obiettivo

Chiudere gli ultimi punti deboli dell’admin e della gestione asset senza riaprire refactor grossi.

### Interventi residui

- `✅ Fatto` rifattorizzare `AdminHome` in sottocomponenti con layout grid semplice e struttura visuale: hero in alto, database sotto, runtime/release/workspace in riga, environment variables in fondo
- `✅ Fatto` separare e ripulire il CSS admin home in file dedicati, riducendo accoppiamento e regole duplicate
- `✅ Fatto` spostare lo skeleton dentro ogni sottocomponente admin home (rimozione skeleton monolitico)
- `✅ Fatto` migliorare UX della lista environment variables:
  - badge `PUBLIC`/`SECRET` allineati a sinistra e con larghezza a contenuto
  - variabili pubbliche mostrate in chiaro senza reveal
  - campo valore con larghezza uniforme, ellissi visiva e navigazione completa da tastiera
- `✅ Fatto` verificato il path login admin in produzione con campioni API reali (`/api/admin/login` e `/api/admin/session`): nessuna anomalia persistente rilevata, solo primo hit piu` lento compatibile con warmup
- `✅ Fatto` aggiungere uno skeleton/stato di loading esplicito nella pagina login admin, stabilizzando il layout iniziale ed evitando il salto visivo del footer durante il mount lazy
- `❌ Non fatto` riprendere con calma il tema upload file in produzione, con percorso ideale:
  - endpoint admin protetto per upload
  - storage persistente
  - salvataggio di `path` / `publicUrl` nel DB
  - integrazione dell’admin con preview e UX coerente
- `❌ Non fatto` chiarire prima il modello dati e la UX dell’upload prima di implementarlo

### Priorità

Media-Bassa

### Effort

Medio-Alto

---

## Ordine consigliato aggiornato

1. README, quickstart e documentazione
2. Health endpoint, privacy e dashboard admin
3. Sicurezza e rate limiting distribuito
4. Skills, contenuti e discoverability
5. UI/UX e accessibilità
6. Tooling e manutenzione operativa
7. Performance finale
8. Admin UX e media workflow

---

## Nota pratica

Se il progetto resta volutamente single-page e già soddisfa il livello desiderato, molte sezioni da qui in poi possono essere trattate come rifiniture opzionali e non come blocchi obbligatori prima della chiusura.

---

## 9. UI/UX e accessibilità

### Obiettivo

Rendere l’esperienza utente più curata e accessibile, con attenzione a dettagli visivi e responsive.

### Interventi residui

- `✅ Fatto` migliorare lo stile dei tag (project-tag, about-interest-tag) per maggiore visibilità e coerenza visiva
- `✅ Fatto` rendere il badge "site-live" verde nel `README.md` (badge di stato del sito live)
- `✅ Fatto` sistemare il lightbox dei progetti GitHub su mobile: controlli close/nav stabilizzati con target touch coerenti e layout meno soggetto a ridimensionamenti/spostamenti
- `✅ Chiuso per scelta progettuale [Priorità bassissima]` effetto CSS cursore in homepage escluso dal perimetro attuale dopo valutazione UX (soluzione troppo invasiva rispetto al layout corrente)
- `❌ Non fatto` migliorare la visibilità degli skeleton in tema light (contrasto troppo basso), verificando una resa percepibile anche con loading molto rapido
- `❌ Non fatto` migliorare gli effetti grafici UI per aumentare l'impatto visivo complessivo (obiettivo: esperienza più "wow" anche per utenti non tecnici)

### Priorità

Media

### Effort

Basso-Medio

---

## 10. README, quickstart e documentazione

### Obiettivo

Rendere la repo immediatamente comprensibile e avviabile anche da reviewer esterni, con quickstart operativo, status snapshot e badge di stato.

### Interventi residui

- `✅ Fatto` aggiungere blocco quickstart (prerequisiti, .env, npm ci, run dev, test, build)
- `✅ Fatto` aggiungere tabella app/admin/tests/deploy
- `✅ Fatto` aggiungere status snapshot (Done/Partial/Open) e badge di stato veri (build, test, version, deploy)
- `✅ Fatto` aggiungere sezione "Architecture at a glance" con diagramma e richiesta end-to-end
- `✅ Fatto` rendere esplicita la strategia di test e mostrare un esempio reale di comando/scope

### Priorità

Alta

### Effort

Basso-Medio

---

## 11. Test CRUD e copertura database

### Obiettivo

Garantire che tutte le operazioni CRUD sulle tabelle principali siano coperte da test automatici, non solo gli endpoint pubblici.

### Interventi residui

- `✅ Fatto` aggiunta una suite CRUD DB-backed estesa su `/api/admin/table` che copre tutte le tabelle admin attuali testabili con record artificiali, più test sicuri di update/restore per i casi singleton `profile` e `profile_i18n`
- `✅ Fatto` aggiunte suite repository-level per tutti i repository attuali (`adminTableRepository`, `adminAuthRepository`, `aboutRepository`, `experiencesRepository`, `profileRepository`, `projectsRepository`, `skillsRepository`), con copertura di CRUD admin, auth admin, localizzazione, ordinamento, tag, immagini e read model pubblici principali

### Priorità

Alta

### Effort

Medio

---

## 12. Sicurezza e rate limiting distribuito

### Obiettivo

Rendere il rate limiting e i controlli di sicurezza robusti anche in ambienti multi-instance/serverless.

### Interventi residui

- `✅ Fatto` documentati i limiti del rate limiting process-local e il comportamento in ambienti multi-instance/serverless
- `✅ Fatto` introdotta modalità distribuita Redis (`RATE_LIMIT_MODE=redis`) con fallback in-memory resiliente, env production configurate e verifica operativa effettuata su produzione

### Priorità

Alta

### Effort

Medio

---

## 13. Health endpoint, privacy e dashboard admin

### Obiettivo

Rendere le informazioni di health più accurate e meno esposte pubblicamente, con dashboard protetta per dati sensibili.

### Interventi residui

- `✅ Fatto` correggere il calcolo di uptimeSeconds usando il ciclo di vita reale del processo invece di un timestamp modulo-locale fragile
- `✅ Fatto` ridurre `/api/health` a un payload pubblico minimale e spostare env, uptime, startedAt e metadati deploy su `/api/admin/health`, protetto da sessione admin
- `✅ Fatto` aggiungere una dashboard admin iniziale su `/admin` con stato health, metadati runtime/deploy e accesso esplicito alla console tabelle su `/admin/tables`
- `✅ Fatto` aggiungere `/api/admin/environment` per snapshot variabili tracciate/configurate e mostrare i valori in admin home con mascheramento solo per i secret

### Priorità

Media-Alta

### Effort

Medio

---

## 14. Osservabilita latenza DB

### Obiettivo

Visualizzare l'andamento della latenza database nel tempo direttamente nella admin home.

### Interventi residui

- `✅ Fatto` aggiungere un grafico trend della latenza DB nella admin home
- `✅ Fatto` introdurre polling periodico (target iniziale: ogni 5 secondi) per aggiornare i punti del grafico senza refresh pagina
- `✅ Fatto` implementata policy ibrida nel grafico: toggle `Ultimi 30`/`Sessione` con cap memoria lato client per evitare crescita non controllata dei sample
- `✅ Fatto` rendere il grafico più funzionale lato UX/analisi (toggle vista `Ultimi 30`/`Sessione`, latest/average latency, soglia 1000ms con evidenza picchi e conteggio over-threshold)

### Priorità

Media

### Effort

Medio

---

## 15. Stabilita caricamento homepage pubblica

### Obiettivo

Ridurre i casi in cui la homepage resta in skeleton per troppo tempo e richiede refresh multipli prima di popolarsi.

### Contesto emerso

- su produzione (`https://michaelpiccirilli.vercel.app/`) il caricamento iniziale puo` restare in skeleton per molti secondi
- il problema principale sembra la strategia di fetch, non il componente skeleton in sè
- oggi il flusso client è soggetto a effetto waterfall:
  - `ContentProvider` parte dopo `profileLoading`
  - `about/projects/experiences/skills` vengono caricati in sequenza
  - con timeout a 8s per chiamata il worst case percepito puo` arrivare a ~40s
- vari componenti usano "dati vuoti" come condizione per mostrare skeleton, quindi una failure/timeout puo` sembrare caricamento infinito
- lato backend alcuni endpoint fanno query DB sequenziali; con pool Postgres `max: 1` la concorrenza e` limitata e i timeout diventano piu` probabili

### Interventi residui

- `✅ Fatto` avviare fetch contenuti in parallelo in `ContentContext`, eliminando la cascata sequenziale (con concorrenza controllata)
- `✅ Fatto` separare stati `loading`, `error` e `empty` nei componenti pubblici (About/Projects/Skills/Experience), evitando `empty => skeleton`
- `✅ Fatto` disaccoppiare la homepage pubblica dal bootstrap admin/sessione, evitando blocchi iniziali non necessari su `/home`
- `✅ Fatto` introdurre error state esplicito lato UI quando una fetch fallisce o va in timeout (surface uniforme sezionale con azione `Riprova`)
- `✅ Fatto` ritarare timeout client con gestione abort più robusta (retry breve su abort rapidi senza aumentare il timeout hard da 15s)
- `✅ Fatto` consolidare ottimizzazioni lato server/dev sui path lenti (telemetria tempi, warmup opzionale locale, cancellazione cooperativa su abort, dispatch stabile dev)

### Stato

- `✅ Chiuso formalmente` stabilizzazione homepage completata per il perimetro definito; eventuali extra rimangono nel backlog performance come rifiniture opzionali

### Priorità

Alta

### Effort
Medio

---

## 16. Ottimizzazione caricamento immagini

### Obiettivo

Ridurre la latenza percepita legata agli asset media dei progetti senza cambiare l'architettura SPA.

### Interventi residui

- `❌ Non fatto [Priorità bassa]` rendere più aggressivo il lazy loading delle immagini fuori viewport
- `❌ Non fatto [Priorità bassa]` ridurre il burst iniziale delle fetch immagini (batch più piccoli o preload più graduale)
- `❌ Non fatto [Priorità bassa]` fare una passata di ricompressione mirata sui file media più pesanti
- `❌ Non fatto [Priorità bassa]` valutare `srcset/sizes` per limitare download sovradimensionati su viewport piccoli

### Priorità

Bassa

### Effort

Medio

---

## 17. Aggiornamento contenuti portfolio

### Obiettivo

Mantenere i contenuti del portfolio aggiornati rispetto al profilo professionale corrente e ai progetti recenti.

### Interventi residui

- `❌ Non fatto [Priorità bassa]` aggiornare alcune label/descrizioni profilo (esempio: sostituire `Web Developer` con `Full Stack Developer` dove opportuno)
- `❌ Non fatto [Priorità bassa]` aggiungere/aggiornare repository GitHub in evidenza nella sezione progetti
- `❌ Non fatto [Priorità bassa]` rivedere testi brevi bio/hero per allinearli alle competenze attuali

### Priorità

Bassa

### Effort

Basso


