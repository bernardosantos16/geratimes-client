import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';
import { verificationPendingGuard, tokenRequiredGuard } from '@core/guards/verification.guard';

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
        path: 'email',
        loadComponent: () =>
          import('./features/auth/email/email.component').then((m) => m.EmailComponent),
        title: 'Cadastro — Ferino',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        title: 'Login — Ferino',
      },
      {
        path: 'register',
        canActivate: [tokenRequiredGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        title: 'Criar conta — Ferino',
      },
      {
        path: 'email-verify',
        canActivate: [verificationPendingGuard],
        loadComponent: () =>
          import('./features/auth/email-verify/email-verify.component').then(
            (m) => m.EmailVerifyComponent
          ),
        title: 'Verificar e-mail — Ferino',
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
      // Rotas exatas DEVEM vir antes de clubs/:id para não serem capturadas pelos filhos
      {
        path: 'clubs/:id/edit',
        loadComponent: () =>
          import('./features/clubs/club-form/club-form.component').then(
            (m) => m.ClubFormComponent
          ),
        title: 'Editar clube — Ferino',
      },
      {
        path: 'clubs/:id/matches',
        loadComponent: () =>
          import('./features/matches/matches-list/matches-list.component').then(
            (m) => m.MatchesListComponent
          ),
        title: 'Partidas — Ferino',
      },
      {
        path: 'clubs/:id',
        loadComponent: () =>
          import('@shared/components/club-detail-nav/club-detail-nav.component').then(
            (m) => m.ClubDetailNavComponent
          ),
        title: 'Clube — Ferino',
        children: [
          { path: '', redirectTo: 'members', pathMatch: 'full' },
          {
            path: 'members',
            loadComponent: () =>
              import('@features/clubs/club-members/club-members.component').then(
                (m) => m.ClubMembersComponent
              ),
          },
          {
            path: 'jerseys',
            loadComponent: () =>
              import('@features/clubs/club-jerseys/club-jerseys.component').then(
                (m) => m.ClubJerseysComponent
              ),
          },
          {
            path: 'upcoming',
            loadComponent: () =>
              import('@features/clubs/club-matches/club-matches.component').then(
                (m) => m.ClubMatchesComponent
              ),
          },
        ],
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
