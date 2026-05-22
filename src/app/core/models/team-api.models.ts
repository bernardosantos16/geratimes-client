// src/app/features/teams/models/team-api.models.ts
export interface GenerateTeamsRequestDTO {
    matchId: string;
    lineMemberIds: number[];
    goalkeeperMemberIds: number[];
    maxLinePlayers: number;
}

export interface GeneratedTeamDTO {
    teamId: number;
    lineMemberIds: number[];
    goalkeeperMemberId: number | null;
}

export interface GenerateTeamsResponseDTO {
    matchId: string;
    teamCount: number;
    generatedTeams: GeneratedTeamDTO[];
    unassignedGoalkeeperMemberIds: number[];
}

export interface PlayerSwapDTO {
    memberIdFrom: number;
    memberIdTo: number;
}

export interface SwapPlayersRequestDTO {
    matchId: string;
    swaps: PlayerSwapDTO[];
}