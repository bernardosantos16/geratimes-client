import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
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
  selector: 'app-match-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    PageHeaderComponent, LoadingSpinnerComponent, ConfirmDialogComponent,
    TeamCardComponent, MatchDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-spinner label="Carregando partida..." />
    } @else if (match()) {
      <app-page-header
        [title]="match()!.dateTime | matchDate:'long'"
        eyebrow="Partida"
        [subtitle]="clubName()"
        backLink="/clubs/{{ match()!.clubId }}">
        <a [routerLink]="['/matches', match()!.id, 'generate']" class="btn-primary">
          ⚽ Gerar Times
        </a>
        <button class="btn-danger" (click)="confirmDel.open()">🗑️ Excluir</button>
      </app-page-header>

      <!-- Info cards -->
      <div class="info-row">
        <div class="info-card">
          <span class="info-label">Data</span>
          <span class="info-val">{{ match()!.dateTime | matchDate:'short' }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Hora</span>
          <span class="info-val">{{ match()!.dateTime | matchDate:'time' }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Participantes</span>
          <span class="info-val">{{ participants().length }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Status</span>
          <span class="info-val status" [class.upcoming]="isUpcoming()">
            {{ isUpcoming() ? '📅 Agendada' : '✓ Realizada' }}
          </span>
        </div>
      </div>

      @if (!isUpcoming()) {
        <div class="section-card result-card">
          <div class="section-head result-head">
            <div>
              <h2>Resultado da Partida</h2>
              <p class="section-hint">Defina o time campeão e o MVP entre os participantes.</p>
            </div>
            @if (hasResult()) {
              <span class="result-badge">Definido</span>
            } @else {
              <span class="result-badge pending">Pendente</span>
            }
          </div>

          @if (teams().length === 0) {
            <div class="empty-msg">Gere os times antes de definir o resultado.</div>
          } @else {
            @if (hasResult()) {
              <div class="result-summary">
                <div class="result-item">
                  <span class="result-label">Campeão</span>
                  <span class="result-value">{{ championTeamName() }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">MVP</span>
                  <span class="result-value">{{ mvpMemberName() }}</span>
                </div>
              </div>
            }

            @if (canManageResult()) {
              <div class="result-form">
                <label class="form-field">
                  <span>Time campeão</span>
                  <select
                    class="form-select"
                    name="teamChampionId"
                    [ngModel]="championTeamId()"
                    (ngModelChange)="setChampionTeamId($event)"
                    [disabled]="savingResult()">
                    <option [ngValue]="null" disabled>Selecione o time campeão</option>
                    @for (team of teamCards(); track team.id) {
                      <option [ngValue]="team.id">{{ team.jerseyName }}</option>
                    }
                  </select>
                </label>

                <label class="form-field">
                  <span>MVP</span>
                  <select
                    class="form-select"
                    name="clubMemberMvpId"
                    [ngModel]="mvpMemberId()"
                    (ngModelChange)="setMvpMemberId($event)"
                    [disabled]="savingResult()">
                    <option [ngValue]="null" disabled>Selecione o MVP</option>
                    @for (player of mvpCandidates(); track player.id) {
                      <option [ngValue]="player.id">
                        {{ player.name }} - {{ player.position === 'GOAL' ? 'Goleiro' : 'Linha' }}
                      </option>
                    }
                  </select>
                </label>

                <button class="btn-primary result-submit" type="button" [disabled]="!canSaveResult()" (click)="saveResult()">
                  {{ savingResult() ? 'Salvando...' : 'Salvar resultado' }}
                </button>
              </div>
            } @else if (!hasResult()) {
              <div class="empty-msg">Resultado ainda não definido.</div>
            }
          }
        </div>
      }
      
      <!-- Teams section -->
      @if (teams().length > 0) {
        <div class="section-card">
          <div class="section-head">
            <h2>Times Gerados <span class="count">{{ teams().length }}</span></h2>
            <p class="section-hint">Arraste um jogador para outro time para trocar com alguém da mesma posição.</p>
          </div>
          <div class="teams-grid">
            @if (freeGoalkeepersCard()) {
              <app-team-card
                [team]="freeGoalkeepersCard()!"
                [enableSwap]="!swapping()"
                [dropListId]="dropListId(freeGoalkeepersCard()!.id)"
                [connectedDropLists]="teamDropListIds()"
                (swapRequested)="swapMatchPlayers($event)" />
            }

            @for (team of teamCards(); track team.id) {
              <app-team-card
                [team]="team"
                [enableSwap]="!swapping()"
                [dropListId]="dropListId(team.id)"
                [connectedDropLists]="teamDropListIds()"
                (swapRequested)="swapMatchPlayers($event)" />
            }
            
          </div>
        </div>
      } @else {
        <div class="section-card">
          <div class="empty-msg">Nenhum time foi gerado ainda para esta partida.</div>
        </div>
      }
    }

    <app-confirm-dialog
      #confirmDel
      title="Excluir partida"
      message="Tem certeza que deseja excluir esta partida? Todos os times e participantes serão removidos."
      icon="⚠️"
      confirmLabel="Excluir"
      [danger]="true"
      (confirmed)="deleteMatch()" />
  `,
  styles: [`
    .btn-primary {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.5rem 1.2rem; border-radius: 8px; font-weight: 700;
      font-size: 0.85rem; cursor: pointer; text-decoration: none;
      transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.4rem;
      &:hover { filter: brightness(1.1); }
    }

    .btn-danger {
      background: var(--red-dim); border: 1px solid var(--red); color: var(--red);
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
      &:hover { background: var(--red); color: #fff; }
    }

    /* Info row */
    .info-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;
      @media (max-width: 640px) { grid-template-columns: repeat(2, 1fr); }
    }

    .info-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 1rem;
      display: flex; flex-direction: column; gap: 0.3rem;
    }

    .info-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text3); font-weight: 600; }

    .info-val { font-size: 1rem; font-weight: 600; color: var(--text); }

    .status {
      font-size: 0.82rem; padding: 3px 8px; border-radius: 100px;
      background: var(--surface2); color: var(--text3); border: 1px solid var(--border);
      display: inline-flex; align-items: center; width: fit-content;
      &.upcoming { background: var(--accent-dim); color: var(--accent); border-color: rgba(77,255,143,0.3); }
    }

    /* Section card */
    .section-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 12px; padding: 1.5rem;
    }

    .section-head { margin-bottom: 1.25rem; }

    h2 { font-size: 0.95rem; font-weight: 600; color: var(--text);
      display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }

    .count {
      background: var(--accent-dim); color: var(--accent);
      padding: 1px 8px; border-radius: 100px; font-size: 0.78rem;
    }

    .section-hint { font-size: 0.82rem; color: var(--text2); }

    .result-card { margin-bottom: 1.5rem; }

    .result-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap;
    }

    .result-badge {
      background: var(--accent-dim); color: var(--accent);
      border: 1px solid rgba(77,255,143,0.3);
      padding: 0.25rem 0.65rem; border-radius: 999px;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    }

    .result-badge.pending {
      background: var(--surface2); color: var(--text3); border-color: var(--border);
    }

    .result-summary {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem; margin-bottom: 1rem;
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .result-item {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.85rem 1rem;
      display: flex; flex-direction: column; gap: 0.25rem;
    }

    .result-label {
      font-size: 0.72rem; color: var(--text3); font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
    }

    .result-value { font-size: 0.95rem; color: var(--text); font-weight: 700; }

    .result-form {
      display: grid; grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.2fr) auto;
      gap: 0.75rem; align-items: end;
      @media (max-width: 820px) { grid-template-columns: 1fr; }
    }

    .form-field {
      display: flex; flex-direction: column; gap: 0.35rem;
      span { font-size: 0.78rem; color: var(--text2); font-weight: 700; }
    }

    .form-select {
      width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
      border-radius: 8px; color: var(--text); padding: 0.58rem 0.75rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.88rem; outline: none;
      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .result-submit {
      height: 2.35rem; justify-content: center; white-space: nowrap;
      &:disabled { opacity: 0.55; cursor: not-allowed; filter: none; }
    }

    /* Member selector */
    .member-selector {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem; margin-bottom: 1rem;
    }

    .member-chip {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.6rem 0.75rem; border-radius: 10px;
      border: 1px solid var(--border); background: var(--surface);
      cursor: pointer; transition: all 0.15s; position: relative;

      &:hover { border-color: var(--accent); }
      &.selected { border-color: var(--accent); background: var(--accent-dim); }
    }

    .chip-avatar {
      width: 30px; height: 30px; border-radius: 8px;
      background: var(--surface2); color: var(--text2);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; flex-shrink: 0;

      .selected & { background: var(--accent); color: #050f09; }
    }

    .chip-info { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .chip-name { font-size: 0.85rem; font-weight: 600; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chip-pos { font-size: 0.72rem; color: var(--text3); }

    .chip-check {
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--accent); color: #050f09;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700; flex-shrink: 0;
    }

    .selection-summary {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.82rem; color: var(--text2); padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }

    .btn-outline-sm {
      background: none; border: 1px solid var(--border); color: var(--text2);
      padding: 3px 10px; border-radius: 6px; font-size: 0.78rem;
      cursor: pointer; transition: all 0.15s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    .empty-msg { text-align: center; padding: 1.5rem; color: var(--text2); font-size: 0.88rem;
      a { color: var(--accent); &:hover { text-decoration: underline; } }
    }

    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
  `],
})
export class MatchDetailComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly teamsService = inject(TeamsService);
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
    const matchId = this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      match: this.matchesService.getMatch(matchId),
      participants: this.matchesService.getParticipants(matchId),
      teams: this.teamsService.getTeamsByMatch(matchId),
      directorClubs: this.clubsService.getClubs('DIRECTOR'),
    }).subscribe({
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
      club: this.clubsService.getClub(clubId),
      members: this.clubsService.getMembers(clubId, { size: 200 }),
      jerseys: this.clubsService.getJerseys(clubId),
    }).subscribe({
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
    this.matchesService.setResult(match.id, { teamChampionId, clubMemberMvpId }).subscribe({
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
    }).subscribe({
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
    this.matchesService.deleteMatch(id).subscribe({
      next: () => {
        this.toast.success('Partida excluída.');
        this.router.navigate(['/clubs', this.match()!.clubId, 'matches']);
      },
      error: () => this.toast.error('Erro ao excluir partida.'),
    });
  }
}
