import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ClubResponseDTO } from '@core/models/api.models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";
import { DiscoveryComponent } from '@features/discovery/discovery.component';

@Component({
  selector: 'app-clubs-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, PageHeaderComponent,
    LoadingSpinnerComponent, EmptyStateComponent, ConfirmDialogComponent, SvgIconComponent,
    DiscoveryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'clubs-list.component.html',
  styleUrls: ['clubs-list.component.scss'],
})
export class ClubsListComponent implements OnInit {
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly clubContextService = inject(ClubContextService);
  protected readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('confirmDialog') private confirmDialog!: ConfirmDialogComponent;

  readonly loading = signal(true);
  readonly clubs = signal<ClubResponseDTO[]>([]);
  private pendingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.clubsService.getClubs('DIRECTOR').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (clubs) => { this.clubs.set(clubs); this.loading.set(false); },
      error: (err: unknown) => { this.toast.error('Erro ao carregar clubes.'); this.loading.set(false); },
    });
  }

  confirmDelete(club: ClubResponseDTO): void {
    this.pendingDeleteId.set(club.id);
    this.confirmDialog.open();
  }

  onDeleteConfirmed(): void {
    const id = this.pendingDeleteId();
    if (!id) return;

    this.clubsService.deleteClub(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Clube excluído.');
        this.clubs.update((c) => c.filter((club) => club.id !== id));
        this.pendingDeleteId.set(null);
      },
      error: (err: unknown) => this.toast.error('Erro ao excluir clube.'),
    });
  }

  openClubOverview(clubId: string): void {
    this.clubContextService.setClubContext(clubId, 'DIRECTOR');
  }
}
