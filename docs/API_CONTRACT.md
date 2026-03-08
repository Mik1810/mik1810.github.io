# API Contract

Base URL:
- Local: `http://localhost:3000`
- Production: `https://<your-domain>`

Language parameter:
- Supported: `it`, `en`
- Default fallback: `it`

## GET `/api/ui?lang=it|en`
Returns localized UI labels used by `t(...)`.

Example:
```bash
curl "http://localhost:3000/api/ui?lang=it"
```

Response (example):
```json
{
  "nav": {
    "home": "Home",
    "about": "Chi Sono",
    "projects": "Progetti",
    "experience": "Esperienze",
    "skills": "Competenze",
    "contact": "Contatti",
    "downloadCv": "Scarica CV"
  },
  "hero": {
    "btnProjects": "I miei progetti",
    "btnContact": "Contattami"
  },
  "about": {
    "title": "Chi Sono",
    "subtitle": "Un po' su di me",
    "bio": "..."
  },
  "projects": {
    "title": "Progetti e Competizioni",
    "subtitle": "Una selezione dei miei lavori più significativi",
    "codeLabel": "Codice",
    "siteLabel": "Sito"
  },
  "experience": {
    "title": "Esperienze",
    "subtitle": "Il mio percorso accademico e le attività svolte",
    "activitiesHeading": "Attività e Conferenze",
    "educationHeading": "Formazione"
  },
  "skills": {
    "title": "Competenze",
    "subtitle": "Le tecnologie e gli strumenti con cui lavoro"
  },
  "contact": {
    "title": "Contatti",
    "subtitle": "...",
    "nameLabel": "Nome",
    "namePlaceholder": "Il tuo nome",
    "emailLabel": "Email",
    "emailPlaceholder": "La tua email",
    "messageLabel": "Messaggio",
    "messagePlaceholder": "Scrivi il tuo messaggio...",
    "sendBtn": "Invia messaggio",
    "mailSubject": "Contatto da",
    "mailFrom": "Da"
  },
  "footer": {
    "rights": "Tutti i diritti riservati."
  }
}
```

## GET `/api/profile?lang=it|en`
Returns profile data used by Hero/Navbar/Footer/Contact.

Example:
```bash
curl "http://localhost:3000/api/profile?lang=en"
```

Response (example):
```json
{
  "name": "Michael Piccirilli",
  "photo": "/imgs/michael.jpg",
  "email": "michaelpiccirilli3@gmail.com",
  "cv": "/docs/Curriculum_Vitae_10_2025.pdf",
  "greeting": "Hi, I'm",
  "location": "L'Aquila, Italy",
  "university": {
    "name": "University of L'Aquila",
    "logo": "/imgs/univaq.gif"
  },
  "roles": [
    "Master's Student in Computer Science",
    "AI Enthusiast",
    "Cybersecurity Enthusiast",
    "Web Developer"
  ],
  "socials": [
    {
      "name": "GitHub",
      "url": "https://github.com/Mik1810",
      "icon": "github"
    },
    {
      "name": "LinkedIn",
      "url": "https://www.linkedin.com/in/michael-piccirilli-878a0821b/",
      "icon": "linkedin"
    }
  ]
}
```

## GET `/api/about?lang=it|en`
Returns interests for About section.

Example:
```bash
curl "http://localhost:3000/api/about?lang=it"
```

Response:
```json
{
  "interests": [
    "Intelligenza Artificiale",
    "Cybersecurity",
    "Web Development",
    "Algoritmi e Strutture Dati"
  ]
}
```

## GET `/api/projects?lang=it|en`
Returns translated projects + tags + live links.

Example:
```bash
curl "http://localhost:3000/api/projects?lang=en"
```

Response (example):
```json
[
  {
    "id": 1,
    "slug": "flood-monitoring-management-system",
    "title": "Flood Monitoring and Management System",
    "description": "...",
    "tags": ["CINI Challenge", "Disaster Prevention", "Team Project"],
    "live": "https://icities25.unicas.it/"
  }
]
```

## GET `/api/experiences?lang=it|en`
Returns both activities and education.

Example:
```bash
curl "http://localhost:3000/api/experiences?lang=it"
```

Response (example):
```json
{
  "experiences": [
    {
      "id": 1,
      "order_index": 1,
      "logo": "/imgs/cyberchallenge.png",
      "logo_bg": null,
      "role": "CyberChallenge 2024",
      "company": "Cybersecurity National Lab",
      "period": "Giugno 2024",
      "description": "..."
    }
  ],
  "education": [
    {
      "id": 1,
      "order_index": 1,
      "logo": "/imgs/univaq.gif",
      "degree": "Laurea Magistrale in Informatica — Curriculum AICONDA",
      "institution": "Università degli Studi dell'Aquila",
      "period": "Ott 2024 – In corso",
      "description": "..."
    }
  ]
}
```

## GET `/api/skills?lang=it|en`
Returns tech stack and translated skill categories.

Example:
```bash
curl "http://localhost:3000/api/skills?lang=en"
```

Response (example):
```json
{
  "techStack": [
    {
      "category": "Languages",
      "items": [
        {
          "name": "Python",
          "devicon": "python/python-original",
          "color": "#3776AB"
        }
      ]
    }
  ],
  "categories": [
    {
      "category": "Programming",
      "skills": ["Web Development", "Programming Languages"]
    }
  ]
}
```

## POST `/api/admin/login`
Server-side auth login (no Supabase client in frontend).

Request:
```bash
curl -X POST "http://localhost:3000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"secret\"}"
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

Error responses:
- `400`: missing `email` or `password`
- `401`: invalid credentials
- `405`: wrong method
- `500`: server/internal error

## Common error shape
```json
{
  "error": "Database error"
}
```
