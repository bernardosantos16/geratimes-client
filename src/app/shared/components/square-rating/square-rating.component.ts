import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-square-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'square-rating.component.html',
  styleUrls: ['square-rating.component.scss'],
})
export class SquareRatingComponent {
  @Input() value: number | null | undefined = 0;
  @Input() max = 5;
  @Input() interactive = false;
  @Input() size = 10;
  @Output() ratingChange = new EventEmitter<number>();

  get squares(): number[] {
    return Array.from({ length: this.max });
  }

  get normalizedValue(): number {
    return Math.max(0, Math.min(this.max, Math.round(this.value ?? 0)));
  }

  onSelect(rating: number): void {
    this.ratingChange.emit(rating);
  }
}
