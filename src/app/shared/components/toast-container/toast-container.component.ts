import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'toast-container.component.html',
  styleUrls: ['toast-container.component.scss'],
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  iconFor(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };
    return icons[type] ?? 'ℹ';
  }
}
