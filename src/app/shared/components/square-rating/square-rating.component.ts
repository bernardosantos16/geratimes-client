import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-square-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="square-rating"
      [class.interactive]="interactive"
      [style.--square-size.px]="size"
      [attr.aria-label]="'Nível ' + normalizedValue + ' de ' + max">
      @for (square of squares; track $index) {
        <span
          class="rating-square"
          [class.filled]="$index < normalizedValue"
          (click)="interactive && onSelect($index + 1)"
          (keydown.enter)="interactive && onSelect($index + 1)"
          (keydown.space)="interactive && onSelect($index + 1)"
          [tabindex]="interactive ? 0 : -1"
          [attr.role]="interactive ? 'button' : null"
          [attr.aria-label]="'Nível ' + ($index + 1)">
        </span>
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      line-height: 1;
    }

    .square-rating {
      --square-size: 10px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .rating-square {
      width: var(--square-size);
      height: var(--square-size);
      border-radius: 2px;
      background: var(--border);
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }

    .rating-square.filled {
      background: var(--orange);
    }

    .square-rating.interactive .rating-square {
      cursor: pointer;
    }

    .square-rating.interactive .rating-square:hover,
    .square-rating.interactive .rating-square:focus-visible {
      outline: none;
      transform: scale(1.2);
      background: var(--orange);
    }
  `],
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
