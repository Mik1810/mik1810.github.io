# CHANGELOG

All notable changes to this project are tracked in this file.

The release discipline is intentionally lightweight:
- active work is collected under `Unreleased`
- stable cuts are recorded as versioned entries
- Git tags should follow the same semantic version as `package.json`, using the form `vX.Y.Z`

## [Unreleased]

### Added
- server-side contact delivery through `/api/contact` with Zod validation, rate limiting, and Resend integration
- dedicated API coverage for the contact flow, now included in the broader `test:api` suite
- a lightweight smoke suite covering the homepage shell and every current API endpoint, including public, contact, health, and admin paths
- a DB-backed admin CRUD integration suite for `/api/admin/table`, covering all current admin tables that support artificial records plus safe update/restore checks for the singleton `profile` and `profile_i18n` tables
- targeted failure-path coverage for admin endpoints, `/api/health`, and auth-session utilities
- repository-level coverage across all current repositories, including `adminAuthRepository`, `adminTableRepository`, `aboutRepository`, `experiencesRepository`, `profileRepository`, `projectsRepository`, and `skillsRepository`

### Changed
- the contact form now submits through the backend instead of relying on `mailto:`
- contact notifications now include a styled HTML email body in addition to the plain-text fallback
- contact UX now surfaces clearer success and error states, including validation and service-availability feedback
- the contact email HTML now comes from a dedicated template module with explicit placeholder replacement and escaping for dynamic fields
- contact-flow coverage now also checks the extracted email template rendering and escaping behavior
- the public HTML entry now points to `/src/main.tsx`, matching the real frontend entry file

### Planned
- coordinated major upgrades of tooling stacks such as ESLint and Vite after compatibility review

## [1.0.0] - 2026-03-16

### Added
- full TypeScript coverage across frontend, backend, admin, and tooling
- layered backend architecture (`api -> service -> repository -> database`)
- Drizzle-backed relational model with multilingual content families
- schema-driven admin control plane with typed CRUD and relation-aware editors
- public read-plane endpoints for profile, about, projects, skills, experiences, and health
- GitHub Actions CI with lint, typecheck, build, and DB-backed API tests

### Changed
- public GitHub project media now uses canonical relational galleries and optimized local assets
- public/admin bundles are separated so the admin subtree loads lazily as a dedicated asset family
- operational hardening now includes environment validation, request validation, rate limiting, and a richer health endpoint
