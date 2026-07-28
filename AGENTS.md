# GeraTimes Client — AGENTS.md

Frontend **Ferino** (Angular 21) — gerenciamento de times e partidas de futebol.

## Commands

```bash
npm install              # node ≥20, npm ≥10
npm start                # ng serve → http://localhost:4200
npm run build            # production build → dist/geratimes-client/
npm run watch            # dev build with file watching
npm test                 # vitest run (all specs)
npm run test:watch       # vitest (watch mode)
npx vitest run --filter  # filtered test run (by name pattern)
npx ng g component ...   # schematics default: standalone + OnPush + SCSS
```

Backend must run at `http://localhost:8080` (local) or the Railway production URL.

## Architecture

| Layer | Path | Purpose |
|-------|------|---------|
| Config | `src/app/app.config.ts` | Zoneless, lazy routes, HTTP (JWT interceptor + XSRF), app initializer (SVG icon registration) |
| Routes | `src/app/app.routes.ts` | All lazy; auth guard + guest guard + verification guards; `/:id/edit` and `/:id/matches` routes must precede `/:id` child routes |
| Core | `src/app/core/` | Services, guards, interceptor, models (swagger DTOs), validators, utils, icon data, store (`club-detail.store.ts`) |
| Features | `src/app/features/` | Lazy-loaded pages: auth, clubs, dashboard, layout, matches, teams |
| Shared | `src/app/shared/` | Reusable components (12) and standalone pipes (4) |
| Styles | `src/styles/` | SCSS design system: `_variables.scss` (CSS props, tokens), `_mixins.scss` |

**Path aliases** (tsconfig.json + vitest.config.ts): `@core/*`, `@shared/*`, `@features/*`, `@styles/*`

## Conventions

- **Zoneless** + **standalone** + **OnPush** everywhere (angular.json schematics enforce this)
- **Reactive Forms only** (no Signal Forms)
- **`inject()` only**, no constructor DI
- **`@if/@for/@switch`** control flow only (no `*ngIf`/`*ngFor`)
- **SCSS**: CSS custom properties via `[data-theme="dark"]`/`[data-theme="light"]` on `:root`. Use `var(--...)` for all colors. Mixins: `@include card`, `@include btn-base`, `@include input-base`, etc.
- **SCSS imports**: `@use 'variables'` and `@use 'mixins'` work from any component without relative paths (angular.json `stylePreprocessorOptions.includePaths: ["src/styles"]`)
- **Fonts**: `'DM Sans'` (body), `'Bebas Neue'` (display) — loaded from Google Fonts in `index.html`
- **Locale**: `pt-BR` (pipe formatting)
- **Imports**: Use path aliases between top-level dirs (`@core/services/...`, `@shared/components/...`). Relative imports within same dir are common inside `core/`.
- **No ESLint, no typecheck script** — rely on `ng build` for compilation checks. There are no CI workflows.

## Auth (critical)

- **JWT token is in-memory only** (signal) — **never stored in localStorage**. Only user profile is persisted.
- Refresh token is an **httpOnly cookie** (`withCredentials: true`) — no manual cookie handling.
- Token refresh happens automatically in `auth.interceptor.ts` on 401 responses.
- Auth guard calls `refreshToken()` on first load; if it fails, logs out and redirects to `/auth/login`.
- Interceptor auto-adds `Authorization: Bearer <token>` to all API requests except public endpoints (login, refresh, logout, email-verify, email, POST /api/users).
- **XSRF**: `app.config.ts` configures `XSRF-TOKEN` cookie/header pair via `withXsrfConfiguration`.

## Environment

`src/environments/environment.ts` → production (`https://gerenciador-ferino.up.railway.app`).
`src/environments/environment.development.ts` → local (`http://localhost:8080`).
Angular file replacements in `angular.json` swap them for `--configuration development`.

API base path: `{apiUrl}/api/...`. All services build URLs from `environment.apiUrl`.

## Testing

- **Vitest** (via `@analogjs/vitest-angular`) — not Karma/Jasmine despite karma packages in devDependencies.
- `vitest.config.ts`: uses `@analogjs/vite-plugin-angular`, `jsdom` environment, `globals: true`, coverage via `@vitest/coverage-v8`.
- `tsconfig.json` root and `tsconfig.spec.json` both use `"types": ["vitest/globals"]` — describe/it/expect available globally.
- **Setup** (`src/test-setup.ts`): `BrowserDynamicTestingModule` (not `platformBrowserTesting`), `IntersectionObserver` mock (noop), `getTestBed().initTestEnvironment`.
- `tsconfig.spec.json` includes `src/**/*.spec.ts`, `src/**/*.d.ts`, `src/test-setup.ts`.
- ~44 spec files exist across all layers (services, guards, interceptors, components, pipes, validators, utils).
- Use `npx vitest run --filter <pattern>` to run a subset of tests.

## Theme

`ThemeService` manages `data-theme` attribute on `<html>` via signal + effect.
Persists choice to `localStorage` key `ferino_theme`. Falls back to `prefers-color-scheme`.
CSS variables for both themes are in `_variables.scss`.

## Key Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Login/logout/refresh JWT, user state signal, token expiry check |
| `ToastService` | Signal-based toast queue (success/error/info/warning, auto-dismiss) |
| `ClubContextService` | Stores selected club context (id + role) for club-scoped UIs |
| `ClubDetailStore` | Signal store for club detail state (id, data, loading) |
| `IconRegistryService` | Registers Material SVG icons on app init (used by `SvgIconComponent`) |
| `PendingVerificationService` | Manages email verification state in localStorage |

## Misc

- `landing-page.html` in the root is a standalone marketing page — not part of the Angular app build.
