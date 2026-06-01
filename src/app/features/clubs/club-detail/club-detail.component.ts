import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClubsService } from '@core/services/clubs.service';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';
import { ClubContextService } from '@core/services/club-context.service';
import {
  ClubResponseDTO, ClubMemberResponseDTO, ClubJerseyResponseDTO, MatchResponseDTO, ClubRole
} from '@core/models/api.models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { SquareRatingComponent } from '@shared/components/square-rating/square-rating.component';
import { JerseyBadgeComponent } from '@shared/components/jersey-badge/jersey-badge.component';
import { ClubRolePipe } from '@shared/pipes/app.pipes';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import {ConfirmDialogComponent} from "@shared/components/confirm-dialog/confirm-dialog.component";
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";

type Tab = 'members' | 'jerseys' | 'matches';

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    PageHeaderComponent, LoadingSpinnerComponent,
    SquareRatingComponent, JerseyBadgeComponent, ClubRolePipe, DatePipe, ConfirmDialogComponent, SvgIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-spinner label="Carregando clube..."/>
    } @else if (club()) {
      <app-page-header
          [title]="club()!.name"
          [subtitle]="'@' + club()!.nickname"
          eyebrow="Clube"
          backLink="/clubs">
        @if (userRole() === 'DIRECTOR') {
          <a [routerLink]="['/clubs', club()!.id, 'edit']" class="btn-outline">
            <app-svg-icon
                name='edit'
                size='20px'
                ariaLabel='Edit icon'>
            </app-svg-icon>
            Editar
          </a>
          <a [routerLink]="['/clubs', club()!.id, 'matches', 'new']" class="btn-primary">+ Nova Partida</a>
        }
      </app-page-header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'members'" (click)="activeTab.set('members')">
          <app-svg-icon
              name='groups'
              ariaLabel='Group icon'>
          </app-svg-icon> 
          Membros <span class="badge">{{ members().length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'jerseys'" (click)="activeTab.set('jerseys')">
          <app-svg-icon
              name='apparel'
              ariaLabel='Apparel icon'>
          </app-svg-icon>
          Camisas <span class="badge">{{ jerseys().length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'matches'" (click)="activeTab.set('matches')">
          <app-svg-icon
              name='soccer_ball'
              ariaLabel='Ball icon'>
          </app-svg-icon>
          Partidas <span class="badge">{{ matches().length }}</span>
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
                <input type="text" formControlName="name" placeholder="Nome do jogador"
                       class="form-input"/>
                <div class="rating-inline">
                  <span class="rating-label">Nível:</span>
                  <app-square-rating
                      [value]="memberForm.get('rating')?.value || 0"
                      [interactive]="true"
                      (ratingChange)="memberForm.patchValue({ rating: $event })">
                  </app-square-rating>
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
                <span class="col-name">Nome</span>
                @if (userRole() === 'DIRECTOR') {
                    <span class="col-rating">Nível</span>
                }
                <span class="col-stat">MVP</span>
                <span class="col-stat">Campeão</span>
              </div>
              @for (member of members(); track member.id) {
                <div class="table-row" [class.clickable]="userRole() === 'DIRECTOR'" 
                     (click)="userRole() === 'DIRECTOR' && openEditMember(member)">
                  <span class="member-name">{{ member.name }}
                    @if (member.clubRole === 'DIRECTOR') {
                      <span class="role-badge" [class.director]="member.clubRole === 'DIRECTOR'">
                    {{ member.clubRole | clubRole }}
                      </span>
                    }
                  </span>
                  @if (userRole() === 'DIRECTOR') {
                    <app-square-rating [value]="member.rating ?? 0"/>
                  }
                  <span class="mvp-count">{{ member.timesMvp ?? 0 }}x</span>
                  <span class="mvp-count">{{ member.timesChampion ?? 0 }}x</span>
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
                <input type="text" formControlName="name" placeholder="Nome da camisa"
                       class="form-input"/>
                <div class="color-pick">
                  <label>Cor:</label>
                  <input type="color" formControlName="hexColor" class="color-input"/>
                  <span class="color-val">{{ jerseyForm.get('hexColor')?.value }}</span>
                </div>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="isGoalkeeperJersey"/>
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
                    <app-jersey-badge [name]="jersey.name" [hexColor]="jersey.hexColor"
                                      [isGoalkeeper]="jersey.isGoalkeeperJersey"/>
                  </div>
                  @if (userRole() === 'DIRECTOR') {
                    <button class="btn-icon-sm danger" (click)="deleteJersey(jersey.id)"
                            title="Excluir">×
                    </button>
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
            <h3>Próximas partidas do clube</h3>
            <a [routerLink]="['/clubs', clubId, 'matches']" class="btn-link">Ver todas ›</a>
          </div>
          @if (matches().length === 0) {
            <div class="empty-msg">Nenhuma partida por vir</div>
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

    <!-- Edit Member Modal -->
    @if (editingMember()) {
      <div class="modal-backdrop" (click)="closeEditMember()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Editar Membro</h2>
            <button class="modal-close" (click)="closeEditMember()">×</button>
          </div>

          <form [formGroup]="editMemberForm" class="modal-body">
            <div class="form-group">
              <label>Nome</label>
              <input type="text" formControlName="name" class="form-input" />
            </div>

            <div class="form-group">
              <label>Nível</label>
              <app-square-rating
                [value]="editMemberForm.get('rating')?.value || 0"
                [interactive]="true"
                (ratingChange)="editMemberForm.patchValue({ rating: $event })">
              </app-square-rating>
            </div>

            <div class="form-group">
              <label>Vezes MVP</label>
              <input type="number" formControlName="timesMvp" class="form-input" min="0" />
            </div>

            <div class="form-group">
              <label>Vezes Campeão</label>
              <input type="number" formControlName="timesChampion" class="form-input" min="0" />
            </div>
          </form>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeEditMember()">Cancelar</button>
            <button class="btn-primary" 
                    [disabled]="editMemberForm.invalid" 
                    (click)="saveMemberChanges()">
              Salvar
            </button>
            @if (editingMember()?.clubRole !== 'DIRECTOR') {
              <button class="btn-danger" (click)="deleteMemberConfirm()">Excluir</button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Delete Member Confirmation -->
    <app-confirm-dialog
      #confirmDeleteMember
      title="Excluir membro"
      message="Tem certeza que deseja excluir este membro?"
      icon="⚠️"
      confirmLabel="Excluir"
      [danger]="true"
      (confirmed)="deleteSelectedMember()" />
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
    .members-table {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-x: auto;
      padding-bottom: 0.15rem;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 86px 112px 68px 88px;
      gap: 1rem;
      align-items: center;
      min-width: 680px;
    }

    .table-header {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem; font-weight: 600; color: var(--text3);
      letter-spacing: 0.05em; text-transform: uppercase;
    }

    .table-row {
      padding: 0.6rem 0.75rem;
      border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border);
      transition: border-color 0.15s;
      &:hover { border-color: var(--border-strong); }
      &.clickable { cursor: pointer; &:hover { border-color: var(--accent); } }
    }

    .col-rating,
    app-square-rating,
    .role-badge,
    .mvp-count {
      justify-self: start;
    }

    .col-stat,
    .mvp-count {
      justify-self: center;
    }


    .member-name {
      min-width: 0;
      font-size: 0.88rem; font-weight: 500; color: var(--text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

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

    .jersey-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; overflow: hidden; }

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

    /* Modal styles */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      z-index: 400; display: flex; align-items: center; justify-content: center;
    }

    .modal-dialog {
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      max-width: 420px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideUp 0.2s ease;
    }

    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem; border-bottom: 1px solid var(--border);
      h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text); }
    }

    .modal-close {
      background: none; border: none; font-size: 1.5rem; color: var(--text3);
      cursor: pointer; transition: color 0.15s; padding: 0;
      &:hover { color: var(--text); }
    }

    .modal-body {
      padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
    }

    .form-group {
      display: flex; flex-direction: column; gap: 0.5rem;
      label { font-size: 0.82rem; font-weight: 600; color: var(--text2); }
    }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding: 1.5rem; border-top: 1px solid var(--border);
    }

    .btn-cancel {
      background: var(--surface2); border: 1px solid var(--border); color: var(--text2);
      padding: 0.55rem 1.4rem; border-radius: 6px; font-weight: 600; font-size: 0.88rem;
      cursor: pointer; transition: all 0.2s;
      &:hover { border-color: var(--text3); color: var(--text); }
    }

    .btn-primary {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.55rem 1.4rem; border-radius: 6px; font-weight: 600; font-size: 0.88rem;
      cursor: pointer; transition: all 0.2s;
      &:hover:not(:disabled) { filter: brightness(1.1); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-danger {
      background: var(--red-dim); border: 1px solid var(--red); color: var(--red);
      padding: 0.55rem 1.4rem; border-radius: 6px; font-weight: 600; font-size: 0.88rem;
      cursor: pointer; transition: all 0.2s;
      &:hover { background: var(--red); color: #fff; }
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

  @ViewChild('confirmDeleteMember') confirmDeleteMember: any;

  readonly loading = signal(true);
  readonly club = signal<ClubResponseDTO | null>(null);
  readonly members = signal<ClubMemberResponseDTO[]>([]);
  readonly jerseys = signal<ClubJerseyResponseDTO[]>([]);
  readonly matches = signal<MatchResponseDTO[]>([]);
  readonly activeTab = signal<Tab>('members');
  readonly userRole = signal<'DIRECTOR' | 'MEMBER' | null>(null);
  readonly editingMember = signal<ClubMemberResponseDTO | null>(null);
  private memberToDelete = signal<ClubMemberResponseDTO | null>(null);

  clubId!: string;

  readonly memberForm = this.fb.group({
    name:   ['', [Validators.required, Validators.maxLength(250)]],
    rating: [3,  [Validators.min(1), Validators.max(5)]],
  });

  readonly editMemberForm = this.fb.group({
    name:          ['', [Validators.required, Validators.maxLength(250)]],
    rating:        [1, [Validators.min(1), Validators.max(5)]],
    timesMvp:      [0, [Validators.min(0)]],
    timesChampion: [0, [Validators.min(0)]],
  });

  readonly jerseyForm = this.fb.group({
    name:               ['', [Validators.required, Validators.maxLength(100)]],
    hexColor:           ['#4dff8f', [Validators.required, Validators.pattern(/^#?[0-9a-fA-F]{6}$/)]],
    isGoalkeeperJersey: [false],
  });

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id')!;
    const contextRole = this.getRoleFromContext();
    if (contextRole) {
      this.userRole.set(contextRole);
    }

    forkJoin({
      club:    this.clubsService.getClub(this.clubId),
      members: this.clubsService.getMembers(this.clubId, { size: 100 }),
      jerseys: this.clubsService.getJerseys(this.clubId),
      matches: this.matchesService.getMatchesByClubAndUpcoming(this.clubId, { size: 100 }),
      directorClubs: this.clubsService.getClubs('DIRECTOR'),
      memberClubs: this.clubsService.getClubs('MEMBER'),
    }).subscribe({
      next: ({ club, members, jerseys, matches, directorClubs, memberClubs }) => {
        this.club.set(club);
        this.members.set(members.content);
        this.jerseys.set(jerseys);
        this.matches.set(matches.content);
        const resolvedRole =
          this.resolveRoleFromClubLists(directorClubs, memberClubs) ?? this.getRoleFromContext();
        this.userRole.set(resolvedRole);
        if (resolvedRole) {
          this.clubContextService.setClubContext(this.clubId, resolvedRole);
        }
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


  openEditMember(member: ClubMemberResponseDTO): void {
    this.editingMember.set(member);
    this.editMemberForm.patchValue({
      name: member.name,
      rating: member.rating ?? 1,
      timesMvp: member.timesMvp ?? 0,
      timesChampion: member.timesChampion ?? 0,
    });
  }

  closeEditMember(): void {
    this.editingMember.set(null);
    this.editMemberForm.reset();
  }

  saveMemberChanges(): void {
    if (!this.editingMember() || this.editMemberForm.invalid) return;

    const memberId = this.editingMember()!.id;
    const formValue = this.editMemberForm.getRawValue();

    this.clubsService.updateMember(this.clubId, memberId, {
      name: formValue.name,
      rating: formValue.rating,
      timesMvp: formValue.timesMvp,
      timesChampion: formValue.timesChampion,
    } as any).subscribe({
      next: (updatedMember) => {
        this.members.update((arr) =>
          arr.map((m) => m.id === memberId ? updatedMember : m)
        );
        this.closeEditMember();
        this.toast.success('Membro atualizado!');
      },
      error: () => this.toast.error('Erro ao atualizar membro.'),
    });
  }

  deleteMemberConfirm(): void {
    if (!this.editingMember()) return;
    this.memberToDelete.set(this.editingMember());
    this.confirmDeleteMember?.open?.();
  }

  deleteSelectedMember(): void {
    const member = this.memberToDelete();
    if (!member) return;

    this.clubsService.removeMember(this.clubId, member.id).subscribe({
      next: () => {
        this.members.update((arr) => arr.filter((m) => m.id !== member.id));
        this.closeEditMember();
        this.memberToDelete.set(null);
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

  private getRoleFromContext(): ClubRole | null {
    const selectedClubId = this.clubContextService.selectedClubId();
    if (selectedClubId !== this.clubId) {
      return null;
    }
    return this.clubContextService.selectedClubRole();
  }

  private resolveRoleFromClubLists(
    directorClubs: ClubResponseDTO[],
    memberClubs: ClubResponseDTO[]
  ): ClubRole | null {
    if (directorClubs.some((club) => club.id === this.clubId)) {
      return 'DIRECTOR';
    }
    if (memberClubs.some((club) => club.id === this.clubId)) {
      return 'MEMBER';
    }
    return null;
  }
}
