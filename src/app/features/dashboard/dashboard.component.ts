import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ClubResponseDTO } from '@core/models/api.models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { MatchDatePipe } from '@shared/pipes/app.pipes';
import { DashboardService, PendingMatchItem, RecentResultItem } from '@core/services/dashboard.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, SvgIconComponent, MatchDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);
  private readonly clubContextService = inject(ClubContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly ownerClubs = signal<ClubResponseDTO[]>([]);
  readonly memberClubs = signal<ClubResponseDTO[]>([]);
  readonly upcomingMatchesCount = signal(0);
  readonly completedMatchesCount = signal(0);
  readonly pendingMatches = signal<PendingMatchItem[]>([]);
  readonly recentResults = signal<RecentResultItem[]>([]);
  readonly upcomingMatches = signal<RecentResultItem[]>([]);

  ngOnInit(): void {
    this.dashboardService.loadDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.ownerClubs.set(data.ownerClubs);
          this.memberClubs.set(data.memberClubs);
          this.pendingMatches.set(data.pendingMatches);
          this.upcomingMatchesCount.set(data.upcomingMatchesCount);
          this.recentResults.set(data.recentResults);
          this.completedMatchesCount.set(data.completedMatchesCount);
          this.upcomingMatches.set(data.upcomingMatches);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          const detail = (err as { error?: { detail?: string } }).error?.detail;
          this.toast.error(detail ?? 'Erro ao carregar dashboard.');
          this.loading.set(false);
        },
      });
  }

  selectClub(club: ClubResponseDTO, role: 'DIRECTOR' | 'MEMBER'): void {
    this.clubContextService.setClubContext(club.id, role);
  }
}
