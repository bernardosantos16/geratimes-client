import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatchesService } from '../../../core/services/matches.service';
import { ToastService } from '../../../core/services/toast.service';
import { MatchResponseDTO } from '../../../core/models/api.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MatchDatePipe } from '../../../shared/pipes/app.pipes';

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, PageHeaderComponent,
    LoadingSpinnerComponent, EmptyStateComponent, MatchDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Partidas" subtitle="Histórico e próximas partidas" eyebrow="Partidas">
      <a [routerLink]="['/clubs', clubId, 'matches', 'new']" class="btn-primary">+ Nova Partida</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-spinner label="Carregando partidas..." />
    } @else if (matches().length === 0) {
      <app-empty-state
        icon="⚽"
        title="Nenhuma partida ainda"
        message="Agende uma partida para começar a organizar os times."
        actionLabel="Agendar partida" />
    } @else {
      <div class="matches-list">
        @for (match of matches(); track match.id) {
          <a [routerLink]="['/matches', match.id]" class="match-card">
            <div class="match-date-col">
              <span class="match-time">{{ match.dateTime | matchDate:'time' }}</span>
              <span class="match-date">{{ match.dateTime | matchDate:'short' }}</span>
            </div>
            <div class="match-divider"></div>
            <div class="match-status" [class.upcoming]="isUpcoming(match)">
              {{ isUpcoming(match) ? '📅 Agendada' : '✓ Realizada' }}
            </div>
            <span class="arrow">›</span>
          </a>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" (click)="loadPage(currentPage() - 1)" [disabled]="currentPage() === 0">← Anterior</button>
          <span class="page-info">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
          <button class="page-btn" (click)="loadPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1">Próxima →</button>
        </div>
      }
    }
  `,
  styles: [`
    .btn-primary {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.55rem 1.25rem; border-radius: 8px; font-weight: 700;
      font-size: 0.88rem; cursor: pointer; text-decoration: none;
      transition: all 0.2s; display: inline-flex;
      &:hover { filter: brightness(1.1); }
    }

    .matches-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .match-card {
      display: flex; align-items: center; gap: 1.25rem;
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 12px; padding: 1rem 1.25rem;
      text-decoration: none; color: inherit;
      transition: border-color 0.15s, transform 0.15s;
      &:hover { border-color: var(--accent); transform: translateX(3px); }
    }

    .match-date-col { display: flex; flex-direction: column; min-width: 80px; }
    .match-time { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem;
      color: var(--accent); letter-spacing: 0.05em; line-height: 1; }
    .match-date { font-size: 0.75rem; color: var(--text3); }

    .match-divider { width: 1px; height: 36px; background: var(--border); }

    .match-status {
      padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600;
      background: var(--surface2); color: var(--text3); border: 1px solid var(--border);
      &.upcoming { background: var(--accent-dim); color: var(--accent); border-color: rgba(77,255,143,0.3); }
    }

    .arrow { color: var(--text3); font-size: 1.2rem; }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem;
    }

    .page-btn {
      background: var(--surface2); border: 1px solid var(--border); color: var(--text2);
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s;
      &:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .page-info { font-size: 0.85rem; color: var(--text2); }
  `],
})
export class MatchesListComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly matches = signal<MatchResponseDTO[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  clubId!: string;

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id')!;
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.matchesService.getMatchesByClub(this.clubId, { page, size: 15, sort: 'dateTime,desc' }).subscribe({
      next: (res) => {
        this.matches.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Erro ao carregar partidas.'); this.loading.set(false); },
    });
  }

  isUpcoming(match: MatchResponseDTO): boolean {
    return new Date(match.dateTime) > new Date();
  }
}
