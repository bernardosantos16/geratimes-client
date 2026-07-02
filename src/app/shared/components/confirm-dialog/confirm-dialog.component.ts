import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
    imports: [CommonModule, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'confirm-dialog.component.html',
  styleUrls: ['confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirmar';
  @Input() message = 'Tem certeza?';
  @Input() icon = "warning";
  @Input() iconColor = "var(--yellow)";
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
