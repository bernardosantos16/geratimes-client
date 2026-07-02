import {
  Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TeamsService } from '../../../core/services/teams.service';
import { MatchesService } from '../../../core/services/matches.service';
import { ClubsService } from '../../../core/services/clubs.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ClubMemberResponseDTO, ClubJerseyResponseDTO,
  GenerateTeamsResponseDTO, GeneratedTeamDTO,
} from '../../../core/models/api.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { JerseyBadgeComponent } from '../../../shared/components/jersey-badge/jersey-badge.component';
import { SquareRatingComponent } from '../../../shared/components/square-rating/square-rating.component';
import { TeamCardComponent } from '../../../shared/components/team-card/team-card.component';
import { PlayerUiModel, TeamUiModel } from '../../../core/models/team-ui.model';
import { forkJoin } from 'rxjs';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";

type Step = 'select-players' | 'configure' | 'result';

interface MemberWithRole extends ClubMemberResponseDTO {
  assignedAs: 'line' | 'goalkeeper' | null;
}

@Component({
  selector: 'app-generate-teams',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    PageHeaderComponent, LoadingSpinnerComponent,
    JerseyBadgeComponent, SquareRatingComponent, TeamCardComponent, SvgIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'generate-teams.component.html',
  styleUrls: ['generate-teams.component.scss'],
})
export class GenerateTeamsComponent implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly matchesService = inject(MatchesService);
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly generating = signal(false);
  readonly swapping = signal(false);
  readonly currentStep = signal<Step>('select-players');
  readonly members = signal<MemberWithRole[]>([]);
  readonly jerseys = signal<ClubJerseyResponseDTO[]>([]);
  readonly result = signal<GenerateTeamsResponseDTO | null>(null);

  matchId!: string;
  private membersMap = new Map<number, ClubMemberResponseDTO>();

  readonly configForm = this.fb.group({
    maxLinePlayers: [5, [Validators.required, Validators.min(1)]],
  });

  readonly lineCount = computed(() => this.members().filter((m) => m.assignedAs === 'line').length);
  readonly goalkeeperCount = computed(() => this.members().filter((m) => m.assignedAs === 'goalkeeper').length);
  readonly estimatedTeams = computed(() => {
    const perTeam = this.configForm.get('maxLinePlayers')?.value ?? 5;
    return perTeam > 0 ? Math.floor(this.lineCount() / perTeam) : 0;
  });
  readonly generatedTeamCards = computed<TeamUiModel[]>(() => {
    const response = this.result();
    if (!response) return [];

    return response.teams.map((team, index) => this.toTeamCardModel(team, index));
  });
  readonly generatedDropListIds = computed(() =>
    this.generatedTeamCards().map((team) => this.dropListId(team.id))
  );

  readonly stepLabels = [
    { key: 'select-players' as Step, label: 'Jogadores' },
    { key: 'configure'      as Step, label: 'Configurar' },
    { key: 'result'         as Step, label: 'Times' },
  ];

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('matchId')!;

    this.matchesService.getMatch(this.matchId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (match) => this.loadClubData(match.clubId),
      error: () => { this.toast.error('Partida não encontrada.'); this.router.navigate(['/matches']); },
    });
  }

  private loadClubData(clubId: string): void {
    forkJoin({
      members: this.clubsService.getMembers(clubId, { size: 200 }),
      jerseys: this.clubsService.getJerseys(clubId),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ members, jerseys }) => {
        const withRole: MemberWithRole[] = members.content.map((m) => ({ ...m, assignedAs: null}));
        this.members.set(withRole);
        this.jerseys.set(jerseys.filter((j) => !j.isGoalkeeperJersey));

        // Build lookup map
        members.content.forEach((m) => this.membersMap.set(m.id, m));
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar membros.');
        this.loading.set(false);
      },
    });
  }

  setPosition(member: MemberWithRole, pos: 'line' | 'goalkeeper' | null): void {
    this.members.update((arr) =>
      arr.map((m) => m.id === member.id ? { ...m, assignedAs: pos } : m)
    );
  }

  goToStep(step: Step): void {
    this.currentStep.set(step);
  }

  isStepDone(step: Step): boolean {
    const order: Step[] = ['select-players', 'configure', 'result'];
    return order.indexOf(step) < order.indexOf(this.currentStep());
  }

  generateTeams(): void {
    if (this.configForm.invalid) return;

    this.generating.set(true);

    const lineIds = this.members().filter((m) => m.assignedAs === 'line').map((m) => m.id);
    const gkIds   = this.members().filter((m) => m.assignedAs === 'goalkeeper').map((m) => m.id);
    const maxLine = this.configForm.get('maxLinePlayers')!.value!;

    this.teamsService.generateTeams({
      matchId: this.matchId,
      lineMemberIds: lineIds,
      goalkeeperMemberIds: gkIds,
      maxLinePlayers: maxLine,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.result.set(res);
        this.generating.set(false);
        this.currentStep.set('result');
        this.toast.success(`${res.teamCount} times gerados com sucesso!`);
      },
      error: (err) => {
        this.generating.set(false);
        this.toast.error(err.error?.detail ?? 'Erro ao gerar times.');
      },
    });
  }

  swapGeneratedPlayers(event: { from: PlayerUiModel; to: PlayerUiModel }): void {
    if (this.swapping() || event.from.position !== event.to.position) return;

    this.swapping.set(true);
    this.teamsService.swapPlayers({
      matchId: this.matchId,
      swaps: [{ memberIdFrom: event.from.id, memberIdTo: event.to.id }],
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.applyLocalSwap(event.from, event.to);
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
    return `generated-team-${teamId}`;
  }

  private applyLocalSwap(from: PlayerUiModel, to: PlayerUiModel): void {
    this.result.update((current) => {
      if (!current) return current;

      return {
        ...current,
        teams: current.teams.map((team) => {
          if (from.position === 'GOAL') {
            return {
              ...team,
              goalkeeperMemberId: team.goalkeeperMemberId === from.id
                ? to.id
                : team.goalkeeperMemberId === to.id ? from.id : team.goalkeeperMemberId,
            };
          }

          return {
            ...team,
            lineMemberIds: team.lineMemberIds.map((id) =>
              id === from.id ? to.id : id === to.id ? from.id : id
            ),
          };
        }),
      };
    });
  }

  private toTeamCardModel(team: GeneratedTeamDTO, index: number): TeamUiModel {
    const jersey = this.jerseys()[index];
    const teamName = jersey?.name ?? `Time ${index + 1}`;
    const teamColor = jersey?.hexColor ?? this.fallbackTeamColor(index);

    return {
      id: team.teamId,
      jerseyName: teamName,
      jerseyColor: teamColor,
      players: team.lineMemberIds.map((id) => this.toPlayerModel(id, 'LINE', team.teamId)),
      goalkeeper: team.goalkeeperMemberId
        ? this.toPlayerModel(team.goalkeeperMemberId, 'GOAL', team.teamId)
        : null,
    };
  }

  private toPlayerModel(memberId: number, position: 'LINE' | 'GOAL', teamId: number): PlayerUiModel {
    const member = this.membersMap.get(memberId);

    return {
      id: memberId,
      name: member?.name ?? `Jogador #${memberId}`,
      rating: member?.rating ?? 0,
      timesChampion: member?.timesChampion ?? 0,
      timesMvp: member?.timesMvp ?? 0,
      position,
      teamId,
      isGoalkeeper: position === 'GOAL',
    };
  }

  private fallbackTeamColor(index: number): string {
    const colors = ['#1565c0', '#555555', '#00a844', '#d63050', '#f39c12', '#7c4dff'];
    return colors[index % colors.length];
  }

  memberName(id: number): string {
    return this.membersMap.get(id)?.name ?? `Jogador #${id}`;
  }

  memberRating(id: number): number {
    return this.membersMap.get(id)?.rating ?? 0;
  }
}
