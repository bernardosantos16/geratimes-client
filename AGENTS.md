# GeraTimes Client — AGENTS.md

Frontend **Ferino** (Angular 21) — gerenciamento de times e partidas de futebol.

## Commands

```bash
npm install              # node ≥20, npm ≥10
npm start                # ng serve → http://localhost:4200
npm run build            # production build → dist/geratimes-client/
npm run watch            # dev build with file watching
npm test                 # Karma/Jasmine (no vitest)
npx ng g component ...   # schematics default: standalone + OnPush + SCSS
```

Backend must run at `http://localhost:8080` (local) or the Railway production URL.

## Architecture

| Layer | Path | Purpose |
|-------|------|---------|
| Config | `src/app/app.config.ts` | Zoneless, lazy routes, HTTP (JWT interceptor + XSRF), app initializer (SVG icon registration) |
| Routes | `src/app/app.routes.ts` | All lazy; auth guard + guest guard + verification guards |
| Core | `src/app/core/` | Services, guards, interceptor, models (swagger DTOs), validators, icon data |
| Features | `src/app/features/` | Lazy-loaded pages: auth, clubs, dashboard, layout, matches, teams |
| Shared | `src/app/shared/` | Reusable components (12) and standalone pipes (4) |
| Styles | `src/styles/` | SCSS design system: `_variables.scss` (CSS props, tokens), `_mixins.scss` |

**Path aliases** (tsconfig.json): `@core/*`, `@shared/*`, `@features/*`, `@styles/*`

## Conventions

- **Zoneless** + **standalone** + **OnPush** everywhere (angular.json schematics enforce this)
- **Reactive Forms only** (no Signal Forms despite AGENTS.md boilerplate)
- **`inject()` only**, no constructor DI
- **`@if/@for/@switch`** control flow only (no `*ngIf`/`*ngFor`)
- **SCSS**: CSS custom properties via `[data-theme="dark"]`/`[data-theme="light"]` on `:root`. Use `var(--...)` for all colors. Mixins: `@include card`, `@include btn-base`, `@include input-base`, etc.
- **Fonts**: `'DM Sans'` (body), `'Bebas Neue'` (display) — loaded from Google Fonts in `index.html`
- **Locale**: `pt-BR` (pipe formatting)
- **Imports**: Use path aliases between top-level dirs (`@core/services/...`, `@shared/components/...`). Relative imports within same dir are common inside `core/`.

## Auth (critical)

- **JWT token is in-memory only** (signal) — **never stored in localStorage**. Only user profile is persisted.
- Refresh token is an **httpOnly cookie** (`withCredentials: true`) — no manual cookie handling.
- Token refresh happens automatically in `auth.interceptor.ts` on 401 responses.
- Auth guard calls `refreshToken()` on first load; if it fails, logs out and redirects to `/auth/login`.
- Interceptor auto-adds `Authorization: Bearer <token>` to all API requests except public endpoints (login, refresh, logout, email-verify, email, POST /api/users).

## Environment

`src/environments/environment.ts` → production (`https://gerenciador-ferino.up.railway.app`).
`src/environments/environment.development.ts` → local (`http://localhost:8080`).
Angular file replacements in `angular.json` swap them for `--configuration development`.

API base path: `{apiUrl}/api/...`. All services build URLs from `environment.apiUrl`.

## Testing

- **Karma + Jasmine** (not Vitest). Run: `npm test`.
- No test files currently exist (`*.spec.ts` files are absent).
- `tsconfig.spec.json` uses `"types": ["jasmine"]`.

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
| `IconRegistryService` | Registers Material SVG icons on app init (used by `SvgIconComponent`) |

## Known issues

- `README.md` has unresolved git merge conflict markers (lines 1 and 79-81).
