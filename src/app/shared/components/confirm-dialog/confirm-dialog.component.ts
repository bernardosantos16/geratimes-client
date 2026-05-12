import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="backdrop" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()" role="dialog" [attr.aria-label]="title">
          <div class="dialog-icon">{{ icon }}</div>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="onCancel()">{{ cancelLabel }}</button>
            <button class="btn-confirm" [class.danger]="danger" (click)="onConfirm()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

    .dialog {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      max-width: 420px;
      width: 90%;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .dialog-icon { font-size: 2.5rem; }

    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
    }

    p {
      font-size: 0.9rem;
      color: var(--text2);
      line-height: 1.6;
    }

    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 0.5rem;
    }

    button {
      padding: 0.55rem 1.4rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-cancel {
      background: var(--surface2);
      color: var(--text2);
      border: 1px solid var(--border);
      &:hover { border-color: var(--text3); color: var(--text); }
    }

    .btn-confirm {
      background: var(--accent);
      color: #050f09;
      &.danger { background: var(--red); color: #fff; }
      &:hover { filter: brightness(1.1); }
    }
  `],
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirmar';
  @Input() message = 'Tem certeza?';
  @Input() icon = '⚠️';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly visible = signal(false);

  open(): void { this.visible.set(true); }
  close(): void { this.visible.set(false); }

  onConfirm(): void {
    this.visible.set(false);
    this.confirmed.emit();
  }

  onCancel(): void {
    this.visible.set(false);
    this.cancelled.emit();
  }
}
