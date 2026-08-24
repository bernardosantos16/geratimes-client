import {
    Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import {
    ClubRole,
    ClubResponseDTO,
} from '@core/models/api.models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-club-detail-nav',
    standalone: true,
    imports: [
        CommonModule, RouterModule, RouterOutlet,
        PageHeaderComponent, LoadingSpinnerComponent, SvgIconComponent,
    ],
    providers: [ClubDetailStore],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'club-detail-nav.component.html',
    styleUrls: ['club-detail-nav.component.scss'],
})
export class ClubDetailNavComponent implements OnInit {
    private readonly clubsService = inject(ClubsService);
    private readonly toast = inject(ToastService);
    private readonly route = inject(ActivatedRoute);
    private readonly clubContextService = inject(ClubContextService);
    private readonly destroyRef = inject(DestroyRef);
    readonly store = inject(ClubDetailStore);

    readonly tabs: { label: string; icon: string; route: string; directorOnly?: boolean }[] = [
        { label: 'Membros', icon: 'groups', route: 'members' },
        { label: 'Camisas', icon: 'apparel', route: 'jerseys' },
        { label: 'Partidas', icon: 'soccer_ball', route: 'upcoming' },
        { label: 'Solicitações', icon: 'notifications', route: 'membership-requests', directorOnly: true },
    ];

    ngOnInit(): void {
        const clubId = this.route.snapshot.paramMap.get('id')!;
        this.store.setClubId(clubId);

        const contextRole = this.getRoleFromContext();
        if (contextRole) {
            this.store.userRole.set(contextRole);
        }

        forkJoin({
            club: this.clubsService.getClubById(clubId),
            directorClubs: this.clubsService.getClubs('DIRECTOR'),
            memberClubs: this.clubsService.getClubs('MEMBER'),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: ({ club, directorClubs, memberClubs }) => {
                this.store.club.set(club);
                const resolvedRole =
                    this.resolveRoleFromClubLists(directorClubs, memberClubs) ?? this.getRoleFromContext();
                this.store.userRole.set(resolvedRole);
                if (resolvedRole) {
                    this.clubContextService.setClubContext(clubId, resolvedRole);
                }
                this.store.loading.set(false);
            },
            error: (err: unknown) => {
                this.toast.error('Erro ao carregar dados do clube.');
                this.store.loading.set(false);
            },
        });
    }

    private getRoleFromContext(): ClubRole | null {
        const selectedClubId = this.clubContextService.selectedClubId();
        const clubId = this.store.clubId();
        if (selectedClubId !== clubId) return null;
        return this.clubContextService.selectedClubRole();
    }

    private resolveRoleFromClubLists(
        directorClubs: ClubResponseDTO[],
        memberClubs: ClubResponseDTO[]
    ): ClubRole | null {
        const clubId = this.store.clubId();
        if (directorClubs.some((club) => club.id === clubId)) return 'DIRECTOR';
        if (memberClubs.some((club) => club.id === clubId)) return 'MEMBER';
        return null;
    }
}
