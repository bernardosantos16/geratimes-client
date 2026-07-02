import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'empty-state.component.html',
  styleUrls: ['empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Nenhum item encontrado';
  @Input() message = 'Não há dados para exibir no momento.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
