// src/app/features/teams/models/team-ui.models.ts
export interface PlayerUiModel {
    id: number;
    name: string;
    rating: number;           // 1-5
    timesChampion: number;
    timesMvp: number;
    position: 'LINE' | 'GOAL';
    teamId?: number | null;
    isGoalkeeper: boolean;
}

export interface TeamUiModel {
    id: number;
    jerseyName: string;
    jerseyColor: string;
    players: PlayerUiModel[];
    goalkeeper: PlayerUiModel | null;
}

export interface UiBalance {
    teamA: number;   // soma de ratings (apenas UI)
    teamB: number;
    difference: number;
    isBalanced: boolean;
}