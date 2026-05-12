import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stars" [class.interactive]="interactive" [attr.aria-label]="'Nota: ' + value + ' de 5'">
      @for (star of stars; track $index) {
        <span
          class="star"
          [class.filled]="$index < value"
          (click)="interactive && onSelect($index + 1)"
          (keydown.enter)="interactive && onSelect($index + 1)"
          [tabindex]="interactive ? 0 : -1"
          [attr.role]="interactive ? 'button' : null"
          [attr.aria-label]="'Nota ' + ($index + 1)">
          ★
        </span>
      }
    </div>
  `,
  styles: [`
    .stars {
      display: inline-flex;
      gap: 2px;

      &.interactive .star {
        cursor: pointer;
        transition: transform 0.1s;
        &:hover { transform: scale(1.2); }
      }
    }

    .star {
      font-size: 1rem;
      color: var(--border-strong);
      transition: color 0.15s;

      &.filled {
        color: var(--yellow);
      }
    }
  `],
})
export class RatingStarsComponent {
  @Input() value = 0;
  @Input() max = 5;
  @Input() interactive = false;
  @Output() ratingChange = new EventEmitter<number>();

  get stars(): number[] {
    return Array(this.max).fill(0);
  }

  onSelect(rating: number): void {
    this.ratingChange.emit(rating);
  }
}
