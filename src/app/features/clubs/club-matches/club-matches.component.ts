import { Component, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';

@Component({
    selector: 'app-club-matches',
    standalone: true,
    imports: [CommonModule, RouterModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'club-matches.component.html',
    styleUrls: ['../../../shared/components/club-detail-nav/club-detail-nav.component.scss', './club-matches.component.scss'],
})
export class ClubMatchesComponent {
    private readonly matchesService = inject(MatchesService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);
    readonly store = inject(ClubDetailStore);

    constructor() {
        this.loadMatches();
    }

    private loadMatches(): void {
        this.matchesService.getMatchesByClubAndUpcoming(this.store.clubId(), { size: 100 })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => this.store.matches.set(res.content),
                error: () => this.toast.error('Erro ao carregar partidas.'),
            });
    }
}
