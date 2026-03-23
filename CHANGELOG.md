# CHANGELOG

All notable changes to this project are tracked in this file.

The release discipline is intentionally lightweight:
- active work is collected under `Unreleased`
- stable cuts are recorded as versioned entries
- Git tags should follow the same semantic version as `package.json`, using the form `vX.Y.Z`

## [Unreleased]

_No entries yet._

## [1.2.3] - 2026-03-23

### Changed
- restored `npm run dev:web` to direct Vite startup (`vite`)
- moved the API-readiness-gated web startup to `npm run dev:wait` (backed by `scripts/devWebLauncher.ts`)
- preserved the improved `dev:fast` behavior with `--kill-others-on-fail`

## [1.2.2] - 2026-03-23

### Added
- new `dev:web` launcher (`scripts/devWebLauncher.ts`) that waits for API readiness before starting Vite, preventing frontend/backend startup races in local development

### Changed
- `npm run dev:web` now starts through the readiness launcher
- added `npm run dev:web:raw` to keep the direct Vite startup path available when needed
- `npm run dev:fast` now uses `--kill-others-on-fail` for safer coordinated local startup

## [1.2.1] - 2026-03-23

### Changed
- dev startup timing logs were refined for `npm run dev:api:log`:
  - `bootstrap.start` renamed to `launcher.end`
  - timestamps now use `HH:mm:ss dd:mm:yyyy`
  - elapsed startup values are shown in `Xm Ys`
- startup timing output is now scoped to `dev:api:log` only (`dev:api` stays plain)

### Fixed
- resolved TypeScript mismatch in `AdminHomeDatabaseCard` date label formatting (`string` return type consistency)
- resolved lint issues in admin latency chart component after timestamp-axis refactor

### Added
- TODO follow-up for UI performance testing based on elapsed content-fill metrics (`heroReadyMs`, `sectionReadyMs`, `allSectionsReadyMs`) with phased CI rollout

## [1.2.0] - 2026-03-23

### Added
- instrumented admin DB latency chart improvements:
  - view toggle `Ultimi 30` / `Sessione`
  - client-side capped sample buffer (max 300) for long sessions
  - `Over threshold` counter and explicit 1000ms threshold reference line
  - red highlight on the line only for the segment portions above threshold
  - `Latest latency` and `Average latency` summary tiles
- new local dev script `npm run dev:api:log` to measure startup with a launcher and report `tsxWatchOverheadMs` and total elapsed
- `.env.example` template with safe placeholders for runtime/dev flags and required secrets

### Changed
- `npm run dev:api` now remains the plain `tsx watch` command, while startup timing instrumentation is isolated to `dev:api:log`
- dev API startup logs were simplified to reduce noise and keep `bootstrap.start`, `listening`, and `ready` output concise
- README expanded and aligned with:
  - operational quickstart
  - app/admin/tests/deploy map
  - status snapshot and architecture-at-a-glance
  - explicit test strategy and dedicated UI-test workflow follow-up
  - updated commands/env docs for `DEV_API_DEBUG_LOGS` and `dev:api:log`
- TODO roadmap updated with:
  - explicit frontend UI/component test item plus dedicated GitHub Action follow-up
  - low-priority legal/privacy evaluation for optional access logging table
  - low-priority content refresh section (profile labels, highlighted GitHub repos, bio/hero copy)
  - closure of section `10. README, quickstart e documentazione`
  - closure of section 14 chart-functional follow-up

### Fixed
- Mermaid syntax in README architecture diagram now renders reliably in Markdown previewers
- admin release metadata in local dev now falls back to git (`commit`/`branch`) when deploy env vars are not exposed

## [1.1.5] - 2026-03-23

### Changed
- frontend debug console logs for content/profile bootstrap are now gated behind `VITE_DEBUG_LOGS=true` (disabled by default)
- admin route loading now uses admin-specific suspense fallbacks, removing generic/intermediate flashes and preventing footer jumps during lazy route resolution
- homepage hero image preload is now injected only on `/` and `/home`, reducing unused-preload warnings on admin routes
- DB latency chart tooltip now resolves the active sample correctly and formats time labels with `HH:mm:ss`

### Added
- TODO note to evaluate DB latency chart retention policy (rolling window vs full in-session history on `/admin`)

## [1.1.4] - 2026-03-23

### Added
- protected lightweight admin metric endpoint `/api/admin/metrics/db-latency` for DB-latency polling without full health payload
- `recharts`-based latency area chart in admin home (styled to match existing admin cards)

### Changed
- admin database card now renders `Latency trend` with responsive chart + themed tooltip/grid
- login and auth transition flow hardened to prevent post-login skeleton flicker (`/login` -> `/admin`) with session refresh dedup/cancel guards
- login route is rendered directly (without lazy suspense fallback) to avoid double-loading skeleton chain
- admin/login footer now uses static fallback identity/socials to avoid late re-render jumps from profile hydration
- admin hero title updated from `Admin Control Room` to `Dashboard Admin` and kept on one line on desktop
- login page layout spacing refined so footer is not clipped and sits lower in viewport
- dev API/debug logging standardized with `[DEBUG]` prefix and clearer startup/bootstrap diagnostics

### Fixed
- dev API request abort handling now listens to `req.aborted` (instead of `req.close`) to avoid false aborts that could stall POST login responses
- admin auth flows now use explicit client/server timeouts to prevent infinite pending on transient upstream stalls

## [1.1.3] - 2026-03-23

### Fixed
- hero language switches now force immediate locale-aligned fallback content until profile data for that locale is loaded
- typing transition fallback -> DB roles now avoids repeating the same role back-to-back when the first DB role matches the displayed fallback role
- profile context now exposes the locale associated with the currently loaded profile snapshot (`profileLang`) to prevent stale-locale UI merges during fetch transitions

## [1.1.2] - 2026-03-23

### Fixed
- resolved GitHub Actions lint failure (`react-hooks/set-state-in-effect`) in `HeroTyping`
- refactored typing state transitions to avoid synchronous `setState` inside effects, keeping language-switch reset immediate via keyed remount
- preserved role swap behavior at typing boundaries without cascading render warnings

## [1.1.1] - 2026-03-23

### Added
- a centralized hero fallback dataset in `src/data/heroFallback.json` (name, photo, socials, fallback roles, localized university badge)

### Changed
- hero fallback behavior on `/home` is now language-aware at switch time, so greeting/typing/university badge update immediately when locale changes
- typing updates are now stabilized to avoid unnecessary re-typing when incoming DB data is equivalent to current state
- navbar fallback branding now follows the same hero fallback source, keeping public identity consistent before DB hydration
- fallback and DB social badges are rendered with a stable canonical order (`LinkedIn`, then `GitHub`) to avoid visual reorder jumps

## [1.1.0] - 2026-03-23

### Added
- server-side contact delivery through `/api/contact` with Zod validation, rate limiting, and Resend integration
- dedicated API coverage for the contact flow, now included in the broader `test:api` suite
- a lightweight smoke suite covering the homepage shell and every current API endpoint, including public, contact, health, and admin paths
- a DB-backed admin CRUD integration suite for `/api/admin/table`, covering all current admin tables that support artificial records plus safe update/restore checks for the singleton `profile` and `profile_i18n` tables
- targeted failure-path coverage for admin endpoints, `/api/health`, and auth-session utilities
- repository-level coverage across all current repositories, including `adminAuthRepository`, `adminTableRepository`, `aboutRepository`, `experiencesRepository`, `profileRepository`, `projectsRepository`, and `skillsRepository`
- a dedicated GitHub Actions workflow for backend tests, with its own markdown summary and downloadable logs
- a protected `/api/admin/health` endpoint for richer operational metadata behind an admin session
- an admin landing page on `/admin` with health overview, runtime snapshot, and a direct entry to `/admin/tables`
- a protected `/api/admin/environment` endpoint exposing tracked/configured env snapshot for the admin home
- dedicated tests for `/api/admin/environment` (including auth/failure paths) and smoke coverage for the endpoint

### Changed
- homepage/public-load stability was reworked around TODO point 15:
  - public content bootstrap now uses controlled parallel fetches with section-level loading tracking
  - initial `/api/admin/session` bootstrap is skipped on public surfaces (`/home`) and kept for `/login` + `/admin*`
  - duplicate refresh triggers on `/home` were reduced (refresh on return from admin area only)
  - client fetch handling now retries only quick/transient aborts while preserving the 15s hard timeout
- local dev API runtime was hardened for cold-start diagnostics and stability:
  - added request/response timing traces (`request.start`, `handler.end`, `response.finish/close`) with request ids
  - replaced per-request dynamic handler import with static admin/home dispatch in `devApiServer`
  - added cooperative abort propagation (`AbortSignal`) from dev server to public route handlers
  - added startup warmup for public API endpoints with explicit `dev-api.warmup.ready` signal
- local root-path UX improved: `/` now redirects immediately to `/home` from `index.html` to avoid pre-mount blank screen
- public and admin routing were further stabilized for local and Vercel parity:
  - public endpoints are now dispatched through `/api/home` with rewrites preserving existing public paths (`/api/profile`, `/api/about`, etc.)
  - local dev API resolution now prioritizes explicit `admin.ts` and `home.ts` handlers without dynamic `[route]` fallbacks
- the public SPA route now canonicalizes to `/home`, with redirect from `/` and updated canonical/OG metadata
- admin unknown subroutes (`/admin/*`) now render an admin-specific fallback page instead of redirecting to the public home
- the admin login experience now includes an explicit loading skeleton and a stable fallback shell to prevent footer/layout jumps during lazy mount
- the contact form now submits through the backend instead of relying on `mailto:`
- contact notifications now include a styled HTML email body in addition to the plain-text fallback
- contact UX now surfaces clearer success and error states, including validation and service-availability feedback
- the contact email HTML now comes from a dedicated template module with explicit placeholder replacement and escaping for dynamic fields
- contact-flow coverage now also checks the extracted email template rendering and escaping behavior
- the public HTML entry now points to `/src/main.tsx`, matching the real frontend entry file
- the main CI workflow now focuses on `lint`, `typecheck`, and `build`, while backend tests run in a separate workflow
- the public `/api/health` payload is now intentionally minimal, while uptime, environment, start time, and deploy metadata moved to the protected admin health route
- uptime calculation now relies on real process uptime semantics instead of a module-local timestamp delta
- the admin CRUD console now lives on `/admin/tables`, while `/admin` acts as the operational home of the admin area
- the admin home UI has been refactored into smaller components with a simpler grid layout and component-local skeleton states
- environment-variable rendering in admin now keeps public values visible by default, limits reveal controls to secrets, and uses uniform value fields with keyboard-friendly overflow behavior
- admin type definitions now include `AdminHealthResponse`, `AdminEnvironmentResponse`, and `AdminEnvironmentVariable` to align frontend and API contracts
- admin endpoints are now dispatched through a single serverless entrypoint (`/api/admin`, with rewrite from `/api/admin/*`) and modular route handlers under `lib/services/admin-routes`, reducing function count pressure on Vercel Hobby while preserving existing admin API paths
- local dev API resolution now supports dynamic API route files (such as `[route]`) in addition to direct static matches

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
