# todo.md

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
- `✅ Fatto` aggiungere una health/dashboard minima per stato applicativo e operativo, tramite `/api/health`, con:
  - stato DB
  - versione app
  - informazioni minime di integrità
  - environment, uptime e metadati minimi di deploy
- `✅ Fatto` introdurre una disciplina di release leggera, tramite `CHANGELOG.md` e convenzione di tag semver, per esempio:
  - changelog minimo
  - tag coerenti con le versioni
- `❌ Non fatto` pianificare upgrade coordinati dei principali stack di tooling (per esempio ESLint e Vite), verificando la compatibilità tra dipendenze prima del merge

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
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/admin/tables`
  - `/api/admin/table`
- `✅ Fatto` aggiungere una verifica minima di sessione admin anonima e autenticata
- `✅ Fatto` creare una suite di test dedicata agli endpoint che eseguono query sul database, con focus iniziale su:
  - `/api/profile`
  - `/api/about`
  - `/api/projects`
  - `/api/experiences`
  - `/api/skills`
- `❌ Non fatto` valutare in una fase successiva test frontend/component-level o browser-level, se il progetto avrà bisogno di coprire anche il comportamento UI oltre ai boundary backend

### Priorità

Media

### Effort

Medio

---

## 8. Admin UX e media workflow

### Obiettivo

Chiudere gli ultimi punti deboli dell’admin e della gestione asset senza riaprire refactor grossi.

### Interventi residui

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

- `🟡 Partial` migliorare lo stile dei tag (project-tag, about-interest-tag) per maggiore visibilità e coerenza visiva
- `❌ Non fatto` rendere il badge "site-live" verde se il sito è online
- `❌ Non fatto` sistemare il lightbox dei progetti GitHub su mobile: i bottoni di navigazione e chiusura si spostano/ridimensionano in modo non ottimale

### Priorità

Media

### Effort

Basso-Medio

---

## 10. README, quickstart e documentazione

### Obiettivo

Rendere la repo immediatamente comprensibile e avviabile anche da reviewer esterni, con quickstart operativo, status snapshot e badge di stato.

### Interventi residui

- `❌ Non fatto` aggiungere blocco quickstart (prerequisiti, .env, npm ci, run dev, test, build)
- `❌ Non fatto` aggiungere tabella app/admin/tests/deploy
- `❌ Non fatto` aggiungere status snapshot (Done/Partial/Open) e badge di stato veri (build, test, version, deploy)
- `❌ Non fatto` aggiungere sezione "Architecture at a glance" con diagramma e richiesta end-to-end
- `❌ Non fatto` rendere esplicita la strategia di test e mostrare un esempio reale di comando/scope

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

- `🟡 Partial` documentare i limiti del rate limit attuale (in-memory, non condiviso tra istanze)
- `❌ Non fatto` valutare e implementare una soluzione di rate limiting distribuito (es. Redis, edge, o provider esterno)

### Priorità

Alta

### Effort

Medio

---

## 13. Health endpoint, privacy e dashboard admin

### Obiettivo

Rendere le informazioni di health più accurate e meno esposte pubblicamente, con dashboard protetta per dati sensibili.

### Interventi residui

- `❌ Non fatto` correggere il calcolo di uptimeSeconds (mostra sempre 1, va verificato il ciclo di vita reale del processo)
- `❌ Non fatto` evitare di esporre pubblicamente dati sensibili (uptime, env, metadati deploy): valutare una route protetta e una dashboard admin

### Priorità

Media-Alta

### Effort

Medio


