import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
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
import {MatchDatePipe, MatchPositionPipe} from '@shared/pipes/app.pipes';
import {forkJoin} from 'rxjs';
import {TeamsService} from "@core/services/teams.service";

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    PageHeaderComponent, LoadingSpinnerComponent, ConfirmDialogComponent,
    MatchDatePipe, MatchPositionPipe,
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

      <!-- Participants section -->
<!--      <div class="section-card">-->
<!--        <div class="section-head">-->
<!--          <h2>Participantes <span class="count">{{ participants().length }}</span></h2>-->
<!--          <p class="section-hint">Selecione os membros que participarão desta partida para gerar os times.</p>-->
<!--        </div>-->

<!--        @if (loadingMembers()) {-->
<!--          <app-loading-spinner [size]="24" />-->
<!--        } @else if (clubMembers().length === 0) {-->
<!--          <div class="empty-msg">Nenhum membro no clube. <a [routerLink]="['/clubs', match()!.clubId]">Adicionar membros →</a></div>-->
<!--        } @else {-->
<!--          <div class="member-selector">-->
<!--            @for (member of clubMembers(); track member.id) {-->
<!--              <div-->
<!--                class="member-chip"-->
<!--                [class.selected]="isSelected(member.id)"-->
<!--                (click)="toggleMember(member)">-->
<!--                <div class="chip-avatar">{{ member.name[0].toUpperCase() }}</div>-->
<!--                <div class="chip-info">-->
<!--                  <span class="chip-name">{{ member.name }}</span>-->
<!--                  <span class="chip-pos">{{ getPosition(member.id) | matchPosition }}</span>-->
<!--                </div>-->
<!--                @if (isSelected(member.id)) {-->
<!--                  <span class="chip-check">✓</span>-->
<!--                }-->
<!--              </div>-->
<!--            }-->
<!--          </div>-->

<!--          <div class="selection-summary">-->
<!--            <span>{{ selectedIds().size }} selecionados</span>-->
<!--            <button class="btn-outline-sm" (click)="selectAll()">Todos</button>-->
<!--            <button class="btn-outline-sm" (click)="clearAll()">Limpar</button>-->
<!--          </div>-->
<!--        }-->
<!--      </div>-->

      <!-- Teams section -->
      @if (teams().length > 0) {
        <div class="section-card">
          <div class="section-head">
            <h2>Times Gerados <span class="count">{{ teams().length }}</span></h2>
          </div>
          @for (team of teams(); track team.id) {
            <div class="team-card">
              <h3>{{ getJerseyName(team.clubJerseyId) }}</h3>
              <div class="team-players">
                @for (player of getTeamPlayers(team.id); track player.id) {
                  <div class="player-chip">
                    {{ getMemberName(player.clubMemberId) }} ({{ player.position | matchPosition }})
                  </div>
                }
              </div>
            </div>
          }
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

    /* Team styles */
    .team-card { margin-bottom: 1rem; }
    .team-card h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; }
    .team-players { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .player-chip { background: var(--surface); padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.75rem; border: 1px solid var(--border); }
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
  readonly match = signal<MatchResponseDTO | null>(null);
  readonly participants = signal<MatchParticipantResponseDTO[]>([]);
  readonly clubMembers = signal<ClubMemberResponseDTO[]>([]);
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly teams = signal<TeamResponseDTO[]>([]);
  readonly jerseys = signal<ClubJerseyResponseDTO[]>([]);
  private club = signal<ClubResponseDTO | null>(null);

  clubName = () => this.club()?.name ?? '';
  isUpcoming = () => this.match() ? new Date(this.match()!.dateTime) > new Date() : false;

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
