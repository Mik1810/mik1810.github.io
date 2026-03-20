# TEST.md

## Scopo

Questo documento descrive nel dettaglio la strategia di test attuale della repository e mappa tutte le suite presenti sotto `tests/`.

Ad oggi la copertura automatica è focalizzata sul backend:

- endpoint API pubblici e admin
- utility critiche di auth/sessione
- contact flow
- CRUD admin DB-backed
- layer repository

Non sono invece ancora presenti:

- test frontend/component-level
- test browser-level end-to-end

## Tooling

- runner: `Vitest`
- config principale: [vitest.config.ts](../vitest.config.ts)
- comando completo: `npm run test:api`

Comandi utili:

- suite completa: `npm run test:api`
- soli test API/handler: `npm run test:api:handlers`
- soli test repository: `npm run test:repositories`
- suite DB-backed storica: `npm run test:db`
- watch mode: `npm run test:api:watch`

Ordine di esecuzione della suite completa:

1. `tests/api`
2. `tests/repositories`

Questo ordine evita che le suite repository leggano lo stesso DB mentre le suite API CRUD stanno ancora creando e aggiornando record artificiali.

## Struttura

- `tests/api`
  - test handler/API-level
  - smoke suite
  - failure path
  - utility auth/contact/health
- `tests/repositories`
  - test repository-level
  - query reali verso DB
  - mapping e vincoli del layer dati

## Stato attuale

Alla data di questo documento, la suite completa conta:

- `15` file di test

Il perimetro backend attuale è considerato coperto per lo scope del progetto.

## Test API

### [smoke.test.ts](./api/smoke.test.ts)

Scopo:

- verificare che l'app "respiri"
- controllare il wiring generale
- intercettare rotture grossolane dell'intero perimetro

Cosa testa:

- integrità della homepage shell da `index.html`
  - presenza di `#root`
  - titolo pagina corretto
  - entry module valido e realmente esistente (`/src/main.tsx`)
- smoke check di tutti gli endpoint pubblici:
  - `/api/about`
  - `/api/profile`
  - `/api/projects`
  - `/api/skills`
  - `/api/experiences`
  - `/api/health`
  - `/api/contact`
- smoke check di tutti gli endpoint admin:
  - `/api/admin/session`
  - `/api/admin/health`
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/admin/tables`
  - `/api/admin/table`
  - `/api/admin/environment`

Note:

- usa mock mirati dove utile, per mantenere la suite veloce e stabile
- non valida a fondo il contenuto dei payload: controlla soprattutto che i path esistano e rispondano correttamente

### [publicEndpoints.test.ts](./api/publicEndpoints.test.ts)

Scopo:

- validare gli endpoint pubblici DB-backed reali
- controllare shape minima, status e header di rate limiting

Cosa testa:

- `GET /api/profile`
- `GET /api/about`
- `GET /api/projects`
- `GET /api/skills`
- `GET /api/experiences`
- rifiuto di locale invalida `lang=fr` con errore strutturato `invalid_query`

Controlli principali:

- `200 OK`
- payload stabile minimo
- header `x-ratelimit-*`
- comportamento corretto su query invalida

### [email.test.ts](./api/email.test.ts)

Scopo:

- coprire l'intero perimetro contact/email

Cosa testa lato API:

- `POST /api/contact` con payload valido
- rate-limit headers sul contact endpoint
- rifiuto di payload invalido
- rifiuto submission honeypot
- mapping corretto degli errori provider (`contact_delivery_failed`)

Cosa testa lato template:

- rendering del template email con placeholder risolti
- localizzazione contenuto
- escaping dei campi dinamici prima dell'iniezione HTML

### [health.test.ts](./api/health.test.ts)

Scopo:

- verificare il comportamento del health endpoint al boundary HTTP

Cosa testa:

- `200` quando `/api/health` ha un controllo DB sano
- `503` quando `/api/health` fallisce sul DB
- assenza dei metadati sensibili nel payload pubblico
- `200` su `/api/admin/health` autenticato con payload operativo più ricco
- `401` su `/api/admin/health` senza sessione admin

### [authSession.test.ts](./api/authSession.test.ts)

Scopo:

- validare le utility di sessione admin piu` critiche

Cosa testa:

- parsing cookies
- creazione token firmato
- verifica token firmato
- estrazione sessione dalla request
- rifiuto token manomesso
- rifiuto token scaduto

### [adminFailures.test.ts](./api/adminFailures.test.ts)

Scopo:

- coprire i failure path dell'area admin

Cosa testa:

- sessione admin non autenticata con cookie invalido
- login fallito con codice `auth_failed`
- logout senza sessione
- listing tabelle senza sessione
- accesso generico a `/api/admin/table` senza sessione
- tabella non consentita
- `limit` invalido
- `PATCH` con primary keys mancanti
- `PATCH` senza campi mutabili
- payload con colonne sconosciute
- create con body vuoto

### [adminEnvironment.test.ts](./api/adminEnvironment.test.ts)

Scopo:

- validare il boundary HTTP dell'endpoint `/api/admin/environment`

Cosa testa:

- `200` con sessione admin valida
- shape minima stabile del payload (`variables`, contatori e metadati derivati)
- `401` senza sessione admin
- fallback coerente in caso di errore interno del servizio

### [adminTableCrud.test.ts](./api/adminTableCrud.test.ts)

Scopo:

- testare il CRUD reale dell'endpoint admin generico `/api/admin/table`

Caratteristiche:

- usa cookie admin valido
- usa database reale via Drizzle
- crea dati artificiali
- esegue cleanup esplicito dopo ogni test

Pattern coperto:

- `create -> read -> update -> delete`

Tabelle coperte con CRUD completo:

- `social_links`
- `hero_roles`
- `hero_roles_i18n`
- `about_interests`
- `about_interests_i18n`
- `projects`
- `projects_i18n`
- `project_tags`
- `github_projects`
- `github_projects_i18n`
- `github_project_tags`
- `github_project_images`
- `experiences`
- `experiences_i18n`
- `education`
- `education_i18n`
- `tech_categories`
- `tech_categories_i18n`
- `tech_items`
- `skill_categories`
- `skill_categories_i18n`
- `skill_items`
- `skill_items_i18n`

Casi speciali coperti con update/restore sicuro:

- `profile`
- `profile_i18n`

## Test Repository

### [adminTableRepository.test.ts](./repositories/adminTableRepository.test.ts)

Scopo:

- testare direttamente il repository CRUD dell'admin, senza passare dagli endpoint HTTP

Cosa testa:

- `insert/list/update/delete` su `social_links`
- `bulk insert` su `hero_roles`
- rifiuto colonne sconosciute nel row payload
- rifiuto colonne sconosciute nel keys payload
- rifiuto delete senza keys
- mapping stabile degli errori di vincolo DB a `Database error`

### [adminAuthRepository.test.ts](./repositories/adminAuthRepository.test.ts)

Scopo:

- testare il repository auth admin che dialoga con Supabase Auth

Cosa testa:

- successo login admin e mapping corretto dell'utente
- mapping dei payload errore di Supabase
- fallback a messaggio generico se il provider non restituisce dettagli
- rifiuto di risposte formalmente `ok` ma senza utente valido

### [profileRepository.test.ts](./repositories/profileRepository.test.ts)

Scopo:

- testare il read model del profilo

Cosa testa:

- normalizzazione locale
- payload stabile italiano
- payload stabile inglese
- ordinamento dei social link
- allineamento dei ruoli localizzati con il DB

Nota:

- il test dei social link ignora eventuali fixture temporanei artificiali creati da altre suite CRUD, per restare stabile anche con esecuzione concorrente

### [projectsRepository.test.ts](./repositories/projectsRepository.test.ts)

Scopo:

- testare il read model dei progetti locali e GitHub

Cosa testa:

- normalizzazione locale
- payload stabile italiano
- payload stabile inglese
- ordinamento e localizzazione dei progetti locali
- filtro `featured` per i GitHub project
- ordinamento dei tag GitHub
- ordinamento delle immagini GitHub
- allineamento complessivo col contenuto DB per `it` e `en`

### [skillsRepository.test.ts](./repositories/skillsRepository.test.ts)

Scopo:

- testare il read model delle skill

Cosa testa:

- payload stabile italiano
- payload stabile inglese
- allineamento del `techStack` col DB
- ordinamento degli item tecnici
- fallback su `devicon` e `color`
- allineamento delle categorie skill e delle label localizzate

### [aboutRepository.test.ts](./repositories/aboutRepository.test.ts)

Scopo:

- testare il read model degli interessi `about`

Cosa testa:

- payload stabile italiano
- payload stabile inglese
- ordinamento DB degli interessi italiani
- ordinamento DB degli interessi inglesi

### [experiencesRepository.test.ts](./repositories/experiencesRepository.test.ts)

Scopo:

- testare il read model di esperienze ed education

Cosa testa:

- payload stabile italiano
- payload stabile inglese
- allineamento DB di `experiences` in `it`
- allineamento DB di `experiences` in `en`
- allineamento DB di `education` in `it`
- allineamento DB di `education` in `en`

## Utility di test

### [testUtils.ts](./api/testUtils.ts)

Scopo:

- fornire helper condivisi per invocare handler API in memoria durante i test

Uso:

- simula request/response senza dover alzare un server HTTP reale
- usato in quasi tutte le suite API-level

## Cosa non coprono ancora questi test

La strategia attuale non copre ancora:

- rendering React a livello componente
- interazioni UI nel browser
- flussi end-to-end completi lato frontend
- regressioni visuali

Questo è intenzionale: al momento la priorità del progetto è la solidita` del backend e del piano dati.

## Sintesi finale

La suite attuale garantisce:

- copertura ampia dell'intero perimetro API
- validazione dei principali failure path admin
- verifica reale delle query e del mapping repository
- copertura CRUD sul piano admin
- buona confidenza sulle regressioni backend

Per lo scope attuale del progetto, il blocco test backend puo` essere considerato chiuso.
