import { signal } from '@angular/core';
import { PlayerUiModel } from '@core/models/team-ui.model';

export const dragSwapState = {
    source: signal<PlayerUiModel | null>(null),
    target: signal<PlayerUiModel | null>(null),
    selected: signal<PlayerUiModel | null>(null),
    justDragged: false,
};