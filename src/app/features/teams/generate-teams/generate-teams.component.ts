import {
  Component, inject, signal, OnInit, computed, ChangeDetectionStrategy
} from '@angular/core';
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
    JerseyBadgeComponent, SquareRatingComponent, TeamCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Gerar Times"
      eyebrow="Sortear"
      subtitle="Distribua os jogadores em times equilibrados."
      [backLink]="'/matches/' + matchId" />

    @if (loading()) {
      <app-loading-spinner label="Carregando dados..." />
    } @else {
      <!-- Step indicator -->
      <div class="steps">
        @for (s of stepLabels; track $index) {
          <div class="step" [class.active]="currentStep() === s.key" [class.done]="isStepDone(s.key)">
            <span class="step-num">{{ isStepDone(s.key) ? '✓' : ($index + 1) }}</span>
            <span class="step-label">{{ s.label }}</span>
          </div>
          @if ($index < stepLabels.length - 1) {
            <div class="step-connector" [class.done]="isStepDone(s.key)"></div>
          }
        }
      </div>

      <!-- ── Step 1: Select players ── -->
      @if (currentStep() === 'select-players') {
        <div class="step-card">
          <div class="step-header">
            <h2>Selecionar jogadores</h2>
            <p>Escolha quem vai jogar e defina a posição de cada um.</p>
          </div>

          <div class="player-list">
            @for (member of members(); track member.id) {
              <div class="player-row" [class.selected]="member.assignedAs !== null">
                <div class="player-info">
                  <div class="player-avatar">{{ member.name[0].toUpperCase() }}</div>
                  <div class="player-details">
                    <span class="player-name">{{ member.name }}</span>
                    <app-square-rating [value]="member.rating ?? 0" />
                  </div>
                </div>
                <div class="position-toggle">
                  <button
                    class="pos-btn"
                    [class.active]="member.assignedAs === 'line'"
                    (click)="setPosition(member, 'line')">
                    🏃 Linha
                  </button>
                  <button
                    class="pos-btn gk"
                    [class.active]="member.assignedAs === 'goalkeeper'"
                    (click)="setPosition(member, 'goalkeeper')">
                    🥅 Goleiro
                  </button>
                  <button
                    class="pos-btn off"
                    [class.active]="member.assignedAs === null"
                    (click)="setPosition(member, null)">
                    ✕
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="step-summary">
            <span>🏃 Linha: <strong>{{ lineCount() }}</strong></span>
            <span>🥅 Goleiros: <strong>{{ goalkeeperCount() }}</strong></span>
          </div>

          <div class="step-actions">
            <button class="btn-primary" (click)="goToStep('configure')" [disabled]="lineCount() < 2">
              Próximo →
            </button>
          </div>
        </div>
      }

      <!-- ── Step 2: Configure ── -->
      @if (currentStep() === 'configure') {
        <div class="step-card">
          <div class="step-header">
            <h2>Configurar times</h2>
            <p>Defina quantos jogadores por time e atribua as camisas.</p>
          </div>

          <form [formGroup]="configForm" class="config-form">
            <div class="form-group">
              <label>Jogadores de linha por time *</label>
              <input type="number" formControlName="maxLinePlayers" min="1" max="20" class="form-input-sm" />
              @if (configForm.get('maxLinePlayers')?.invalid && configForm.get('maxLinePlayers')?.touched) {
                <span class="form-error">Mínimo 1 jogador</span>
              }
            </div>

            <div class="teams-preview">
              <div class="preview-info">
                Serão formados aproximadamente
                <strong class="accent">{{ estimatedTeams() }}</strong> times
                com <strong class="accent">{{ configForm.get('maxLinePlayers')?.value }}</strong> jogadores cada.
              </div>
            </div>

            @if (jerseys().length > 0) {
              <div class="jerseys-section">
                <h3>Camisas disponíveis</h3>
                <div class="jerseys-list">
                  @for (jersey of jerseys(); track jersey.id) {
                    <app-jersey-badge
                      [name]="jersey.name"
                      [hexColor]="jersey.hexColor"
                      [isGoalkeeper]="jersey.isGoalkeeperJersey" />
                  }
                </div>
              </div>
            }
          </form>

          <div class="step-actions">
            <button class="btn-back" (click)="goToStep('select-players')">← Voltar</button>
            <button class="btn-primary" (click)="generateTeams()" [disabled]="generating() || configForm.invalid">
              @if (generating()) { <span class="spinner"></span> }
              {{ generating() ? 'Gerando...' : '⚽ Gerar Times' }}
            </button>
          </div>
        </div>
      }

      <!-- ── Step 3: Result ── -->
      @if (currentStep() === 'result' && result()) {
        <div class="result-section">
          <div class="result-header">
            <div class="result-badge">
              <span class="result-count">{{ result()!.teamCount }}</span>
              <span class="result-label">Times gerados!</span>
            </div>
            <button class="btn-outline" (click)="goToStep('configure')">Regerar</button>
          </div>

          <p class="swap-note">Arraste um jogador para outro time para trocar com alguém da mesma posição.</p>

          <div class="teams-grid">
            @for (team of generatedTeamCards(); track team.id) {
              <app-team-card
                [team]="team"
                [enableSwap]="!swapping()"
                [dropListId]="dropListId(team.id)"
                [connectedDropLists]="generatedDropListIds()"
                (swapRequested)="swapGeneratedPlayers($event)" />
            }
          </div>

          @if (result()!.unassignedGoalkeeperMemberIds.length > 0) {
            <div class="unassigned-section">
              <h3>⚠️ Goleiros sem time</h3>
              <div class="unassigned-list">
                @for (id of result()!.unassignedGoalkeeperMemberIds; track id) {
                  <span class="unassigned-chip">{{ memberName(id) }}</span>
                }
              </div>
            </div>
          }

          <div class="result-actions">
            <a [routerLink]="['/matches', matchId]" class="btn-outline">← Voltar para partida</a>
            <button class="btn-primary" (click)="goToStep('configure')">Regerar times</button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    /* Steps */
    .steps {
      display: flex; align-items: center; gap: 0; margin-bottom: 2rem;
    }

    .step {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0;

      .step-num {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 700;
        background: var(--surface2); color: var(--text3); border: 1px solid var(--border);
        transition: all 0.2s;
      }

      .step-label { font-size: 0.82rem; color: var(--text3); font-weight: 500; transition: color 0.2s; }

      &.active {
        .step-num { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
        .step-label { color: var(--text); }
      }

      &.done {
        .step-num { background: var(--accent); color: #050f09; border-color: var(--accent); }
        .step-label { color: var(--text2); }
      }
    }

    .step-connector {
      flex: 1; height: 1px; background: var(--border); margin: 0 0.5rem;
      &.done { background: var(--accent); }
    }

    /* Step card */
    .step-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
    }

    .step-header {
      h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 0.3rem; }
      p  { font-size: 0.88rem; color: var(--text2); }
    }

    /* Player list */
    .player-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .player-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid var(--border); background: var(--card-bg);
      gap: 1rem; flex-wrap: wrap;
      transition: border-color 0.15s;
      &.selected { border-color: var(--border-strong); }
    }

    .player-info { display: flex; align-items: center; gap: 0.6rem; }

    .player-avatar {
      width: 36px; height: 36px; border-radius: 8px;
      background: var(--surface2); color: var(--text2);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
    }

    .player-details { display: flex; flex-direction: column; gap: 0.2rem; }
    .player-name { font-size: 0.88rem; font-weight: 600; color: var(--text); }

    .position-toggle { display: flex; gap: 0.35rem; }

    .pos-btn {
      padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border); background: var(--surface2);
      color: var(--text3); transition: all 0.15s;

      &:hover { border-color: var(--border-strong); color: var(--text); }
      &.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
      &.gk.active { border-color: var(--blue); background: var(--blue-dim); color: var(--blue); }
      &.off.active { border-color: var(--red); background: var(--red-dim); color: var(--red); }
    }

    .step-summary {
      display: flex; gap: 1.5rem; font-size: 0.88rem; color: var(--text2);
      padding: 0.75rem 1rem; background: var(--card-bg); border-radius: 8px;
      border: 1px solid var(--border);
      strong { color: var(--accent); }
    }

    /* Config form */
    .config-form { display: flex; flex-direction: column; gap: 1.25rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.35rem;
      label { font-size: 0.82rem; font-weight: 500; color: var(--text2); } }

    .form-input-sm {
      width: 120px; background: var(--input-bg); border: 1px solid var(--input-border);
      border-radius: 8px; color: var(--text); font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem; padding: 0.55rem 0.85rem; outline: none;
      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
    }

    .form-error { font-size: 0.75rem; color: var(--red); }

    .teams-preview {
      background: var(--accent-dim); border: 1px solid rgba(77,255,143,0.3);
      border-radius: 10px; padding: 1rem;
    }

    .preview-info { font-size: 0.88rem; color: var(--text2); line-height: 1.6; }
    .accent { color: var(--accent); }

    .jerseys-section { display: flex; flex-direction: column; gap: 0.6rem;
      h3 { font-size: 0.85rem; font-weight: 600; color: var(--text2); } }

    .jerseys-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    /* Actions */
    .step-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: var(--accent); color: #050f09; border: none;
      padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: 700;
      font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
      &:hover:not(:disabled) { filter: brightness(1.1); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-back, .btn-outline {
      background: none; border: 1px solid var(--border); color: var(--text2);
      padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.88rem;
      font-weight: 500; cursor: pointer; text-decoration: none;
      transition: all 0.2s; display: inline-flex;
      &:hover { border-color: var(--text3); color: var(--text); }
    }

    .spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #050f09; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Results */
    .result-section { display: flex; flex-direction: column; gap: 1.5rem; }

    .result-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }

    .result-badge {
      display: flex; align-items: baseline; gap: 0.5rem;
    }

    .result-count {
      font-family: 'Bebas Neue', sans-serif; font-size: 3rem;
      color: var(--accent); letter-spacing: 0.04em; line-height: 1;
    }

    .result-label { font-size: 1.1rem; font-weight: 700; color: var(--text); }

    .swap-note {
      font-size: 0.82rem; color: var(--text3); text-align: center;
      margin: -0.35rem 0 0.15rem;
    }

    .teams-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;
    }

    /* Unassigned */
    .unassigned-section {
      background: var(--yellow-dim); border: 1px solid var(--yellow);
      border-radius: 10px; padding: 1rem;
      h3 { font-size: 0.88rem; font-weight: 600; color: var(--yellow); margin-bottom: 0.5rem; }
    }

    .unassigned-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    .unassigned-chip {
      background: var(--surface2); border: 1px solid var(--border);
      padding: 3px 10px; border-radius: 100px; font-size: 0.8rem; color: var(--text2);
    }

    .result-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end; }
  `],
})
export class GenerateTeamsComponent implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly matchesService = inject(MatchesService);
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

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

    this.matchesService.getMatch(this.matchId).subscribe({
      next: (match) => this.loadClubData(match.clubId),
      error: () => { this.toast.error('Partida não encontrada.'); this.router.navigate(['/matches']); },
    });
  }

  private loadClubData(clubId: string): void {
    forkJoin({
      members: this.clubsService.getMembers(clubId, { size: 200 }),
      jerseys: this.clubsService.getJerseys(clubId),
    }).subscribe({
      next: ({ members, jerseys }) => {
        const withRole: MemberWithRole[] = members.content.map((m) => ({ ...m, assignedAs: 'line' as const }));
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
    }).subscribe({
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
    }).subscribe({
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
