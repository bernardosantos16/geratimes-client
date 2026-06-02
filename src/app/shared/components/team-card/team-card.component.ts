import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { PlayerItemComponent } from '../player-item/player-item.component';
import { TeamUiModel, PlayerUiModel } from '@core/models/team-ui.model';

@Component({
    selector: 'app-team-card',
    standalone: true,
    imports: [CommonModule, CdkDropList, PlayerItemComponent],
    template: `
    <article class="team-card" [style.--team-color]="team.jerseyColor">
      <header class="team-header">
        <span class="team-dot"></span>
        <div class="team-title">
          <span class="team-label">{{ team.jerseyName }}</span>
          <span class="team-meta">{{ playerCount() }} jogadores</span>
        </div>
        <span class="pts">{{ getTeamRatingSum() }}pts</span>
      </header>

      <div
        class="players-list"
        cdkDropList
        [id]="dropListId"
        [cdkDropListData]="allPlayers()"
        [cdkDropListConnectedTo]="connectedDropLists"
        [cdkDropListDisabled]="!enableSwap"
        (cdkDropListDropped)="handleDrop($event)">
        @for (player of allPlayers(); track player.id) {
          <app-player-item [player]="player" [draggable]="enableSwap" />
        } @empty {
          <p class="empty">Nenhum jogador</p>
        }
      </div>
    </article>
  `,
    styles: [`
    :host {
        --team-color: var(--border);
        display: block;
    }
    .team-card {
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-top: 3px solid var(--team-color, var(--border));
        border-radius: 10px;
        overflow: hidden;
        min-height: 100%;
        transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    .team-card:hover {
        border-color: color-mix(in srgb, var(--team-color, var(--accent)) 70%, var(--border));
        box-shadow: 0 0 22px color-mix(in srgb, var(--team-color, transparent) 22%, transparent);
    }
    .team-header {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.9rem 1rem;
        background: color-mix(in srgb, var(--team-color, var(--surface2)) 12%, var(--card-bg));
        border-bottom: 1px solid var(--border);
    }
    .team-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--team-color);
        flex-shrink: 0;
        box-shadow: 0 0 14px color-mix(in srgb, var(--team-color) 50%, transparent);
    }
    .team-title { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
    .team-label {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 1.35rem;
        line-height: 1;
        color: var(--text);
        letter-spacing: 0.06em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: uppercase;
    }
    .team-meta {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--text3);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .pts {
        background: var(--accent-dim);
        color: var(--accent);
        padding: 0.22rem 0.62rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.78rem;
        white-space: nowrap;
    }
    .players-list {
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-height: 132px;
        transition: background 0.2s, border 0.2s, box-shadow 0.2s;
    }
    .players-list.cdk-drop-list-dragging {
        background: color-mix(in srgb, var(--team-color) 8%, transparent);
    }
    .players-list.cdk-drop-list-dragging app-player-item:not(.cdk-drag-placeholder) {
        transition: transform 180ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drag-placeholder {
        opacity: 0.25;
    }
    .empty { text-align: center; color: var(--text3); font-size: 0.8rem; padding: 1.5rem; }
  `]
})
export class TeamCardComponent {
    @Input({ required: true }) team!: TeamUiModel;
    @Input() enableSwap = false;
    @Input() dropListId = '';
    @Input() connectedDropLists: string[] = [];
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

    handleDrop(event: CdkDragDrop<PlayerUiModel[], PlayerUiModel[], PlayerUiModel>): void {
        if (!this.enableSwap || event.previousContainer === event.container) {
            return;
        }

        const source = event.item.data;
        const targetPlayers = event.container.data ?? [];
        const targetAtIndex = targetPlayers[event.currentIndex];
        const target = targetAtIndex?.position === source.position
            ? targetAtIndex
            : targetPlayers.find((player) => player.position === source.position && player.id !== source.id);

        if (!target || target.id === source.id || target.teamId === source.teamId) {
            return;
        }

        this.swapRequested.emit({ from: source, to: target });
    }
}
