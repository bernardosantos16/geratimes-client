import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClubsService } from '../../../core/services/clubs.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClubResponseDTO } from '../../../core/models/api.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clubs-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, PageHeaderComponent,
    LoadingSpinnerComponent, EmptyStateComponent, ConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Clubes" subtitle="Gerencie seus clubes de futebol" eyebrow="Meus Clubes">
      <a routerLink="/clubs/new" class="btn-primary">+ Novo Clube</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-spinner label="Carregando clubes..." />
    } @else if (clubs().length === 0) {
      <app-empty-state
        icon="🏟️"
        title="Nenhum clube ainda"
        message="Crie seu primeiro clube e comece a organizar partidas."
        actionLabel="Criar clube"
        (action)="router.navigate(['/clubs/new'])" />
    } @else {
      <div class="clubs-grid">
        @for (club of clubs(); track club.id) {
          <div class="club-card">
            <div class="card-top">
              <div class="club-avatar">{{ club.nickname[0]?.toUpperCase() }}</div>
              <div class="club-meta">
                <span class="club-name">{{ club.name }}</span>
                <span class="club-nick">{{ '@' + club.nickname }}</span>
              </div>
            </div>
            <div class="card-actions">
              <a [routerLink]="['/clubs', club.id]" class="btn-outline">Ver detalhes</a>
              <a [routerLink]="['/clubs', club.id, 'edit']" class="btn-icon" title="Editar">✏️</a>
              <button class="btn-icon danger" (click)="confirmDelete(club)" title="Excluir">🗑️</button>
            </div>
          </div>
        }
      </div>
    }

    <app-confirm-dialog
      #confirmDialog
      title="Excluir clube"
      message="Tem certeza que deseja excluir este clube? Esta ação não pode ser desfeita."
      icon="⚠️"
      confirmLabel="Excluir"
      [danger]="true"
      (confirmed)="onDeleteConfirmed()" />
  `,
  styles: [`
    .btn-primary {
      background: var(--accent); color: #050f09; border: none;
      padding: 0.55rem 1.25rem; border-radius: 8px; font-weight: 700;
      font-size: 0.88rem; cursor: pointer; text-decoration: none;
      transition: all 0.2s; display: inline-flex; align-items: center;
    }
    .btn-primary:hover { filter: brightness(1.1); }

    .clubs-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .club-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 12px; padding: 1.25rem;
      display: flex; flex-direction: column; gap: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .club-card:hover { border-color: var(--accent); box-shadow: 0 0 20px var(--accent-dim); }

    .card-top { display: flex; align-items: center; gap: 0.75rem; }

    .club-avatar {
      width: 44px; height: 44px; border-radius: 10px;
      background: var(--accent-dim); color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.1rem; flex-shrink: 0;
    }

    .club-meta { display: flex; flex-direction: column; overflow: hidden; }
    .club-name { font-size: 0.95rem; font-weight: 600; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .club-nick { font-size: 0.78rem; color: var(--text3); }

    .card-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: auto; }

    .btn-outline {
      flex: 1; text-align: center; background: none;
      border: 1px solid var(--border); color: var(--text2); padding: 0.45rem 0.75rem;
      border-radius: 6px; font-size: 0.82rem; font-weight: 500;
      text-decoration: none; transition: all 0.2s;
    }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

    .btn-icon {
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 6px; font-size: 0.9rem; cursor: pointer;
      text-decoration: none; transition: all 0.2s;
    }
    .btn-icon:hover { border-color: var(--accent); }
    .btn-icon.danger:hover { border-color: var(--red); background: var(--red-dim); }
  `],
})
export class ClubsListComponent implements OnInit {
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  protected readonly router = inject(Router);

  @ViewChild('confirmDialog') private confirmDialog!: ConfirmDialogComponent;

  readonly loading = signal(true);
  readonly clubs = signal<ClubResponseDTO[]>([]);
  private pendingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.clubsService.getClubs('DIRECTOR').subscribe({
      next: (clubs) => { this.clubs.set(clubs); this.loading.set(false); },
      error: () => { this.toast.error('Erro ao carregar clubes.'); this.loading.set(false); },
    });
  }

  confirmDelete(club: ClubResponseDTO): void {
    this.pendingDeleteId.set(club.id);
    this.confirmDialog.open();
  }

  onDeleteConfirmed(): void {
    const id = this.pendingDeleteId();
    if (!id) return;

    this.clubsService.deleteClub(id).subscribe({
      next: () => {
        this.toast.success('Clube excluído.');
        this.clubs.update((c) => c.filter((club) => club.id !== id));
        this.pendingDeleteId.set(null);
      },
      error: () => this.toast.error('Erro ao excluir clube.'),
    });
  }
}
