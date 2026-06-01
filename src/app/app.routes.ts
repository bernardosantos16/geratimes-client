import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        title: 'Login — Ferino',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        title: 'Criar conta — Ferino',
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  // ── Protected ─────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard — Ferino',
      },
      // Clubs
      {
        path: 'clubs',
        loadComponent: () =>
          import('./features/clubs/clubs-list/clubs-list.component').then(
            (m) => m.ClubsListComponent
          ),
        title: 'Clubes — Ferino',
      },
      {
        path: 'clubs/new',
        loadComponent: () =>
          import('./features/clubs/club-form/club-form.component').then(
            (m) => m.ClubFormComponent
          ),
        title: 'Novo clube — Ferino',
      },
      {
        path: 'clubs/:id',
        loadComponent: () =>
          import('./features/clubs/club-detail/club-detail.component').then(
            (m) => m.ClubDetailComponent
          ),
        title: 'Clube — Ferino',
      },
      {
        path: 'clubs/:id/edit',
        loadComponent: () =>
          import('./features/clubs/club-form/club-form.component').then(
            (m) => m.ClubFormComponent
          ),
        title: 'Editar clube — Ferino',
      },
      // Club Overview
      {
        path: 'club/:id/overview',
        loadComponent: () =>
          import('./features/clubs/club-detail/club-detail.component').then(
            (m) => m.ClubDetailComponent
          ),
        title: 'Clube — Ferino',
      },
      // Matches
      {
        path: 'clubs/:id/matches',
        loadComponent: () =>
          import('./features/matches/matches-list/matches-list.component').then(
            (m) => m.MatchesListComponent
          ),
        title: 'Partidas — Ferino',
      },
      {
        path: 'matches/new',
        loadComponent: () =>
          import('./features/matches/match-form/match-form.component').then(
            (m) => m.MatchFormComponent
          ),
        title: 'Nova partida — Ferino',
      },
      {
        path: 'matches/:id',
        loadComponent: () =>
          import('./features/matches/match-detail/match-detail-export.component').then(
            (m) => m.MatchDetailComponent
          ),
        title: 'Partida — Ferino',
      },
      // Teams
      {
        path: 'matches/:matchId/generate',
        loadComponent: () =>
          import('./features/teams/generate-teams/generate-teams.component').then(
            (m) => m.GenerateTeamsComponent
          ),
        title: 'Gerar times — Ferino',
      },
      {
        path: 'clubs/:id/matches/new',
        loadComponent: () =>
          import('./features/matches/match-form/match-form.component').then(
            (m) => m.MatchFormComponent
          ),
        title: 'Nova partida — Ferino',
      },
    ],
  },
  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
