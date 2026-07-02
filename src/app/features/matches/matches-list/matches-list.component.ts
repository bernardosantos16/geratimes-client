import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';
import { MatchResponseDTO } from '@core/models/api.models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MatchDatePipe } from '@shared/pipes/app.pipes';

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, PageHeaderComponent,
    LoadingSpinnerComponent, EmptyStateComponent, MatchDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'matches-list.component.html',
  styleUrls: ['matches-list.component.scss'],
})
export class MatchesListComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

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
    this.matchesService.getMatchesByClub(this.clubId, { page, size: 15, sort: 'dateTime,desc' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
