# GeraTimes — Cliente Angular

Frontend do sistema **Ferino** de gerenciamento de partidas e times de futebol.

## Stack

- **Angular 21** — Standalone Components + Signals
- **SCSS** — Design system fiel à landing page
- **RxJS** — Comunicação assíncrona
- **Reactive Forms** — Formulários com validações espelhando o backend

## Pré-requisitos

- Node.js ≥ 20
- npm ≥ 10
- Backend Spring Boot rodando em `http://localhost:8080`

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm start
# Acesse http://localhost:4200
```

## Build de produção

```bash
npm run build
```

## Estrutura

```
src/app/
├── core/
│   ├── guards/          # authGuard, guestGuard
│   ├── interceptors/    # JWT interceptor + error handling
│   ├── models/          # DTOs TypeScript (espelho do Swagger)
│   └── services/        # auth, clubs, matches, teams, users, toast, theme
├── features/
│   ├── auth/            # login, register
│   ├── clubs/           # list, detail (membros + camisas), form
│   ├── dashboard/       # visão geral
│   ├── layout/          # shell com sidebar responsivo
│   ├── matches/         # list, detail, form
│   └── teams/           # geração de times (wizard 3 passos)
└── shared/
    ├── components/      # spinner, empty-state, rating-stars, jersey-badge, toast, confirm-dialog
    └── pipes/           # matchDate, clubRole, matchPosition
```

## Variáveis de ambiente

Edite `src/environments/environment.ts` para apontar para o backend:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
};
```

## Funcionalidades

| Área | O que faz |
|------|-----------|
| Auth | Login JWT, registro, refresh automático, guard de rotas |
| Clubes | CRUD completo, gestão de membros (rating, função) e camisas |
| Partidas | Criação, listagem paginada, exclusão |
| Gerar Times | Wizard 3 passos: selecionar → configurar → resultado balanceado |
| UI | Tema dark/light, toast global, confirmação de exclusão, responsivo |
