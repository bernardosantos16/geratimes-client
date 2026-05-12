import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ContrastPipe} from "@shared/pipes/app.pipes";

@Component({
  selector: 'app-jersey-badge',
  standalone: true,
  imports: [CommonModule, ContrastPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="jersey-badge" [style.background]="hexColor" [title]="name">
      <span class="jersey-name" [style.color]="hexColor | contrast" >{{ name }}</span>
      @if (isGoalkeeper) {
        <span class="gk-tag">GK</span>
      }
    </span>
  `,
  styles: [`
    .jersey-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 6px;
      border-radius: 100px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #fff;
      background: var(--surface2);
      border: 1px solid var(--border);
      mix-blend-mode: normal;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
    }

    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: inherit;
      border: 1.5px solid rgba(255,255,255,0.3);
      flex-shrink: 0;
    }

    .jersey-name {
      color: #fff;
      padding: 4px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }

    .gk-tag {
      background: rgba(0,0,0,0.35);
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 0.65rem;
      letter-spacing: 0.04em;
    }
  `],
})
export class JerseyBadgeComponent {
  @Input() name = '';
  @Input() hexColor = '#888';
  @Input() isGoalkeeper = false;
}
