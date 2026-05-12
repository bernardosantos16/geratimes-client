import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { CreateUserRequestDTO } from '../../../core/models/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">FERINO</div>
          <h1>Criar conta</h1>
          <p>Comece a organizar seu futebol agora.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="name">Nome completo</label>
              <input id="name" type="text" formControlName="name" placeholder="João da Silva" class="form-input" />
              @if (f['name'].invalid && f['name'].touched) {
                <span class="form-error">Nome é obrigatório</span>
              }
            </div>
            <div class="form-group">
              <label for="nickname">Apelido</label>
              <input id="nickname" type="text" formControlName="nickname" placeholder="joao123" class="form-input" />
              @if (f['nickname'].invalid && f['nickname'].touched) {
                <span class="form-error">Apelido inválido (máx 100)</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="login">E-mail</label>
            <input id="login" type="email" formControlName="login" placeholder="seu@email.com" autocomplete="email" class="form-input" />
            @if (f['login'].invalid && f['login'].touched) {
              <span class="form-error">E-mail inválido</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <div class="input-wrap">
              <input
                id="password"
                [type]="showPw() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                class="form-input" />
              <button type="button" class="toggle-pw" (click)="showPw.update(v => !v)">
                {{ showPw() ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (f['password'].invalid && f['password'].touched) {
              <span class="form-error">Senha deve ter entre 8 e 72 caracteres</span>
            }
          </div>

          @if (serverError()) {
            <div class="server-error">{{ serverError() }}</div>
          }

          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            {{ loading() ? 'Criando conta...' : 'Criar conta' }}
          </button>
        </form>

        <p class="auth-footer">
          Já tem conta? <a routerLink="/auth/login">Entrar</a>
        </p>
      </div>
      <div class="auth-bg"><div class="bg-glow"></div></div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: 2rem 1rem;
      background: var(--bg); position: relative; overflow: hidden;
    }
    .auth-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .bg-glow {
      position: absolute; top: -30%; left: 50%; transform: translateX(-50%);
      width: 600px; height: 600px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
      opacity: 0.5;
    }
    .auth-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2.5rem 2rem;
      width: 100%; max-width: 480px; position: relative; z-index: 1;
      animation: fadeUp 0.4s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .auth-header { text-align: center; margin-bottom: 2rem;
      .auth-logo { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem;
        letter-spacing: 0.08em; color: var(--accent); margin-bottom: 0.75rem; }
      h1 { font-size: 1.3rem; font-weight: 700; color: var(--text); margin-bottom: 0.35rem; }
      p  { font-size: 0.88rem; color: var(--text2); }
    }
    .auth-form { display: flex; flex-direction: column; gap: 1.2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem;
      label { font-size: 0.82rem; font-weight: 500; color: var(--text2); letter-spacing: 0.02em; }
    }
    .input-wrap { position: relative; }
    .form-input {
      width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
      border-radius: 8px; color: var(--text); font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem; padding: 0.65rem 0.9rem;
      transition: border-color 0.15s, box-shadow 0.15s; outline: none;
      &::placeholder { color: var(--text3); }
      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
    }
    .input-wrap .form-input { padding-right: 2.8rem; }
    .toggle-pw { position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; }
    .form-error { font-size: 0.75rem; color: var(--red); }
    .server-error {
      background: var(--red-dim); border: 1px solid var(--red);
      border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 0.85rem; color: var(--red);
    }
    .btn-submit {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; background: var(--accent); color: #050f09; border: none;
      padding: 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem;
      cursor: pointer; transition: filter 0.2s, transform 0.2s; margin-top: 0.25rem;
      &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #050f09; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.88rem; color: var(--text2);
      a { color: var(--accent); font-weight: 500; &:hover { text-decoration: underline; } }
    }
  `],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly showPw = signal(false);
  readonly serverError = signal('');

  readonly form = this.fb.group({
    name:     ['', [Validators.required, Validators.maxLength(250)]],
    nickname: ['', [Validators.required, Validators.maxLength(100)]],
    login:    ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.serverError.set('');

    const dto = this.form.getRawValue() as CreateUserRequestDTO;

    this.usersService.createUser(dto).pipe(
      switchMap(() => this.authService.login({ login: dto.login, password: dto.password }))
    ).subscribe({
      next: () => {
        this.toast.success('Conta criada! Bem-vindo ao Ferino.');
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 409) {
          this.serverError.set('E-mail ou apelido já cadastrado.');
        } else {
          this.serverError.set('Erro ao criar conta. Tente novamente.');
        }
      },
    });
  }
}
