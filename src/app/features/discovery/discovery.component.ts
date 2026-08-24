import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, forkJoin } from 'rxjs';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubResponseDTO } from '@core/models/api.models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-discovery',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    LoadingSpinnerComponent, EmptyStateComponent, SvgIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'discovery.component.html',
  styleUrls: ['discovery.component.scss'],
})
export class DiscoveryComponent implements OnInit {
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = this.fb.control('');
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly results = signal<ClubResponseDTO[]>([]);
  readonly myClubIds = signal<Set<string>>(new Set());

  readonly joiningId = signal<string | null>(null);
  readonly token = signal('');
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((value) => value.trim().length >= 2),
      switchMap((value) => {
        this.loading.set(true);
        return this.clubsService.searchClubs(value.trim());
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (clubs) => {
        this.results.set(clubs);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao buscar clubes.');
        this.loading.set(false);
      },
    });

    forkJoin({
      director: this.clubsService.getClubs('DIRECTOR'),
      member: this.clubsService.getClubs('MEMBER'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ director, member }) => {
        this.myClubIds.set(new Set([...director, ...member].map((club) => club.id)));
      },
      error: () => {
        this.myClubIds.set(new Set());
      },
    });
  }

  isMyClub(club: ClubResponseDTO): boolean {
    return this.myClubIds().has(club.id);
  }

  goToClub(club: ClubResponseDTO): void {
    this.router.navigate(['/clubs', club.id]);
  }

  startJoin(club: ClubResponseDTO): void {
    this.joiningId.set(club.id);
    this.token.set('');
  }

  cancelJoin(): void {
    this.joiningId.set(null);
    this.token.set('');
  }

  submitJoin(club: ClubResponseDTO): void {
    if (club.joinPolicy === 'INVITE_ONLY' && !this.token().trim()) {
      this.toast.warning('Este clube exige um token de convite.');
      return;
    }
    this.submitting.set(true);
    this.clubsService.joinClub(club.id, { token: this.token().trim() || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Solicitação de entrada enviada!');
          this.submitting.set(false);
          this.joiningId.set(null);
          this.token.set('');
        },
        error: (err: unknown) => {
          const detail = (err as { error?: { detail?: string } }).error?.detail;
          this.toast.error(detail ?? 'Não foi possível solicitar entrada.');
          this.submitting.set(false);
        },
      });
  }
}
