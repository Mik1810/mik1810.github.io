# API Contract

Questo documento descrive il contratto HTTP attuale esposto dall'app.

## Base URL

- Locale UI (Vite): `http://localhost:5173`
- Locale API diretta: `http://localhost:3000`
- Production: `https://<your-domain>`

Nota routing:
- In produzione Vercel usa rewrite verso handler unificati:
  - `/api/(about|profile|projects|skills|experiences|health|contact)` -> `/api/home?route=...`
  - `/api/admin/*` -> `/api/admin?route=...`
- I path pubblici restano **stabili** (es. `/api/profile`, `/api/admin/login`, ecc.).

## Localizzazione

- Query param supportato: `lang=it|en`
- Default/fallback server: `it`
- Le etichette statiche UI (nav, bottoni, label) sono locali nel frontend:
  - `src/data/staticI18n.json`
  - non esiste endpoint `/api/ui`

## Autenticazione admin

- Login admin via cookie HttpOnly `admin_session`
- Cookie impostato da `POST /api/admin/login`
- Route admin protette rispondono `401` se non autenticato

## Errori (shape comune)

```json
{
  "error": "Human readable message",
  "code": "machine_code"
}
```

Codici comuni:
- `400` request/query/body invalidi
- `401` non autenticato / credenziali non valide
- `404` route non trovata
- `405` metodo non consentito
- `429` rate limited
- `500+` errori interni/upstream

## Rate limiting

Alcune route applicano rate limit (memory o redis, in base a `RATE_LIMIT_MODE`).
Header esposti:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (solo quando limit superato)

---

## Public API

### GET `/api/profile?lang=it|en`
Ritorna i dati profilo per Hero/Navbar/Footer/Contact.

Response (shape):
```json
{
  "name": "...",
  "photo": "...",
  "email": "...",
  "cv": "...",
  "greeting": "...",
  "location": "...",
  "bio": "...",
  "university": {
    "name": "...",
    "logo": "..."
  },
  "roles": ["..."],
  "socials": [
    {
      "name": "...",
      "url": "...",
      "icon": "..."
    }
  ]
}
```

### GET `/api/about?lang=it|en`
Ritorna gli interessi sezione About.

Response:
```json
{
  "interests": ["..."]
}
```

### GET `/api/projects?lang=it|en`
Ritorna progetti portfolio + progetti GitHub featured.

Response (shape):
```json
{
  "projects": [
    {
      "id": 1,
      "slug": "...",
      "title": "...",
      "description": "...",
      "tags": ["..."],
      "live": "https://...",
      "github": null
    }
  ],
  "githubProjects": [
    {
      "id": 1,
      "slug": "...",
      "title": "...",
      "description": "...",
      "tags": ["..."],
      "githubUrl": "https://...",
      "liveUrl": "https://...",
      "images": ["https://..."]
    }
  ]
}
```

### GET `/api/experiences?lang=it|en`
Ritorna esperienze + education.

Response (shape):
```json
{
  "experiences": [
    {
      "id": 1,
      "order_index": 1,
      "logo": "...",
      "logo_bg": "...",
      "role": "...",
      "company": "...",
      "period": "...",
      "description": "..."
    }
  ],
  "education": [
    {
      "id": 1,
      "order_index": 1,
      "logo": "...",
      "degree": "...",
      "institution": "...",
      "period": "...",
      "description": "..."
    }
  ]
}
```

### GET `/api/skills?lang=it|en`
Ritorna stack tecnologico + categorie skill tradotte.

Response (shape):
```json
{
  "techStack": [
    {
      "category": "...",
      "items": [
        {
          "name": "...",
          "devicon": "...",
          "color": "#RRGGBB"
        }
      ]
    }
  ],
  "categories": [
    {
      "category": "...",
      "skills": ["..."]
    }
  ]
}
```

### GET `/api/health`
Health pubblico minimale.

Response (shape):
```json
{
  "ok": true,
  "service": "api",
  "timestamp": "2026-03-24T00:00:00.000Z",
  "app": {
    "name": "...",
    "version": "..."
  },
  "checks": {
    "database": {
      "ok": true,
      "latencyMs": 42
    }
  }
}
```

Status:
- `200` se DB ok
- `503` se DB non ok

### POST `/api/contact`
Invia un messaggio contatti (Resend).

Request body:
```json
{
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "message": "Messaggio di almeno 10 caratteri",
  "locale": "it",
  "website": ""
}
```

Note:
- `website` è honeypot anti-bot (deve restare vuoto)
- `locale` supporta `it|en` (default `it`)

Success response:
```json
{
  "ok": true
}
```

Errori tipici:
- `400` payload non valido
- `429` rate limit
- `502` `contact_delivery_failed`
- `503` `contact_unavailable`
- `504` `contact_timeout`

---

## Admin API

### GET `/api/admin/session`
Ritorna lo stato sessione admin.

Response (unauthenticated):
```json
{
  "authenticated": false,
  "user": null
}
```

Response (authenticated):
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com"
  }
}
```

### POST `/api/admin/login`
Login admin server-side (cookie HttpOnly).

Request body:
```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

Success response:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com"
  }
}
```

### POST `/api/admin/logout`
Richiede sessione admin valida.

Success response:
```json
{
  "ok": true
}
```

### GET `/api/admin/tables`
Richiede sessione admin valida. Ritorna metadata tabelle admin.

Response (shape):
```json
{
  "tables": [
    {
      "name": "profile",
      "label": "Profile",
      "description": "...",
      "group": "profile",
      "groupLabel": "...",
      "subgroup": "...",
      "subgroupLabel": "...",
      "primaryKeys": ["id"],
      "defaultRow": {},
      "fields": [
        {
          "name": "...",
          "label": "...",
          "editor": {
            "kind": "text"
          },
          "editable": true,
          "primaryKey": false,
          "system": false,
          "foreignKey": false
        }
      ]
    }
  ]
}
```

### `/api/admin/table` (CRUD)
Richiede sessione admin valida.

Query:
- `table` (obbligatorio)
- `limit` (opzionale, default `200`, clamp `1..1000`)

#### GET `/api/admin/table?table=<name>&limit=200`
Response:
```json
{
  "rows": [
    { "...": "..." }
  ]
}
```

#### POST `/api/admin/table?table=<name>`
Body singolo record:
```json
{
  "row": { "...": "..." }
}
```

Body multi record:
```json
{
  "rows": [
    { "...": "..." },
    { "...": "..." }
  ]
}
```

Response:
- singolo -> `{ "row": { ... } }`
- multiplo -> `{ "rows": [{ ... }] }`

#### PATCH `/api/admin/table?table=<name>`
Body:
```json
{
  "keys": { "pk": "..." },
  "row": { "field": "new value" }
}
```

Response:
```json
{
  "row": { "...": "..." }
}
```

#### DELETE `/api/admin/table?table=<name>`
Body:
```json
{
  "keys": { "pk": "..." }
}
```

Response:
```json
{
  "ok": true
}
```

Errori tipici admin/table:
- `400` `table_not_allowed`, `missing_primary_keys`, payload non valido
- `429` rate limit
- `500` `database_error` o `internal_error`

### GET `/api/admin/health`
Richiede sessione admin valida. Health esteso (runtime + deploy + env snapshot).

Response (shape):
```json
{
  "ok": true,
  "service": "api",
  "timestamp": "2026-03-24T00:00:00.000Z",
  "environment": "production",
  "app": {
    "name": "...",
    "version": "...",
    "uptimeSeconds": 123,
    "startedAt": "2026-03-24T00:00:00.000Z"
  },
  "checks": {
    "database": {
      "ok": true,
      "latencyMs": 31
    }
  },
  "deployment": {
    "provider": "vercel",
    "region": "...",
    "commitSha": "..."
  },
  "environmentVariables": [
    {
      "key": "DATABASE_URL",
      "value": "...",
      "isSecret": true
    }
  ]
}
```

Status:
- `200` se DB ok
- `503` se DB non ok

### GET `/api/admin/environment`
Richiede sessione admin valida.

Response:
```json
{
  "environmentVariables": [
    {
      "key": "NODE_ENV",
      "value": "production",
      "isSecret": false
    }
  ]
}
```

### GET `/api/admin/metrics/db-latency`
Richiede sessione admin valida. Endpoint metrico per polling dashboard.

Response:
```json
{
  "ok": true,
  "timestamp": "2026-03-24T00:00:00.000Z",
  "database": {
    "ok": true,
    "latencyMs": 55
  }
}
```

Status:
- `200` se DB ok
- `503` se DB non ok

---

## Esempi rapidi curl

```bash
# Public
curl "http://localhost:3000/api/profile?lang=it"
curl "http://localhost:3000/api/health"

# Contact
curl -X POST "http://localhost:3000/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mario","email":"mario@example.com","message":"Ciao, test contatto valido","locale":"it","website":""}'

# Admin login/session
curl -i -X POST "http://localhost:3000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
curl -i "http://localhost:3000/api/admin/session"
```
