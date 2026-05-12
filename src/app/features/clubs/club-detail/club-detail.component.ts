import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClubsService } from '../../../core/services/clubs.service';
import { MatchesService } from '../../../core/services/matches.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClubContextService } from '../../../core/services/club-context.service';
import {
  ClubResponseDTO, ClubMemberResponseDTO, ClubJerseyResponseDTO, MatchResponseDTO
} from '../../../core/models/api.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { JerseyBadgeComponent } from '../../../shared/components/jersey-badge/jersey-badge.component';
import { ClubRolePipe } from '../../../shared/pipes/app.pipes';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';

type Tab = 'members' | 'jerseys' | 'matches';

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    PageHeaderComponent, LoadingSpinnerComponent,
    RatingStarsComponent, JerseyBadgeComponent, ClubRolePipe, DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-spinner label="Carregando clube..." />
    } @else if (club()) {
      <app-page-header
        [title]="club()!.name"
        [subtitle]="'@' + club()!.nickname"
        eyebrow="Clube"
        backLink="/clubs">
        @if (userRole() === 'DIRECTOR') {
          <a [routerLink]="['/clubs', club()!.id, 'edit']" class="btn-outline">✏️ Editar</a>
          <a [routerLink]="['/clubs', club()!.id, 'matches', 'new']" class="btn-primary">+ Nova Partida</a>
        }
      </app-page-header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'members'" (click)="activeTab.set('members')">
          👥 Membros <span class="badge">{{ members().length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'jerseys'" (click)="activeTab.set('jerseys')">
          👕 Camisas <span class="badge">{{ jerseys().length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'matches'" (click)="activeTab.set('matches')">
          ⚽ Partidas <span class="badge">{{ matches().length }}</span>
        </button>
      </div>

      <!-- Members Tab -->
      @if (activeTab() === 'members') {
        <div class="tab-content">
          <!-- Add member form -->
          @if (userRole() === 'DIRECTOR') {
            <div class="mini-form-card">
              <h3>Adicionar membro</h3>
              <form [formGroup]="memberForm" (ngSubmit)="addMember()" class="inline-form">
                <input type="text" formControlName="name" placeholder="Nome do jogador" class="form-input" />
                <div class="rating-inline">
                  <span class="rating-label">Nível:</span>
                  <app-rating-stars
                    [value]="memberForm.get('rating')?.value || 0"
                    [interactive]="true"
                    (ratingChange)="memberForm.patchValue({ rating: $event })" />
                </div>
                <button type="submit" class="btn-primary-sm" [disabled]="memberForm.invalid">
                  Adicionar
                </button>
              </form>
            </div>
          }

          @if (members().length === 0) {
            <div class="empty-msg">Nenhum membro cadastrado.</div>
          } @else {
            <div class="members-table">
              <div class="table-header">
                <span>Nome</span>
                <span>Nível</span>
                <span>Função</span>
                <span>MVP</span>
                <span>Campeão</span>
                <span></span>
              </div>
              @for (member of members(); track member.id) {
                <div class="table-row">
                  <span class="member-name">{{ member.name }}</span>
                  <app-rating-stars [value]="member.rating ?? 0" />
                  <span class="role-badge" [class.director]="member.clubRole === 'DIRECTOR'">
                    {{ member.clubRole | clubRole }}
                  </span>
                  <span class="mvp-count">{{ member.timesMvp ?? 0 }}x</span>
                  <span class="mvp-count">{{ member.timesChampion ?? 0 }}x</span>
                  @if (userRole() === 'DIRECTOR') {
                    <button class="btn-icon-sm danger" (click)="removeMember(member.id)" title="Remover">×</button>
                  } @else {
                    <span></span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Jerseys Tab -->
      @if (activeTab() === 'jerseys') {
        <div class="tab-content">
          <!-- Add jersey form -->
          @if (userRole() === 'DIRECTOR') {
            <div class="mini-form-card">
              <h3>Adicionar camisa</h3>
              <form [formGroup]="jerseyForm" (ngSubmit)="addJersey()" class="inline-form">
                <input type="text" formControlName="name" placeholder="Nome da camisa" class="form-input" />
                <div class="color-pick">
                  <label>Cor:</label>
                  <input type="color" formControlName="hexColor" class="color-input" />
                  <span class="color-val">{{ jerseyForm.get('hexColor')?.value }}</span>
                </div>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="isGoalkeeperJersey" />
                  Goleiro
                </label>
                <button type="submit" class="btn-primary-sm" [disabled]="jerseyForm.invalid">
                  Adicionar
                </button>
              </form>
            </div>
          }

          @if (jerseys().length === 0) {
            <div class="empty-msg">Nenhuma camisa cadastrada.</div>
          } @else {
            <div class="jerseys-grid">
              @for (jersey of jerseys(); track jersey.id) {
                <div class="jersey-card">
<!--                  <div class="jersey-swatch" [style.background]="jersey.hexColor"></div>-->
                  <div class="jersey-info">
<!--                    <span class="jersey-name">{{ jersey.name }}</span>-->
                    <app-jersey-badge [name]="jersey.name" [hexColor]="jersey.hexColor" [isGoalkeeper]="jersey.isGoalkeeperJersey" />
                  </div>
                  @if (userRole() === 'DIRECTOR') {
                    <button class="btn-icon-sm danger" (click)="deleteJersey(jersey.id)" title="Excluir">×</button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Matches Tab -->
      @if (activeTab() === 'matches') {
        <div class="tab-content">
          <div class="tab-header">
            <h3>Partidas do clube</h3>
            <a [routerLink]="['/clubs', clubId, 'matches']" class="btn-link">Ver todas ›</a>
          </div>
          @if (matches().length === 0) {
            <div class="empty-msg">Nenhuma partida cadastrada.</div>
          } @else {
            <div class="matches-list">
              @for (match of matches(); track match.id) {
                <a [routerLink]="['/matches', match.id]" class="match-row">
                  <div class="match-date-block">
                    <span class="match-day">{{ match.dateTime | date:'dd/MM/yyyy' }}</span>
                    <span class="match-full">{{ match.dateTime | date:'HH:mm' }}</span>
                  </div>
                  <span class="arrow">›</span>
                </a>
              }
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    .btn-primary {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.5rem 1.2rem; border-radius: 8px; font-weight: 700;
      font-size: 0.85rem; cursor: pointer; text-decoration: none;
      transition: all 0.2s; display: inline-flex; align-items: center;
      &:hover { filter: brightness(1.1); }
    }

    .btn-outline {
      background: none; border: 1px solid var(--border); color: var(--text2);
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem;
      font-weight: 500; text-decoration: none; transition: all 0.2s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    /* Tabs */
    .tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }

    .tab {
      display: flex; align-items: center; gap: 0.5rem;
      background: none; border: none; color: var(--text2);
      padding: 0.75rem 1.25rem; font-size: 0.9rem; font-weight: 500;
      cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s;
      &:hover { color: var(--text); }
      &.active { color: var(--accent); border-bottom-color: var(--accent); }
    }

    .badge {
      background: var(--surface2); border: 1px solid var(--border);
      padding: 1px 7px; border-radius: 100px; font-size: 0.72rem; color: var(--text3);
    }

    /* Mini form */
    .mini-form-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;
      h3 { font-size: 0.88rem; font-weight: 600; color: var(--text2); margin-bottom: 0.75rem; }
    }

    .inline-form {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
    }

    .form-input {
      background: var(--input-bg); border: 1px solid var(--input-border);
      border-radius: 8px; color: var(--text); font-family: 'DM Sans', sans-serif;
      font-size: 0.88rem; padding: 0.55rem 0.85rem; outline: none;
      flex: 1; min-width: 180px;
      &::placeholder { color: var(--text3); }
      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
    }

    .rating-inline { display: flex; align-items: center; gap: 0.5rem; }
    .rating-label { font-size: 0.82rem; color: var(--text2); }

    .btn-primary-sm {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 700;
      font-size: 0.82rem; cursor: pointer; white-space: nowrap;
      &:hover:not(:disabled) { filter: brightness(1.1); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    /* Members table */
    .members-table { display: flex; flex-direction: column; gap: 0.25rem; }

    .table-header {
      /* Adicionado mais um 'auto' para representar a 6ª coluna (Campeão) */
      display: grid; grid-template-columns: 1fr auto auto auto auto 32px;
      padding: 0.4rem 0.75rem; gap: 1rem;
      font-size: 0.75rem; font-weight: 600; color: var(--text3);
      letter-spacing: 0.05em; text-transform: uppercase;
    }

    .table-row {
      /* Adicionado mais um 'auto' para representar a 6ª coluna (Campeão) */
      display: grid; grid-template-columns: 1fr auto auto auto auto 32px;
      padding: 0.6rem 0.75rem; gap: 1rem; align-items: center;
      border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border);
      transition: border-color 0.15s;
      &:hover { border-color: var(--border-strong); }
    }

    .member-name { font-size: 0.88rem; font-weight: 500; color: var(--text); }

    .role-badge {
      display: inline-flex; padding: 2px 8px; border-radius: 100px;
      font-size: 0.72rem; font-weight: 600;
      background: var(--surface2); color: var(--text3); border: 1px solid var(--border);
      &.director { background: var(--accent-dim); color: var(--accent); border-color: rgba(77,255,143,0.3); }
    }

    .mvp-count { font-size: 0.82rem; color: var(--yellow); font-weight: 600; }

    .btn-icon-sm {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border); border-radius: 6px;
      cursor: pointer; font-size: 1rem; color: var(--text3); transition: all 0.15s;
      &.danger:hover { border-color: var(--red); color: var(--red); background: var(--red-dim); }
    }

    /* Jerseys grid */
    .jerseys-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem;
    }

    .jersey-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 1rem; display: flex; align-items: center; gap: 0.75rem;
      transition: border-color 0.15s;
      &:hover { border-color: var(--border-strong); }
    }

    .jersey-swatch {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.15); box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .jersey-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; overflow: hidden; }
    .jersey-name { font-size: 0.85rem; font-weight: 600; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Color picker */
    .color-pick { display: flex; align-items: center; gap: 0.4rem;
      label { font-size: 0.82rem; color: var(--text2); } }
    .color-input { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 6px;
      cursor: pointer; background: none; padding: 2px; }
    .color-val { font-size: 0.75rem; color: var(--text3); font-family: monospace; }

    .checkbox-label {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.85rem; color: var(--text2); cursor: pointer;
      input { cursor: pointer; accent-color: var(--accent); }
    }

    .empty-msg { text-align: center; padding: 2rem; color: var(--text2); font-size: 0.9rem; }

    /* Matches list */
    .matches-list {
      display: flex; flex-direction: column; gap: 0.5rem;
    }

    .match-row {
      display: grid; grid-template-columns: auto 1fr;
      padding: 0.6rem 0.75rem; align-items: center;
      border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border);
      transition: border-color 0.15s;
      text-decoration: none; color: var(--text);
      &:hover { border-color: var(--border-strong); }
    }

    .match-date-block {
      display: flex; flex-direction: column; align-items: flex-start;
    }

    .match-day {
      font-size: 0.85rem; font-weight: 600; color: var(--text);
    }

    .match-full {
      font-size: 0.75rem; color: var(--text3);
    }

    .arrow {
      font-size: 1.2rem; color: var(--accent);
    }

    /* Matches tab header */
    .tab-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem;
    }

    .btn-link {
      font-size: 0.85rem; color: var(--accent); text-decoration: none;
      transition: color 0.15s;
      &:hover { color: var(--accent-dim); }
    }
  `],
})
export class ClubDetailComponent implements OnInit {
  private readonly clubsService = inject(ClubsService);
  private readonly matchesService = inject(MatchesService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly clubContextService = inject(ClubContextService);

  readonly loading = signal(true);
  readonly club = signal<ClubResponseDTO | null>(null);
  readonly members = signal<ClubMemberResponseDTO[]>([]);
  readonly jerseys = signal<ClubJerseyResponseDTO[]>([]);
  readonly matches = signal<MatchResponseDTO[]>([]);
  readonly activeTab = signal<Tab>('members');
  readonly userRole = signal<'DIRECTOR' | 'MEMBER' | null>(null);

  clubId!: string;

  readonly memberForm = this.fb.group({
    name:   ['', [Validators.required, Validators.maxLength(250)]],
    rating: [3,  [Validators.min(1), Validators.max(5)]],
  });

  readonly jerseyForm = this.fb.group({
    name:               ['', [Validators.required, Validators.maxLength(100)]],
    hexColor:           ['#4dff8f', [Validators.required, Validators.pattern(/^#?[0-9a-fA-F]{6}$/)]],
    isGoalkeeperJersey: [false],
  });

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id')!;
    this.userRole.set(this.clubContextService.selectedClubRole());
    forkJoin({
      club:    this.clubsService.getClub(this.clubId),
      members: this.clubsService.getMembers(this.clubId, { size: 100 }),
      jerseys: this.clubsService.getJerseys(this.clubId),
      matches: this.matchesService.getMatchesByClub(this.clubId, { size: 100 }),
    }).subscribe({
      next: ({ club, members, jerseys, matches }) => {
        this.club.set(club);
        this.members.set(members.content);
        this.jerseys.set(jerseys);
        this.matches.set(matches.content);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar dados do clube.');
        this.loading.set(false);
      },
    });
  }

  addMember(): void {
    if (this.memberForm.invalid) return;
    this.clubsService.addMember(this.clubId, this.memberForm.getRawValue() as any).subscribe({
      next: (m) => {
        this.members.update((arr) => [...arr, m]);
        this.memberForm.reset({ name: '', rating: 3 });
        this.toast.success('Membro adicionado!');
      },
      error: () => this.toast.error('Erro ao adicionar membro.'),
    });
  }

  removeMember(id: number): void {
    this.clubsService.removeMember(this.clubId, id).subscribe({
      next: () => {
        this.members.update((arr) => arr.filter((m) => m.id !== id));
        this.toast.success('Membro removido.');
      },
      error: () => this.toast.error('Erro ao remover membro.'),
    });
  }

  addJersey(): void {
    if (this.jerseyForm.invalid) return;
    this.clubsService.addJersey(this.clubId, this.jerseyForm.getRawValue() as any).subscribe({
      next: (j) => {
        this.jerseys.update((arr) => [...arr, j]);
        this.jerseyForm.reset({ name: '', hexColor: '#4dff8f', isGoalkeeperJersey: false });
        this.toast.success('Camisa adicionada!');
      },
      error: () => this.toast.error('Erro ao adicionar camisa.'),
    });
  }

  deleteJersey(id: number): void {
    this.clubsService.deleteJersey(this.clubId, id).subscribe({
      next: () => {
        this.jerseys.update((arr) => arr.filter((j) => j.id !== id));
        this.toast.success('Camisa removida.');
      },
      error: () => this.toast.error('Erro ao remover camisa.'),
    });
  }
}
