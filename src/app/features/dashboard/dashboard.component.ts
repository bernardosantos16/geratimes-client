import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClubsService } from '@core/services/clubs.service';
import { MatchesService } from '@core/services/matches.service';
import { AuthService } from '@core/services/auth.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ClubResponseDTO, MatchResponseDTO } from '@core/models/api.models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, DatePipe, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <!-- Hero greeting -->
      <div class="greeting">
        <div class="greeting-text">
          <span class="eyebrow">Bem-vindo de volta</span>
          <h1>Olá, <span class="accent">{{ auth.currentUser()?.name ?? 'jogador' }}</span></h1>
          <p>Organize suas partidas e times com facilidade.</p>
        </div>
        <a routerLink="/clubs/new" class="btn-primary">+ Novo Clube</a>
      </div>

      @if (loading()) {
        <app-loading-spinner label="Carregando..." />
      } @else {
        <!-- Quick stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <app-svg-icon
                name="stadium"
                size="35px"
                ariaLabel="Stadium icon">
            </app-svg-icon>
            <div class="stat-body">
              <span class="stat-value">{{ ownerClubs().length + memberClubs().length }}</span>
              <span class="stat-label">Clubes</span>
            </div>
          </div>
          <div class="stat-card">
            <app-svg-icon
                name="soccer_ball"
                size="35px"
                ariaLabel="Ball icon">
            </app-svg-icon>
            <div class="stat-body">
              <span class="stat-value">{{ totalMatches() }}</span>
              <span class="stat-label">Partidas</span>
            </div>
          </div>
          <div class="stat-card">
            <app-svg-icon
                name="calendar_today"
                size="35px"
                ariaLabel="Calendar icon">
            </app-svg-icon>
            <div class="stat-body">
              <span class="stat-value">{{ upcomingMatchesCount() }}</span>
              <span class="stat-label">Próximas</span>
            </div>
          </div>
        </div>

        <!-- Owner Clubs -->
        <div class="dashboard-grid">
          <section class="section-card">
            <div class="section-header">
              <h2>Clubes como Diretor</h2>
              <a routerLink="/clubs" class="btn-link">Ver todos →</a>
            </div>
            @if (ownerClubs().length === 0) {
              <div class="empty-section">
                <app-svg-icon
                    name='stadium'
                    size='45px'
                    ariaLabel='Stadium icon'>
                </app-svg-icon>
                <p>Nenhum clube como diretor.</p>
                <a routerLink="/clubs/new" class="btn-sm">+ Criar Novo Clube</a>
              </div>
            } @else {
              <div class="club-list">
                @for (club of ownerClubs().slice(0, 5); track club.id) {
                  <a [routerLink]="['/club', club.id, 'overview']" class="club-row owner-club" (click)="selectClub(club, 'DIRECTOR')">
                    <div class="club-avatar">{{ club.nickname[0]?.toUpperCase() }}</div>
                    <div class="club-info">
                      <span class="club-name">{{ club.name }}</span>
                      <span class="club-nick">{{ '@' + club.nickname }}</span>
<!--                      <span class="role-tag director">Diretor</span>-->
                    </div>
                    <span class="arrow">›</span>
                  </a>
                }
              </div>
            }
          </section>

          <!-- Member Clubs -->
          <section class="section-card">
            <div class="section-header">
              <h2>Clubes como Membro</h2>
              <a routerLink="/clubs" class="btn-link">Ver todos →</a>
            </div>
            @if (memberClubs().length === 0) {
              <div class="empty-section">
                <app-svg-icon
                    name='stadium'
                    size='45px'
                    ariaLabel='Stadium icon'>
                </app-svg-icon>
                <p>Nenhum clube como membro.</p>
              </div>
            } @else {
              <div class="club-list">
                @for (club of memberClubs().slice(0, 5); track club.id) {
                  <a [routerLink]="['/club', club.id, 'overview']" class="club-row member-club" (click)="selectClub(club, 'MEMBER')">
                    <div class="club-avatar">{{ club.nickname[0]?.toUpperCase() }}</div>
                    <div class="club-info">
                      <span class="club-name">{{ club.name }}</span>
                      <span class="club-nick">{{ '@' + club.nickname }}</span>
<!--                      <span class="role-tag member">Membro</span>-->
                    </div>
                    <span class="arrow">›</span>
                  </a>
                }
              </div>
            }
          </section>
        </div>

        <!-- Upcoming Matches -->
        @if (upcomingMatchesList().length > 0) {
          <section class="section-card">
            <div class="section-header">
              <h2>Próximas Partidas</h2>
            </div>
            <div class="match-list">
              @for (match of upcomingMatchesList(); track match.id) {
                <a [routerLink]="['/matches', match.id]" class="match-row">
                  <div class="match-date-block">
                    <span class="match-day">{{ match.dateTime | date:'dd/MM/yyyy' }}</span>
                    <span class="match-full">{{ match.dateTime | date:'HH:mm' }}</span>
                  </div>
                  <span class="arrow">›</span>
                </a>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 2rem; }

    .greeting {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap;
      padding: 2rem; background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; position: relative; overflow: hidden;

      &::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, var(--accent), transparent);
      }
    }

    .eyebrow {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 0.3rem;
    }

    h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem;
      letter-spacing: 0.04em; line-height: 1; }
    .accent { color: var(--accent); }

    .greeting-text p { font-size: 0.9rem; color: var(--text2); margin-top: 0.4rem; }

    .btn-primary {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.6rem 1.4rem; border-radius: 8px; font-weight: 700;
      font-size: 0.88rem; cursor: pointer; text-decoration: none;
      transition: all 0.2s; white-space: nowrap; align-self: flex-start;
      display: inline-flex; align-items: center;
      &:hover { filter: brightness(1.1); transform: translateY(-1px); }
    }

    /* Stats */
    .stats-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .stat-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 12px; padding: 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 1rem;
      transition: border-color 0.2s;
      &:hover { border-color: var(--accent); }
    }

    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 2rem;
      color: var(--accent); line-height: 1; }
    .stat-label { font-size: 0.8rem; color: var(--text2); }

    /* Grid */
    .dashboard-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }

    .section-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
    }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      h2 { font-size: 0.95rem; font-weight: 600; color: var(--text); }
    }

    .btn-link { font-size: 0.8rem; color: var(--accent); text-decoration: none; font-weight: 500;
      &:hover { text-decoration: underline; } }

    .empty-section {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      padding: 2rem; text-align: center;
      span { font-size: 2rem; opacity: 0.4; }
      p { font-size: 0.85rem; color: var(--text2); }
    }

    .btn-sm {
      background: var(--surface2); border: 1px solid var(--border); color: var(--text2);
      padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500;
      text-decoration: none; transition: all 0.2s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    /* Club list */
    .club-list, .match-list { display: flex; flex-direction: column; gap: 0.35rem; }

    .club-row, .match-row {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem;
      border-radius: 8px; border: 1px solid var(--border); text-decoration: none;
      transition: all 0.15s; cursor: pointer;
      &:hover { background: var(--surface2); border-color: var(--accent); }
    }

    .owner-club { border-color: var(--border); }
    .member-club { border-color: var(--border); }

    .club-avatar {
      width: 34px; height: 34px; border-radius: 8px;
      background: var(--accent-dim); color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
    }

    .club-info { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .club-name { font-size: 0.9rem; font-weight: 600; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .club-nick { font-size: 0.75rem; color: var(--text3); }

    .match-date-block { display: flex; flex-direction: column; flex: 1; }
    .match-day { font-size: 0.88rem; font-weight: 600; color: var(--text); }
    .match-full { font-size: 0.75rem; color: var(--text2); }

    .arrow { color: var(--text3); font-size: 1.1rem; }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly clubsService = inject(ClubsService);
  private readonly matchesService = inject(MatchesService);
  private readonly clubContextService = inject(ClubContextService);

  readonly loading = signal(true);
  readonly ownerClubs = signal<ClubResponseDTO[]>([]);
  readonly memberClubs = signal<ClubResponseDTO[]>([]);
  readonly totalMatches = signal(0);
  readonly upcomingMatchesCount = signal(0);
  readonly upcomingMatchesList = signal<MatchResponseDTO[]>([]);

  ngOnInit(): void {
    forkJoin({
      ownerClubs: this.clubsService.getClubs('DIRECTOR'),
      memberClubs: this.clubsService.getClubs('MEMBER'),
    }).subscribe({
      next: ({ ownerClubs, memberClubs }) => {
        this.ownerClubs.set(ownerClubs);
        this.memberClubs.set(memberClubs);

        // Combinar todos os clubes e carregar próximas partidas
        const allClubs = [...ownerClubs, ...memberClubs];
        this.loadUpcomingMatches(allClubs);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadUpcomingMatches(clubs: ClubResponseDTO[]): void {
    if (clubs.length === 0) {
      this.loading.set(false);
      return;
    }

    // Chamar getMatchesByClubAndUpcoming para cada clube
    const upcomingRequests = clubs.map(club =>
      this.matchesService.getMatchesByClubAndUpcoming(club.id, { size: 100 })
    );

    forkJoin(upcomingRequests).subscribe({
      next: (results) => {
        // Combinar todas as partidas de todos os clubes
        const allUpcomingMatches: MatchResponseDTO[] = [];
        results.forEach(pageResult => {
          if (pageResult.content) {
            allUpcomingMatches.push(...pageResult.content);
          }
        });

        // Remover duplicatas (uma partida pode aparecer em múltiplos clubes)
        const uniqueMatches = Array.from(new Map(
          allUpcomingMatches.map(m => [m.id, m])
        ).values());

        this.totalMatches.set(uniqueMatches.length);
        this.upcomingMatchesCount.set(uniqueMatches.length);
        this.upcomingMatchesList.set(uniqueMatches.slice(0, 5)); // Top 5

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectClub(club: ClubResponseDTO, role: 'DIRECTOR' | 'MEMBER'): void {
    this.clubContextService.setClubContext(club.id, role);
  }
}
