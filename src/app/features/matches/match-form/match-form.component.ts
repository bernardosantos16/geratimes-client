import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchesService } from '../../../core/services/matches.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Nova Partida"
      subtitle="Agende uma nova partida para o seu clube."
      [backLink]="backLink()" />

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-body">
          <div class="form-group">
            <label for="dateTime">Data e hora *</label>
            <input
              id="dateTime"
              type="datetime-local"
              formControlName="dateTime"
              class="form-input" />
            @if (f['dateTime'].invalid && f['dateTime'].touched) {
              <span class="form-error">Data e hora são obrigatórias</span>
            }
          </div>
        </div>

        @if (serverError()) {
          <div class="server-error">{{ serverError() }}</div>
        }

        <div class="form-actions">
          <a [routerLink]="backLink()" class="btn-cancel">Cancelar</a>
          <button type="submit" class="btn-submit" [disabled]="loading() || form.invalid">
            @if (loading()) { <span class="spinner"></span> }
            {{ loading() ? 'Agendando...' : 'Agendar partida' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem; max-width: 520px;
    }

    .form-body { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.35rem;
      label { font-size: 0.82rem; font-weight: 500; color: var(--text2); } }

    .form-input, .form-select {
      background: var(--input-bg); border: 1px solid var(--input-border);
      border-radius: 8px; color: var(--text); font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem; padding: 0.65rem 0.9rem; outline: none; width: 100%;
      transition: border-color 0.15s, box-shadow 0.15s;
      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }

      option { background: var(--surface); }
    }

    .form-error { font-size: 0.75rem; color: var(--red); }

    .server-error {
      background: var(--red-dim); border: 1px solid var(--red);
      border-radius: 8px; padding: 0.65rem 0.9rem;
      font-size: 0.85rem; color: var(--red); margin-bottom: 1rem;
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
export class MatchFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly matchesService = inject(MatchesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly backLink = signal<string>('');

  private clubId!: string;

  readonly form = this.fb.group({
    dateTime: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id')!;
    console.log('Club ID:', this.clubId);
    this.backLink.set('/clubs/' + this.clubId);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');

    const { dateTime } = this.form.getRawValue();
    const dto = {
      clubId: this.clubId,
      dateTime: new Date(dateTime!).toISOString(),
    };

    this.matchesService.createMatch(dto).subscribe({
      next: (match) => {
        this.toast.success('Partida agendada!');
        this.router.navigate(['/matches', match.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao agendar partida.');
      },
    });
  }
}
