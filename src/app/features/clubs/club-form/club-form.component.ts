import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="isEdit() ? 'Editar Clube' : 'Novo Clube'"
      [subtitle]="isEdit() ? 'Atualize as informações do clube.' : 'Preencha os dados do novo clube.'"
      backLink="/clubs" />

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-grid">
          <div class="form-group full">
            <label for="name">Nome do clube *</label>
            <input id="name" type="text" formControlName="name"
              placeholder="Ex: Ferino FC" class="form-input" />
            @if (f['name'].invalid && f['name'].touched) {
              <span class="form-error">Nome é obrigatório</span>
            }
          </div>

          <div class="form-group full">
            <label for="nickname">
              Apelido
              <span class="hint">(usado para identificação)</span>
            </label>
            <input id="nickname" type="text" formControlName="nickname"
              placeholder="Ex: ferino" class="form-input" />
            @if (f['nickname'].invalid && f['nickname'].touched) {
              <span class="form-error">Apelido deve ter entre 3 e 24 caracteres</span>
            }
          </div>
        </div>

        @if (serverError()) {
          <div class="server-error">{{ serverError() }}</div>
        }

        <div class="form-actions">
          <a routerLink="/clubs" class="btn-cancel">Cancelar</a>
          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            {{ loading() ? 'Salvando...' : (isEdit() ? 'Salvar alterações' : 'Criar clube') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem; max-width: 560px;
    }

    .form-grid { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }

    .form-group {
      display: flex; flex-direction: column; gap: 0.35rem;
      &.full { grid-column: 1 / -1; }

      label { font-size: 0.82rem; font-weight: 500; color: var(--text2); letter-spacing: 0.02em; }
    }

    .hint { font-weight: 400; color: var(--text3); margin-left: 0.25rem; }

    .form-input {
      background: var(--input-bg); border: 1px solid var(--input-border);
      border-radius: 8px; color: var(--text); font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem; padding: 0.65rem 0.9rem; outline: none; width: 100%;
      transition: border-color 0.15s, box-shadow 0.15s;
      &::placeholder { color: var(--text3); }
      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
    }

    .form-error { font-size: 0.75rem; color: var(--red); }

    .server-error {
      background: var(--red-dim); border: 1px solid var(--red);
      border-radius: 8px; padding: 0.65rem 0.9rem; font-size: 0.85rem;
      color: var(--red); margin-bottom: 1rem;
    }

    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; }

    .btn-cancel {
      background: none; border: 1px solid var(--border); color: var(--text2);
      padding: 0.55rem 1.25rem; border-radius: 8px; font-size: 0.88rem;
      font-weight: 500; text-decoration: none; transition: all 0.2s;
      &:hover { border-color: var(--text3); color: var(--text); }
    }

    .btn-submit {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--accent); color: #050f09; border: none;
      padding: 0.55rem 1.5rem; border-radius: 8px; font-weight: 700;
      font-size: 0.88rem; cursor: pointer; transition: all 0.2s;
      &:hover:not(:disabled) { filter: brightness(1.1); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #050f09; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ClubFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly isEdit = signal(false);
  readonly serverError = signal('');
  private editId: string | null = null;

  readonly form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(1)]],
    nickname: ['', [Validators.minLength(3), Validators.maxLength(24)]],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.isEdit.set(true);
      this.clubsService.getClub(this.editId).subscribe({
        next: (club) => this.form.patchValue(club),
        error: () => { this.toast.error('Clube não encontrado.'); this.router.navigate(['/clubs']); },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');

    const dto = this.form.getRawValue() as any;
    const obs = this.isEdit()
      ? this.clubsService.updateClub(this.editId!, dto)
      : this.clubsService.createClub(dto);

    obs.subscribe({
      next: (club) => {
        this.toast.success(this.isEdit() ? 'Clube atualizado!' : 'Clube criado!');
        this.router.navigate(['/clubs', club.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao salvar clube.');
      },
    });
  }
}
