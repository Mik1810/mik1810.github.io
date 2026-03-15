# TODO.md

## Scopo

Questo file contiene solo le migliorie ancora aperte davvero per il progetto.

Sono state rimosse:

- le attività già completate
- le attività escluse per scelta progettuale

L'obiettivo è tenere una roadmap corta, reale e utile.

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

- introdurre validazione input strutturata con Zod
- introdurre validazione esplicita delle variabili ambiente all’avvio, con errori chiari su configurazioni mancanti o invalide
- aggiungere rate limiting almeno su:
  - endpoint pubblici più sensibili
  - login/admin
- rifinire ancora gestione errori e risposta uniforme delle API
- rafforzare ulteriormente i controlli sul path admin dove serve

### Priorità

Alta

### Effort

Medio

---

## 2. Tooling e manutenzione operativa

### Obiettivo

Ridurre il lavoro manuale di manutenzione e aumentare la visibilità operativa del progetto.

### Interventi residui

- introdurre `Dependabot` o `Renovate` per aggiornamenti automatici delle dipendenze
- aggiungere una health/dashboard minima per stato applicativo e operativo, per esempio:
  - stato DB
  - versione app
  - informazioni minime di integrità
- introdurre una disciplina di release leggera, per esempio:
  - changelog minimo
  - tag coerenti con le versioni

### Priorità

Media

### Effort

Basso-Medio

---

## 3. Hardening schema e database

### Obiettivo

Rendere lo schema più robusto contro inconsistenze e query inefficienti.

### Interventi residui

- aggiungere vincoli `unique` per le tabelle `_i18n`, per esempio:
  - `(project_id, locale)`
  - `(experience_id, locale)`
  - equivalenti per le altre entità localizzate
- aggiungere o rivedere indici su:
  - `locale`
  - foreign key più usate
  - `order_index`
  - eventuali flag come `featured`
- verificare se esistono ancora punti dove l’ordinamento o l’unicità dipendono solo dalla logica applicativa

### Priorità

Media-Alta

### Effort

Basso-Medio

---

## 4. Contact flow

### Obiettivo

Rendere la sezione contatti più completa e più resistente, senza complicarla inutilmente.

### Interventi residui

- migliorare stati di successo/errore lato UX
- valutare invio reale o gestione più strutturata del form, se desiderato
- aggiungere protezione minima anti-spam se il form diventa operativo

### Priorità

Media

### Effort

Medio

---

## 5. Skills, contenuti e discoverability

### Obiettivo

Rendere le sezioni pubbliche più espressive e più collegate tra loro, senza cambiare la filosofia single-page.

### Interventi residui

- collegare skill e progetti, per esempio:
  - click su una skill
  - evidenza dei progetti correlati
- aggiungere una sezione `Cloud & Infra` con tecnologie come:
  - AWS / GCP / Azure
  - Supabase
  - Vercel
  - database e strumenti infrastrutturali
- aggiungere un fallback per le icone devicon mancanti o non risolvibili

### Priorità

Media

### Effort

Medio

---

## 6. Performance finale

### Obiettivo

Fare un ultimo pass mirato sui colli di bottiglia rimasti, senza overengineering.

### Interventi residui

- ridurre dipendenze esterne chatty dove ha senso
- fare un audit Lighthouse/Web Vitals finale

### Priorità

Bassa

### Effort

Medio

---

## 7. Test automatici minimi

### Obiettivo

Aggiungere una rete di sicurezza leggera sopra la CI già presente.

### Interventi residui

- smoke test per:
  - homepage
  - `/api/profile`
  - `/api/projects`
  - `/api/skills`
- valutare un test minimo di accesso admin o sessione
- creare una suite di test dedicata agli endpoint che eseguono query sul database, con focus iniziale su:
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

- riprendere con calma il tema upload file in produzione, con percorso ideale:
  - endpoint admin protetto per upload
  - storage persistente
  - salvataggio di `path` / `publicUrl` nel DB
  - integrazione dell’admin con preview e UX coerente
- chiarire prima il modello dati e la UX dell’upload prima di implementarlo

### Priorità

Media-Bassa

### Effort

Medio-Alto


--- 

## Ordine consigliato

1. Hardening backend
2. Tooling e manutenzione operativa
3. Hardening schema e database
4. Contact flow
5. Skills, contenuti e discoverability
6. Performance finale
7. Test automatici minimi
8. Admin UX e media workflow

---

## Nota pratica

Se il progetto resta volutamente single-page e già soddisfa il livello desiderato, le sezioni dalla `3` in poi possono anche essere trattate come rifiniture opzionali e non come blocchi obbligatori prima della chiusura.
