import {ChangeDetectionStrategy, Component, computed, inject, DestroyRef, OnInit, signal, ElementRef, viewChild} from '@angular/core';
import { DeviceService } from '@core/services/device.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatchesService} from '@core/services/matches.service';
import {ClubsService} from '@core/services/clubs.service';
import {ToastService} from '@core/services/toast.service';
import {
    ClubJerseyResponseDTO,
    ClubMemberResponseDTO,
    ClubResponseDTO,
    GenerateTeamsResponseDTO,
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
import {forkJoin, switchMap} from 'rxjs';
import {TeamsService} from "@core/services/teams.service";
import { fallbackTeamColor } from '@core/utils/team-color.utils';
import { MatchResultFormComponent } from './match-result-form/match-result-form.component';

@Component({
    selector: 'app-match-detail-export',
    standalone: true,
    imports: [
        CommonModule, RouterModule,
        PageHeaderComponent, LoadingSpinnerComponent, ConfirmDialogComponent,
        TeamCardComponent, MatchDatePipe, MatchResultFormComponent,
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
    private readonly deviceService = inject(DeviceService);

    readonly loading = signal(true);
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

    readonly teamsSection = viewChild<ElementRef>('teamsSection');

    readonly clubName = computed(() => this.club()?.name ?? '');
    readonly isUpcoming = computed(() => this.match() ? new Date(this.match()!.dateTime) > new Date() : false);
    readonly hasResult = computed(() => {
        const match = this.match();
        return !!match?.teamChampionId && !!match?.clubMemberMvpId;
    });
    readonly swapHint = computed(() =>
        this.deviceService.isTouchDevice()
            ? 'Toque em um jogador para selecioná-lo e depois toque no destino para trocar.'
            : 'Arraste um jogador para outro time para trocar com alguém da mesma posição.'
    );
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
            score: null,
            jerseyName: jersey?.name ?? 'Goleiros',
            jerseyColor: jersey?.hexColor ?? fallbackTeamColor(this.teams().length),
            players: gks,
            goalkeeper: null,
        };
    });

    ngOnInit(): void {
        const matchId = this.activatedRoute.snapshot.paramMap.get('id')!;

        this.matchesService.getMatch(matchId).pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((match) => {
                this.match.set(match);
                this.championTeamId.set(match.teamChampionId ?? null);
                this.mvpMemberId.set(match.clubMemberMvpId ?? null);

                return forkJoin({
                    participants: this.matchesService.getParticipants(matchId),
                    teams: this.teamsService.getTeamsByMatch(matchId),
                    directorClubs: this.clubsService.getClubs('DIRECTOR'),
                    club: this.clubsService.getClubById(match.clubId),
                    members: this.clubsService.getMembers(match.clubId, { size: 200 }),
                    jerseys: this.clubsService.getJerseys(match.clubId),
                });
            }),
        ).subscribe({
            next: ({ participants, teams, directorClubs, club, members, jerseys }) => {
                this.participants.set(participants);
                this.teams.set(teams.content);
                this.canManageResult.set(directorClubs.some((club) => club.id === this.match()!.clubId));
                this.club.set(club);
                this.clubMembers.set(members.content);
                this.jerseys.set(jerseys);
                this.loading.set(false);

                const ids = new Set(participants.map((p) => p.clubMemberId));
                this.selectedIds.set(ids);
            },
            error: (err: unknown) => {
                this.toast.error('Erro ao carregar partida.');
                this.loading.set(false);
            },
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

    onChampionTeamChange(value: unknown): void {
        this.championTeamId.set(this.toNullableNumber(value));
    }

    onMvpMemberChange(value: unknown): void {
        this.mvpMemberId.set(this.toNullableNumber(value));
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
            next: (response: GenerateTeamsResponseDTO) => {
                this.participants.update((participants) =>
                    participants.map((p) => {
                        const team = response.teams.find((t) =>
                            t.lineMemberIds.includes(p.clubMemberId) || t.goalkeeperMemberId === p.clubMemberId
                        );
                        return team ? { ...p, teamId: team.teamId } : p;
                    })
                );
                this.teams.update((teams) =>
                    teams.map((team) => {
                        const generated = response.teams.find((t) => t.teamId === team.id);
                        return generated ? { ...team, score: generated.totalScore } : team;
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
            jerseyColor: jersey?.hexColor ?? fallbackTeamColor(index),
            players: linePlayers,
            score: team.score,
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

    private toNullableNumber(value: unknown): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    copyTeamsToClipboard(): void {
        const sections: string[] = [];

        for (const team of this.teamCards()) {
            const teamLines: string[] = [];
            teamLines.push(team.jerseyName.toUpperCase());
            teamLines.push('');
            if (team.goalkeeper) {
                teamLines.push(`${team.goalkeeper.name} 🧤`);
            }
            for (const player of team.players) {
                teamLines.push(player.name);
            }
            sections.push(teamLines.join('\n'));
        }

        const freeGks = this.freeGoalkeepersCard();
        if (freeGks) {
            const gkLines: string[] = [];
            gkLines.push('GOLEIROS');
            gkLines.push('');
            for (const player of freeGks.players) {
                gkLines.push(player.name);
            }
            sections.push(gkLines.join('\n'));
        }

        const text = sections.join('\n\n___\n\n');
        navigator.clipboard.writeText(text).then(() => {
            this.toast.success('Times copiados!');
        }).catch(() => {
            this.toast.error('Erro ao copiar.');
        });
    }

    deleteMatch(): void {
        const id = this.match()?.id;
        if (!id) return;
        this.matchesService.deleteMatch(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.toast.success('Partida excluída.');
                this.router.navigate(['/clubs', this.match()!.clubId, 'matches']).catch(() => {});
            },
            error: (err: unknown) => this.toast.error('Erro ao excluir partida.'),
        });
    }

}