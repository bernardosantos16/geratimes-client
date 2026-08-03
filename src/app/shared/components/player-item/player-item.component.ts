import { Component, Input, Output, EventEmitter, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerUiModel } from '@core/models/team-ui.model';
import { SquareRatingComponent } from '../square-rating/square-rating.component';
import { dragSwapState } from '@shared/components/team-card/drag-state';
import { DeviceService } from '@core/services/device.service';

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

    readonly deviceService = inject(DeviceService);

    readonly ariaLabel = computed(() => {
        return this.deviceService.isTouchDevice()
            ? `Toque para selecionar ${this.player.name}`
            : `Arraste ${this.player.name} para trocar`;
    });

    isDragOver = computed(() => {
        const source = dragSwapState.source();
        const target = dragSwapState.target();
        return target?.id === this.player.id && !!source && source.teamId !== this.player.teamId;
    });

    isSelected = computed(() => {
        return dragSwapState.selected()?.id === this.player.id;
    });

    onDragStart(event: DragEvent): void {
        if (!this.draggable) return;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
        dragSwapState.source.set(this.player);
        dragSwapState.justDragged = true;
    }

    onDragOver(event: DragEvent): void {
        if (!this.draggable) return;
        event.preventDefault();

        const source = dragSwapState.source();
        if (source && source.id !== this.player.id && source.teamId !== this.player.teamId) {
            dragSwapState.target.set(this.player);
        }
    }

    onDragLeave(_event: DragEvent): void {
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
            this.swapRequested.emit({ from: source, to: this.player });
        }

        this.clearState();
    }

    onDragEnd(): void {
        this.clearState();
    }

    onTapSelect(event: MouseEvent): void {
        if (!this.draggable || dragSwapState.justDragged) return;
        event.stopPropagation();

        const selected = dragSwapState.selected();

        if (!selected) {
            dragSwapState.selected.set(this.player);
            return;
        }

        if (selected.id === this.player.id) {
            dragSwapState.selected.set(null);
            return;
        }

        if (selected.teamId !== this.player.teamId) {
            this.swapRequested.emit({ from: selected, to: this.player });
        }

        dragSwapState.selected.set(null);
    }

    private clearState(): void {
        dragSwapState.source.set(null);
        dragSwapState.target.set(null);
        dragSwapState.selected.set(null);
        setTimeout(() => { dragSwapState.justDragged = false; }, 0);
    }
}