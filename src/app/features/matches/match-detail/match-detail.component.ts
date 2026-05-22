import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
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
    CommonModule, RouterModule,
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
  private club = signal<ClubResponseDTO | null>(null);

  clubName = () => this.club()?.name ?? '';
  isUpcoming = () => this.match() ? new Date(this.match()!.dateTime) > new Date() : false;
  readonly teamCards = computed<TeamUiModel[]>(() =>
    this.teams().map((team, index) => this.toTeamCardModel(team, index))
  );
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
    }).subscribe({
      next: ({ match, participants, teams }) => {
        this.match.set(match);
        this.participants.set(participants);
        this.teams.set(teams.content);
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
