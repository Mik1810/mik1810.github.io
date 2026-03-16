# todo.md

## Scopo

Questo file contiene solo le migliorie ancora aperte davvero per il progetto.

Sono state rimosse:

- le attività già completate
- le attività escluse per scelta progettuale

L'obiettivo è tenere una roadmap corta, reale e utile.

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

Quello che segue è quindi solo lavoro residuo.

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

- `❌ Non fatto` migliorare stati di successo/errore lato UX
- `❌ Non fatto` valutare invio reale o gestione più strutturata del form, se desiderato
- `❌ Non fatto` aggiungere protezione minima anti-spam se il form diventa operativo

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

- `❌ Non fatto` smoke test per:
  - homepage
  - `/api/profile`
  - `/api/projects`
  - `/api/skills`
- `❌ Non fatto` valutare un test minimo di accesso admin o sessione
- `✅ Fatto` creare una suite di test dedicata agli endpoint che eseguono query sul database, con focus iniziale su:
  - `/api/profile`
  - `/api/about`
  - `/api/projects`
  - `/api/experiences`
  - `/api/skills`

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

## Ordine consigliato

1. Tooling e manutenzione operativa
2. Hardening schema e database
3. Contact flow
4. Skills, contenuti e discoverability
5. Performance finale
6. Test automatici minimi
7. Admin UX e media workflow

---

## Nota pratica

Se il progetto resta volutamente single-page e già soddisfa il livello desiderato, le sezioni dalla `2` in poi possono anche essere trattate come rifiniture opzionali e non come blocchi obbligatori prima della chiusura.

