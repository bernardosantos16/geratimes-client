import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '@core/services/notifications.service';
import { ToastService } from '@core/services/toast.service';
import { NotificationResponseDTO } from '@core/models/api.models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly notifications = signal<NotificationResponseDTO[]>([]);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.notificationsService.list(false, { size: 100, sort: 'createdAt,desc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.notifications.set(res.content);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Erro ao carregar notificações.');
          this.loading.set(false);
        },
      });
  }

  markRead(notification: NotificationResponseDTO): void {
    if (notification.read) return;
    this.notificationsService.markRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.update((arr) =>
            arr.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
          );
        },
        error: () => this.toast.error('Erro ao marcar notificação como lida.'),
      });
  }
}
