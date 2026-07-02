import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'loading-spinner.component.html',
  styleUrls: ['loading-spinner.component.scss'],
})
export class LoadingSpinnerComponent {
  @Input() size = 32;
  @Input() overlay = false;
  @Input() label = '';
}
