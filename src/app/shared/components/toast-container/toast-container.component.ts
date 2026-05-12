import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type" role="alert">
          <span class="toast-icon">{{ iconFor(toast.type) }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Fechar">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
      max-width: 380px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      pointer-events: all;
      animation: slideIn 0.25s ease;
      font-size: 0.88rem;
      color: var(--text);
    }

    .toast--success { border-color: var(--accent); background: var(--accent-dim); }
    .toast--error   { border-color: var(--red);    background: var(--red-dim); }
    .toast--warning { border-color: var(--yellow);  background: var(--yellow-dim); }
    .toast--info    { border-color: var(--blue);    background: var(--blue-dim); }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    .toast-icon { font-size: 1rem; flex-shrink: 0; }
    .toast-msg  { flex: 1; line-height: 1.4; }

    .toast-close {
      background: none;
      border: none;
      color: var(--text2);
      font-size: 1.2rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 2px;
      flex-shrink: 0;
      transition: color 0.15s;
      &:hover { color: var(--text); }
    }
  `],
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
