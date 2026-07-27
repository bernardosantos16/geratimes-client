import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamUiModel, PlayerUiModel } from '@core/models/team-ui.model';

@Component({
  selector: 'app-match-result-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'match-result-form.component.html',
  styleUrls: ['match-result-form.component.scss'],
})
export class MatchResultFormComponent {
  @Input({ required: true }) teams!: TeamUiModel[];
  @Input({ required: true }) mvpCandidates!: PlayerUiModel[];
  @Input() championTeamId: number | null = null;
  @Input() mvpMemberId: number | null = null;
  @Input() saving = false;
  @Input() hasResult = false;
  @Input() championName = '';
  @Input() mvpName = '';
  @Output() championChange = new EventEmitter<number | null>();
  @Output() mvpChange = new EventEmitter<number | null>();
  @Output() saveResult = new EventEmitter<void>();

  canSave(): boolean {
    return !this.saving && !!this.championTeamId && !!this.mvpMemberId;
  }
}
