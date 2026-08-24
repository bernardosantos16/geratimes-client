import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { ClubMembershipRequestResponseDTO, InviteTokenResponseDTO } from '@core/models/api.models';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-membership-requests',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, SvgIconComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'membership-requests.component.html',
  styleUrls: ['membership-requests.component.scss'],
})
export class MembershipRequestsComponent implements OnInit {
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(ClubDetailStore);

  readonly loading = signal(true);
  readonly requests = signal<ClubMembershipRequestResponseDTO[]>([]);
  readonly processingId = signal<number | null>(null);

  readonly inviteToken = signal<InviteTokenResponseDTO | null>(null);
  readonly showToken = signal(false);
  readonly copied = signal(false);

  @ViewChild('confirmRegenerateDialog') private confirmRegenerateDialog!: ConfirmDialogComponent;

  ngOnInit(): void {
    this.loadRequests();
    this.loadToken();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.clubsService.getMembershipRequests(this.store.clubId(), 'PENDING', { size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.requests.set(res.content);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Erro ao carregar solicitações.');
          this.loading.set(false);
        },
      });
  }

  loadToken(): void {
    this.clubsService.getInviteToken(this.store.clubId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.inviteToken.set(res),
        error: () => this.toast.error('Erro ao carregar token de convite.'),
      });
  }

  toggleToken(): void {
    this.showToken.update((v) => !v);
  }

  confirmRegenerate(): void {
    this.confirmRegenerateDialog?.open();
  }

  regenerateToken(): void {
    this.clubsService.generateInviteToken(this.store.clubId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.inviteToken.set(res);
          this.showToken.set(false);
          this.copied.set(false);
          this.toast.success('Token de convite atualizado!');
        },
        error: () => this.toast.error('Erro ao regenerar token de convite.'),
      });
  }

  approve(request: ClubMembershipRequestResponseDTO): void {
    this.processingId.set(request.id);
    this.clubsService.approveMembershipRequest(this.store.clubId(), request.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requests.update((arr) => arr.filter((r) => r.id !== request.id));
          this.processingId.set(null);
          this.toast.success(`${request.name} agora é membro do clube.`);
        },
        error: () => {
          this.processingId.set(null);
          this.toast.error('Erro ao aprovar solicitação.');
        },
      });
  }

  reject(request: ClubMembershipRequestResponseDTO): void {
    this.processingId.set(request.id);
    this.clubsService.rejectMembershipRequest(this.store.clubId(), request.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requests.update((arr) => arr.filter((r) => r.id !== request.id));
          this.processingId.set(null);
          this.toast.success('Solicitação recusada.');
        },
        error: () => {
          this.processingId.set(null);
          this.toast.error('Erro ao recusar solicitação.');
        },
      });
  }

  copyToken(): void {
    const token = this.inviteToken()?.token;
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => this.toast.error('Não foi possível copiar o token.'));
  }
}
