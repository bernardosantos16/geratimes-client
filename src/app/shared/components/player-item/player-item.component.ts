import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { PlayerUiModel } from '@core/models/team-ui.model';
import { SquareRatingComponent } from '../square-rating/square-rating.component';

@Component({
    selector: 'app-player-item',
    standalone: true,
    imports: [CommonModule, CdkDrag, SquareRatingComponent],
    template: `
      <div
            class="player-row"
            [class.goalkeeper]="player.isGoalkeeper"
            [class.not-draggable]="!draggable"
            cdkDrag
            [cdkDragData]="player"
            [cdkDragDisabled]="!draggable">

        @if (draggable) {
            <span class="drag-handle" aria-hidden="true">⠿</span>
        }

        <span class="player-name">
            {{ player.name }}@if (player.isGoalkeeper && !player.name.includes('GK')) { <span class="gk-label"> (GK)</span> }
        </span>

        <app-square-rating [value]="player.rating" />
    </div>
    `,
    styles: [`
    .player-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.3rem;
        padding: 0.3rem 0.4rem;
        font-size: 0.78rem;
        color: var(--text2);
        border: 1px solid transparent;
        border-bottom-color: var(--border);
        border-radius: 6px;
        cursor: grab;
        transition: background 0.15s, transform 0.15s, box-shadow 0.15s, opacity 0.15s, color 0.15s, border-color 0.15s;
        user-select: none;
        position: relative;
        min-height: 29px;
    }
    .player-row:hover {
        background: var(--accent-dim);
        color: var(--text);
    }
    .player-row.not-draggable { cursor: default; }
    .player-row.goalkeeper { color: var(--blue); }
    .drag-handle {
        color: var(--text3);
        font-size: 0.65rem;
        line-height: 1;
        margin-right: 0.3rem;
        cursor: grab;
        opacity: 0.5;
        transition: opacity 0.15s, color 0.15s;
        flex-shrink: 0;
    }
    .player-row:hover .drag-handle { opacity: 1; color: var(--accent); }
    .player-name {
        flex: 1;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.1rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .gk-label { color: var(--text3); }
    app-square-rating { flex-shrink: 0; }
    .cdk-drag-preview {
        box-shadow: var(--shadow-md);
        border-color: var(--accent);
    }
    `]
})
export class PlayerItemComponent {
    @Input({ required: true }) player!: PlayerUiModel;
    @Input() draggable = false;
}
