import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerItemComponent } from '../player-item/player-item.component';
import { TeamUiModel, PlayerUiModel } from '@core/models/team-ui.model';

@Component({
    selector: 'app-team-card',
    standalone: true,
    imports: [CommonModule, PlayerItemComponent],
    templateUrl: 'team-card.component.html',
    styleUrls: ['team-card.component.scss']
})
export class TeamCardComponent {
    @Input({ required: true }) team!: TeamUiModel;
    @Input() enableSwap = false;
    @Output() swapRequested = new EventEmitter<{ from: PlayerUiModel; to: PlayerUiModel }>();

    allPlayers(): PlayerUiModel[] {
        const list = [...this.team.players];
        if (this.team.goalkeeper) list.push(this.team.goalkeeper);
        return list;
    }

    getTeamRatingSum(): number {
        return this.allPlayers().reduce((sum, p) => sum + p.rating, 0);
    }

    playerCount(): number {
        return this.allPlayers().length;
    }

    onPlayerSwap(event: { from: PlayerUiModel; to: PlayerUiModel }): void {
        this.swapRequested.emit(event);
    }
}