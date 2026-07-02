import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ContrastPipe} from "@shared/pipes/app.pipes";

@Component({
  selector: 'app-jersey-badge',
  standalone: true,
  imports: [CommonModule, ContrastPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'jersey-badge.component.html',
  styleUrls: ['jersey-badge.component.scss'],
})
export class JerseyBadgeComponent {
  @Input() name = '';
  @Input() hexColor = '#888';
  @Input() isGoalkeeper = false;
}
