# CHANGELOG

All notable changes to this project are tracked in this file.

The release discipline is intentionally lightweight:
- active work is collected under `Unreleased`
- stable cuts are recorded as versioned entries
- Git tags should follow the same semantic version as `package.json`, using the form `vX.Y.Z`

## [Unreleased]

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
