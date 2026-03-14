# TODO

## Idee miglioramento
- [ ] Collegare skill ai progetti (click skill -> progetti correlati).
- [ ] Aggiungere sezione `Cloud & Infra` (AWS/GCP/Azure, Supabase, Vercel, DB).
- [ ] Aggiungere fallback icone quando un devicon non esiste.
- [ ] Migliorare ordinamento skill da admin (order_index semplice o drag/drop).
- [ ] Controllare SEO e fare improvemente specie sulle performance
- [ ] Far espandere le immagini del carosello dei progetti githhb o all'hover o al clic con un modale largo che rifaccia vedere il carosello ma preservando le grandezze delle immagini (oggi sono leggermente tagliate).

## Priorita bassa (da valutare in futuro)
- Riprendere il tema upload file per produzione Vercel (discusso prima, rimandato a domani):
  - upload lato admin via API (`/api/admin/upload`)
  - salvataggio su storage persistente (Supabase Storage)
  - salvataggio nel DB di `path`/`publicUrl` (niente path locali)
  - eventuale supporto signed URL per file privati
  - nota: per ora non implementare; prima decidere bene modello dati/storage e UX admin dell'upload
  - stato discussione:
    - nel repo oggi non esiste `/api/admin/upload`
    - i campi file oggi sono gestiti come semplici URL/stringhe nel DB
    - campi reali coinvolti: `profile.photo_url`, `profile.cv_url`, `profile.university_logo_url`, `experiences.logo`, `education.logo`
    - primo incrementale ipotizzato: endpoint admin protetto + upload su Supabase Storage + ritorno di `path`/`publicUrl` + integrazione admin
- Sezione Experience: rivedere layout header card, perché l'icona ora risulta troppo centrata e non piace il risultato visivo.


## Nota operativa
- Evitare hardcode nel frontend: preferire DB + i18n (`staticI18n.json`) dove serve solo etichetta UI.
- Valutare passaggio a un ORM per il DB, per gestire meglio schema, query, migrazioni e consistenza del modello dati.
