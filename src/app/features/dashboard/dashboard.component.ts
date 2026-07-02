import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClubsService } from '@core/services/clubs.service';
import { AuthService } from '@core/services/auth.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ClubResponseDTO } from '@core/models/api.models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";
import {MatchesService} from "@core/services/matches.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly clubsService = inject(ClubsService);
  private readonly matchesService = inject(MatchesService);
  private readonly clubContextService = inject(ClubContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly ownerClubs = signal<ClubResponseDTO[]>([]);
  readonly memberClubs = signal<ClubResponseDTO[]>([]);
  readonly totalMatches = signal(0);
  readonly upcomingMatchesCount = signal(0);
  readonly pendingMatchesResult = signal(0);

  ngOnInit(): void {
    this.clubsService.getClubs('DIRECTOR').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (clubs) => {
        this.ownerClubs.set(clubs);
        this.checkLoadingComplete();
      },
    });

    this.clubsService.getClubs('MEMBER').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (clubs) => {
        this.memberClubs.set(clubs);
        this.checkLoadingComplete();
      },
    });
  }

  private checkLoadingComplete(): void {
    // Ambas as requisições já foram completadas
    this.loading.set(false);

  }

  selectClub(club: ClubResponseDTO, role: 'DIRECTOR' | 'MEMBER'): void {
    this.clubContextService.setClubContext(club.id, role);
  }
}

