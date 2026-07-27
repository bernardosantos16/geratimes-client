import { Component, Input, Output, EventEmitter, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerUiModel } from '@core/models/team-ui.model';
import { SquareRatingComponent } from '../square-rating/square-rating.component';
import {dragSwapState} from "@shared/components/team-card/drag-state";

@Component({
    selector: 'app-player-item',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, SquareRatingComponent],
    templateUrl: 'player-item.component.html',
    styleUrls: ['player-item.component.scss']
})
export class PlayerItemComponent {
    @Input({ required: true }) player!: PlayerUiModel;
    @Input() draggable = false;
    @Input() showRating = true;
    @Output() swapRequested = new EventEmitter<{ from: PlayerUiModel; to: PlayerUiModel }>();

    isDragOver = computed(() => {
        const source = dragSwapState.source();
        const target = dragSwapState.target();
        // Fica em destaque apenas se o jogador arrastado for de outro time e da mesma posição (opcional)
        return target?.id === this.player.id && source && source.teamId !== this.player.teamId;
    });

    onDragStart(event: DragEvent): void {
        if (!this.draggable) return;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
        dragSwapState.source.set(this.player);
    }

    onDragOver(event: DragEvent): void {
        if (!this.draggable) return;
        event.preventDefault(); // Necessário para permitir o Drop

        const source = dragSwapState.source();
        if (source && source.id !== this.player.id && source.teamId !== this.player.teamId) {
            dragSwapState.target.set(this.player);
        }
    }

    onDragLeave(event: DragEvent): void {
        if (!this.draggable) return;
        if (dragSwapState.target()?.id === this.player.id) {
            dragSwapState.target.set(null);
        }
    }

    onDrop(event: DragEvent): void {
        if (!this.draggable) return;
        event.preventDefault();
        event.stopPropagation();

        const source = dragSwapState.source();

        if (source && source.id !== this.player.id && source.teamId !== this.player.teamId) {
            // Emite o evento de troca para o componente Pai
            this.swapRequested.emit({ from: source, to: this.player });
        }

        this.clearState();
    }

    onDragEnd(): void {
        this.clearState();
    }

    private clearState(): void {
        dragSwapState.source.set(null);
        dragSwapState.target.set(null);
    }
}