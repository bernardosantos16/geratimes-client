import {ChangeDetectionStrategy, Component, computed, inject, DestroyRef, OnInit, signal} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatchesService} from '@core/services/matches.service';
import {ClubsService} from '@core/services/clubs.service';
import {ToastService} from '@core/services/toast.service';
import {
    ClubJerseyResponseDTO,
    ClubMemberResponseDTO,
    ClubResponseDTO,
    MatchParticipantResponseDTO,
    MatchResponseDTO,
    TeamResponseDTO,
} from '@core/models/api.models';
import {PageHeaderComponent} from '@shared/components/page-header/page-header.component';
import {LoadingSpinnerComponent} from '@shared/components/loading-spinner/loading-spinner.component';
import {ConfirmDialogComponent} from '@shared/components/confirm-dialog/confirm-dialog.component';
import {TeamCardComponent} from '@shared/components/team-card/team-card.component';
import {MatchDatePipe} from '@shared/pipes/app.pipes';
import {PlayerUiModel, TeamUiModel} from '@core/models/team-ui.model';
import {forkJoin} from 'rxjs';
import {TeamsService} from "@core/services/teams.service";

@Component({
    selector: 'app-match-detail-export',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        PageHeaderComponent, LoadingSpinnerComponent, ConfirmDialogComponent,
        TeamCardComponent, MatchDatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'match-detail-export.component.html',
    styleUrls: ['match-detail-export.component.scss'],
})
export class MatchDetailComponent implements OnInit {
    private readonly matchesService = inject(MatchesService);
    private readonly teamsService = inject(TeamsService);
    private readonly clubsService = inject(ClubsService);
    private readonly toast = inject(ToastService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly loading = signal(true);
    readonly loadingMembers = signal(true);
    readonly swapping = signal(false);
    readonly match = signal<MatchResponseDTO | null>(null);
    readonly participants = signal<MatchParticipantResponseDTO[]>([]);
    readonly clubMembers = signal<ClubMemberResponseDTO[]>([]);
    readonly selectedIds = signal<Set<number>>(new Set());
    readonly teams = signal<TeamResponseDTO[]>([]);
    readonly jerseys = signal<ClubJerseyResponseDTO[]>([]);
    readonly canManageResult = signal(false);
    readonly savingResult = signal(false);
    readonly championTeamId = signal<number | null>(null);
    readonly mvpMemberId = signal<number | null>(null);
    private club = signal<ClubResponseDTO | null>(null);

    clubName = () => this.club()?.name ?? '';
    isUpcoming = () => this.match() ? new Date(this.match()!.dateTime) > new Date() : false;
    readonly hasResult = computed(() => {
        const match = this.match();
        return !!match?.teamChampionId && !!match?.clubMemberMvpId;
    });
    readonly championTeamName = computed(() => {
        const teamId = this.match()?.teamChampionId;
        if (!teamId) return '';
        return this.teamCards().find((team) => team.id === teamId)?.jerseyName ?? `Time #${teamId}`;
    });
    readonly mvpMemberName = computed(() => {
        const memberId = this.match()?.clubMemberMvpId;
        if (!memberId) return '';
        return this.getMemberName(memberId);
    });
    readonly teamCards = computed<TeamUiModel[]>(() =>
        this.teams().map((team, index) => this.toTeamCardModel(team, index))
    );
    readonly mvpCandidates = computed<PlayerUiModel[]>(() => {
        const seen = new Set<number>();
        return this.participants()
            .filter((participant) => {
                if (seen.has(participant.clubMemberId)) return false;
                seen.add(participant.clubMemberId);
                return true;
            })
            .map((participant) => this.toPlayerModel(participant, participant.teamId ?? null));
    });
    readonly teamDropListIds = computed(() => {
        const ids = this.teamCards().map((team) => this.dropListId(team.id));
        const free = this.freeGoalkeepersCard?.();
        if (free) ids.push(this.dropListId(free.id));
        return ids;
    });

    // Card that contains goalkeepers not assigned to any team
    readonly freeGoalkeepersCard = computed<TeamUiModel | null>(() => {
        const gks = this.participants()
            .filter((p) => p.position === 'GOAL' && (p.teamId === null || p.teamId === undefined))
            .map((p) => this.toPlayerModel(p, null));

        if (gks.length === 0) return null;

        const jersey = this.jerseys().find((j) => j.isGoalkeeperJersey);

        return {
            id: 0,
            jerseyName: jersey?.name ?? 'Goleiros',
            jerseyColor: jersey?.hexColor ?? this.fallbackTeamColor(this.teams().length),
            players: gks,
            goalkeeper: null,
        };
    });

    ngOnInit(): void {
        const matchId = this.activatedRoute.snapshot.paramMap.get('id')!;

        forkJoin({
            match: this.matchesService.getMatch(matchId),
            participants: this.matchesService.getParticipants(matchId),
            teams: this.teamsService.getTeamsByMatch(matchId),
            directorClubs: this.clubsService.getClubs('DIRECTOR'),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: ({ match, participants, teams, directorClubs }) => {
                this.match.set(match);
                this.participants.set(participants);
                this.teams.set(teams.content);
                this.canManageResult.set(directorClubs.some((club) => club.id === match.clubId));
                this.championTeamId.set(match.teamChampionId ?? null);
                this.mvpMemberId.set(match.clubMemberMvpId ?? null);
                this.loading.set(false);
                this.loadClubData(match.clubId);

                // Pre-select participants already in match
                const ids = new Set(participants.map((p) => p.clubMemberId));
                this.selectedIds.set(ids);
            },
            error: () => {
                this.toast.error('Erro ao carregar partida.');
                this.loading.set(false);
            },
        });
    }

    private loadClubData(clubId: string): void {
        forkJoin({
            club: this.clubsService.getClubById(clubId),
            members: this.clubsService.getMembers(clubId, { size: 200 }),
            jerseys: this.clubsService.getJerseys(clubId),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: ({ club, members, jerseys }) => {
                this.club.set(club);
                this.clubMembers.set(members.content);
                this.jerseys.set(jerseys);
                this.loadingMembers.set(false);
            },
            error: () => this.loadingMembers.set(false),
        });
    }

    isSelected(memberId: number): boolean {
        return this.selectedIds().has(memberId);
    }

    getPosition(memberId: number): 'LINE' | 'GOAL' | null {
        const p = this.participants().find((x) => x.clubMemberId === memberId);
        return p?.position ?? null;
    }

    toggleMember(member: ClubMemberResponseDTO): void {
        this.selectedIds.update((set) => {
            const next = new Set(set);
            if (next.has(member.id)) { next.delete(member.id); }
            else { next.add(member.id); }
            return next;
        });
    }

    selectAll(): void {
        this.selectedIds.set(new Set(this.clubMembers().map((m) => m.id)));
    }

    clearAll(): void {
        this.selectedIds.set(new Set());
    }

    getTeamPlayers(teamId: number): MatchParticipantResponseDTO[] {
        return this.participants().filter(p => p.teamId === teamId);
    }

    getMemberName(memberId: number): string {
        return this.clubMembers().find(m => m.id === memberId)?.name ?? 'Unknown';
    }

    getJerseyName(jerseyId: number): string {
        return this.jerseys().find(j => j.id === jerseyId)?.name ?? 'Unknown Jersey';
    }

    setChampionTeamId(value: unknown): void {
        this.championTeamId.set(this.toNullableNumber(value));
    }

    setMvpMemberId(value: unknown): void {
        this.mvpMemberId.set(this.toNullableNumber(value));
    }

    canSaveResult(): boolean {
        return !this.savingResult()
            && !this.isUpcoming()
            && !!this.championTeamId()
            && !!this.mvpMemberId();
    }

    saveResult(): void {
        const match = this.match();
        const teamChampionId = this.championTeamId();
        const clubMemberMvpId = this.mvpMemberId();

        if (!match || !teamChampionId || !clubMemberMvpId || this.savingResult()) {
            return;
        }

        this.savingResult.set(true);
        this.matchesService.setResult(match.id, { teamChampionId, clubMemberMvpId }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (updatedMatch) => {
                this.match.set(updatedMatch);
                this.championTeamId.set(updatedMatch.teamChampionId ?? teamChampionId);
                this.mvpMemberId.set(updatedMatch.clubMemberMvpId ?? clubMemberMvpId);
                this.savingResult.set(false);
                this.loadClubData(updatedMatch.clubId);
                this.toast.success('Resultado salvo.');
            },
            error: (err) => {
                this.savingResult.set(false);
                this.toast.error(err.error?.detail ?? 'Erro ao salvar resultado.');
            },
        });
    }

    swapMatchPlayers(event: { from: PlayerUiModel; to: PlayerUiModel }): void {
        const matchId = this.match()?.id;
        if (!matchId || this.swapping() || event.from.position !== event.to.position) return;

        this.swapping.set(true);
        this.teamsService.swapPlayers({
            matchId,
            swaps: [{ memberIdFrom: event.from.id, memberIdTo: event.to.id }],
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.participants.update((participants) =>
                    participants.map((participant) => {
                        if (participant.clubMemberId === event.from.id) {
                            return { ...participant, teamId: event.to.teamId ?? undefined };
                        }
                        if (participant.clubMemberId === event.to.id) {
                            return { ...participant, teamId: event.from.teamId ?? undefined };
                        }
                        return participant;
                    })
                );
                this.swapping.set(false);
                this.toast.success('Jogadores trocados.');
            },
            error: (err) => {
                this.swapping.set(false);
                this.toast.error(err.error?.detail ?? 'Erro ao trocar jogadores.');
            },
        });
    }

    dropListId(teamId: number): string {
        return `match-team-${teamId}`;
    }

    private toTeamCardModel(team: TeamResponseDTO, index: number): TeamUiModel {
        const jersey = this.resolveJersey(team.clubJerseyId, index);
        const teamParticipants = this.participants().filter((participant) => participant.teamId === team.id);
        const linePlayers = teamParticipants
            .filter((participant) => participant.position === 'LINE')
            .map((participant) => this.toPlayerModel(participant, team.id));
        const goalkeeper = teamParticipants.find((participant) => participant.position === 'GOAL');

        return {
            id: team.id,
            jerseyName: jersey?.name ?? `Time ${index + 1}`,
            jerseyColor: jersey?.hexColor ?? this.fallbackTeamColor(index),
            players: linePlayers,
            goalkeeper: goalkeeper ? this.toPlayerModel(goalkeeper, team.id) : null,
        };
    }

    private toPlayerModel(participant: MatchParticipantResponseDTO, teamId: number | null): PlayerUiModel {
        const member = this.clubMembers().find((item) => item.id === participant.clubMemberId);

        return {
            id: participant.clubMemberId,
            name: member?.name ?? `Jogador #${participant.clubMemberId}`,
            rating: member?.rating ?? 0,
            timesChampion: member?.timesChampion ?? 0,
            timesMvp: member?.timesMvp ?? 0,
            position: participant.position,
            teamId,
            isGoalkeeper: participant.position === 'GOAL',
        };
    }

    private resolveJersey(jerseyId: number | null | undefined, index: number): ClubJerseyResponseDTO | undefined {
        return this.jerseys().find((jersey) => jersey.id === jerseyId) ?? this.jerseys().filter((j) => !j.isGoalkeeperJersey)[index];
    }

    private fallbackTeamColor(index: number): string {
        const colors = ['#1565c0', '#555555', '#00a844', '#d63050', '#f39c12', '#7c4dff'];
        return colors[index % colors.length];
    }

    private toNullableNumber(value: unknown): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    deleteMatch(): void {
        const id = this.match()?.id;
        if (!id) return;
        this.matchesService.deleteMatch(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.toast.success('Partida excluída.');
                this.router.navigate(['/clubs', this.match()!.clubId, 'matches']);
            },
            error: () => this.toast.error('Erro ao excluir partida.'),
        });
    }

}