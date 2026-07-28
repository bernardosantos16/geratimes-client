# GeraTimes — Cliente Angular

Frontend do sistema **Ferino** de gerenciamento de partidas e times de futebol.

## Stack

- **Angular 21** — Standalone Components + Signals
- **SCSS** — Design system fiel à landing page
- **RxJS** — Comunicação assíncrona
- **Reactive Forms** — Formulários com validações espelhando o backend
- **Vitest** — Testes unitários (322 specs, Zoneless + OnPush)

## Pré-requisitos

- Node.js ≥ 20
- npm ≥ 10
- Backend Spring Boot rodando em `http://localhost:8080` (ou Railway)

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm start          # http://localhost:4200
npm run build      # production build → dist/geratimes-client/
npm test           # vitest run (322 testes)
```

## Estrutura

```
src/app/
├── core/
│   ├── guards/          # authGuard, guestGuard, verificationGuard
│   ├── interceptors/    # JWT + refresh automático
│   ├── models/          # DTOs TypeScript (Swagger)
│   ├── services/        # auth, clubs, matches, teams, users, toast, theme, dashboard
│   ├── utils/           # fallbackTeamColor, buildPageableParams
│   └── validators/      # matchPasswordValidator
├── features/
│   ├── auth/            # login, register, email, email-verify
│   ├── clubs/           # club-list, club-form, club-members, club-jerseys, club-matches
│   ├── dashboard/       # visão geral
│   ├── layout/          # shell com sidebar responsivo
│   ├── matches/         # match-list, match-form, match-detail
│   └── teams/           # generate-teams (wizard 3 passos)
└── shared/
    ├── components/      # spinner, empty-state, page-header, player-item, team-card,
    │                    # jersey-badge, member-card, square-rating, svg-icon,
    │                    # confirm-dialog, toast-container, step-indicator
    └── pipes/           # matchDate, clubRole, matchPosition, contrast
```

## Variáveis de ambiente

Edite `src/environments/environment.ts` para desenvolvimento local ou produção:

```ts
// development
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
};

// production (troca automática via angular.json)
export const environment = {
  production: true,
  apiUrl: 'https://gerenciador-ferino.up.railway.app',
};
```

## Testes

```bash
npm test                 # todos os testes (322)
npx vitest run --filter  # testes filtrados por nome
```

Cobertura: serviços, pipes, guards, interceptors, componentes compartilhados e de feature.

Arquitetura de testes: `TestBed` com `BrowserDynamicTestingModule`, mocks via `useValue`, `runInInjectionContext` para guards, `DomSanitizer` para SVG.

## Funcionalidades

| Área | O que faz |
|------|-----------|
| Auth | Login JWT, registro com verificação de email, refresh automático, guards |
| Clubes | CRUD completo, gestão de membros (rating, posição, estatísticas) e camisas |
| Partidas | Criação única ou em lote, listagem paginada, definição de resultado (campeão + MVP) |
| Gerar Times | Wizard 3 passos: selecionar jogadores → configurar → times balanceados com drag-drop |
| UI | Tema dark/light, toast global, confirmação de exclusão, responsivo |

## Auth (detalhes)

- Token JWT em memória (signal), nunca em localStorage
- Refresh token via cookie httpOnly (withCredentials: true)
- Renovação automática em 401 no interceptor
- Guard de verificação de email no fluxo de registro
